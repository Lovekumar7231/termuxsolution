// --- GLOBAL VARIABLES ---
let currentUser = null; // Username (e.g., "Agent47")
let currentUserKey = null; // Safe Database Key (e.g., "agent47")
let isAdmin = false;
let liveUsage = parseInt(localStorage.getItem('liveUsageCount')) || 0;

// PeerJS & Stream Variables
let localStream = null;
let adminPeer = null;
let userPeer = null;
let currentLivePeerId = null; // ID from Firebase

// --- INITIALIZATION ---
function initApp() {
    checkLogin();
    
    // Load Data only if Firebase is ready
    setTimeout(() => {
        loadTools();
        loadCommands();
        loadPrimeContent();
        if(currentUser) loadUserProfile(); // Load profile from DB
        listenForLiveStatus(); // Start listening for live streams
    }, 1500);

    // Daily Limit Reset
    const today = new Date().toDateString();
    if(localStorage.getItem('lastLiveDate') !== today) {
        liveUsage = 0;
        localStorage.setItem('liveUsageCount', 0);
        localStorage.setItem('lastLiveDate', today);
    }
}

// ==========================================
// 👤 USER PROFILE DATABASE LOGIC
// ==========================================

// 1. Load Profile Data from Firebase
function loadUserProfile() {
    if(!currentUserKey || !window.dbRef) return;
    const userRef = window.dbRef(window.db, 'users/' + currentUserKey);

    window.dbGet(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Fill Form
            document.getElementById('profile-name').value = data.name || "";
            document.getElementById('profile-id').value = data.userId || currentUser;
            document.getElementById('profile-dob').value = data.dob || "";
            document.getElementById('profile-photo-url').value = data.photoUrl || "";
            
            // Update Header & Preview
            updateProfileUI(data.name, data.photoUrl);
        } else {
            // First time user, set basic info
            document.getElementById('profile-id').value = currentUser;
            updateProfileUI(currentUser, null);
        }
    }).catch((error) => {
        console.error("Profile Load Error:", error);
    });
}

// 2. Save Profile Data to Firebase
function saveUserProfile() {
    if(!currentUserKey || !window.dbSet) return alert("Database error!");

    const name = document.getElementById('profile-name').value;
    const dob = document.getElementById('profile-dob').value;
    const photoUrl = document.getElementById('profile-photo-url').value;
    // User ID cannot be changed once set (using login name as base)
    const userId = document.getElementById('profile-id').value;

    const userData = {
        name: name,
        dob: dob,
        photoUrl: photoUrl,
        userId: userId,
        lastUpdated: Date.now()
    };

    // Save to: users/username_key
    window.dbSet(window.dbRef(window.db, 'users/' + currentUserKey), userData)
    .then(() => {
        alert("✅ Profile Saved Successfully to Database!");
        updateProfileUI(name, photoUrl); // Update header immediately
    })
    .catch((error) => {
        alert("❌ Error Saving Profile: " + error.message);
    });
}

// Helper: Update Header Image and Name
function updateProfileUI(name, photoUrl) {
    const displayName = name || currentUser || "Guest";
    document.getElementById('headerUserName').innerText = displayName;
    
    const finalPhotoUrl = photoUrl && photoUrl.length > 10 ? photoUrl : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
    document.getElementById('headerProfileImg').src = finalPhotoUrl;
    document.getElementById('profile-preview-img').src = finalPhotoUrl;
}

// Helper: Preview Photo Input
function previewPhoto(url) {
    if(url.length > 10) document.getElementById('profile-preview-img').src = url;
}


// ==========================================
// 🔴 REAL LIVE STREAMING (Admin & User)
// ==========================================

// --- ADMIN SIDE ---

// 1. Setup Camera/Screen and get Peer ID
async function setupAdminStream(type) {
    if(!isAdmin) return;
    try {
        if(type === 'camera') {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } else {
            localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        }
        document.getElementById('admin-local-video').srcObject = localStream;
        document.getElementById('stream-status').innerText = "Status: Generating Connection ID...";
        
        // Create Peer and get dynamic ID
        adminPeer = new Peer(); 
        adminPeer.on('open', (id) => {
            document.getElementById('stream-status').innerHTML = `Status: Ready! ID generated.<br><strong style="color:#00ff41">Click 'GO LIVE' to broadcast.</strong>`;
            currentLivePeerId = id; // Store ID to send to Firebase later
        });

        // Handle incoming calls (Users joining)
        adminPeer.on('call', (call) => {
            call.answer(localStream); // Send stream to user
        });
        
    } catch(err) { alert("Error: " + err.message); }
}

// 2. Push "Live Status" to Firebase so users can see it
function goLiveOnFirebase() {
    if(!isAdmin || !currentLivePeerId) return alert("Please start camera/screen first!");
    if(liveUsage >= 3) return alert("Daily Limit Reached!");

    const topic = document.getElementById('live-msg-input').value || "General Class";

    // Save status to Firebase: live_status/current
    window.dbSet(window.dbRef(window.db, 'live_status/current'), {
        isLive: true,
        peerId: currentLivePeerId,
        topic: topic,
        startedAt: Date.now()
    }).then(() => {
        alert("🔴 YOU ARE LIVE! Users can now see the 'Join' button.");
        liveUsage++;
        localStorage.setItem('liveUsageCount', liveUsage);
        document.getElementById('live-count').innerText = liveUsage;
        document.getElementById('stream-status').innerText = "Status: 🔴 BROADCASTING LIVE";
        document.getElementById('stream-status').style.color = "red";
    });
}

// 3. Stop Live
function stopLive() {
    if(!isAdmin) return;
    // Update Firebase to offline
    window.dbSet(window.dbRef(window.db, 'live_status/current'), { isLive: false });
    
    // Stop Peer and Stream
    if(adminPeer) adminPeer.destroy();
    if(localStream) localStream.getTracks().forEach(track => track.stop());
    document.getElementById('admin-local-video').srcObject = null;
    document.getElementById('stream-status').innerText = "Status: Offline";
    alert("⏹ Live Stream Stopped.");
}


// --- USER SIDE ---

// 1. Listen to Firebase for Live Status
function listenForLiveStatus() {
    if(!window.dbRef) return;
    const liveRef = window.dbRef(window.db, 'live_status/current');
    
    window.dbOnValue(liveRef, (snapshot) => {
        const data = snapshot.val();
        const liveBanner = document.getElementById('live-banner');
        const noLiveMsg = document.getElementById('no-live-msg');
        const activeLiveCard = document.getElementById('active-live-card');

        if (data && data.isLive === true) {
            // Admin IS Live
            liveBanner.style.display = 'flex'; // Show top banner
            if(noLiveMsg) noLiveMsg.style.display = 'none';
            if(activeLiveCard) {
                activeLiveCard.style.display = 'block'; // Show Join Button card
                document.getElementById('live-topic-user').innerText = data.topic;
                // Store peerId for joining
                activeLiveCard.dataset.peerId = data.peerId;
            }
        } else {
            // Admin is OFFLINE
            liveBanner.style.display = 'none';
            if(noLiveMsg) noLiveMsg.style.display = 'block';
            if(activeLiveCard) activeLiveCard.style.display = 'none';
            // Hide video player if active
            document.getElementById('user-video-container').style.display = 'none';
        }
    });
}

// 2. User Clicks "Join Live" Button
function joinLiveStream() {
    const targetPeerId = document.getElementById('active-live-card').dataset.peerId;
    if(!targetPeerId) return alert("Error: Cannot find live stream ID.");

    document.getElementById('join-live-btn').innerText = "Connecting...";
    
    // Initialize User Peer
    userPeer = new Peer(); 
    
    userPeer.on('open', (id) => {
        // Call the Admin's Peer ID
        const conn = userPeer.call(targetPeerId, new MediaStream()); // Send empty stream to connect
        
        // When Admin sends stream back
        conn.on('stream', (adminStream) => {
            document.getElementById('join-live-btn').innerText = "▶ JOIN LIVE STREAM";
            document.getElementById('active-live-card').style.display = 'none'; // Hide join card
            document.getElementById('user-video-container').style.display = 'block'; // Show player
            
            const videoPlayer = document.getElementById('remote-video');
            videoPlayer.srcObject = adminStream;
            videoPlayer.play();
            alert("✅ Connected to Live Stream!");
        });
        
        conn.on('close', () => {
             alert("Stream ended by host.");
             location.reload();
        });
        
        userPeer.on('error', (err) => {
             alert("Connection Failed. Admin might have gone offline. Error: " + err.type);
             document.getElementById('join-live-btn').innerText = "▶ JOIN LIVE STREAM";
        });
    });
}


// ==========================================
// BASIC APP LOGIC (Login, Nav, etc.)
// ==========================================

function checkLogin() {
    const name = localStorage.getItem("agentName");
    const adminFlag = localStorage.getItem("isAdmin") === "true";
    if(name) {
        currentUser = name;
        // Create safe key for DB (remove special chars, lowercase)
        currentUserKey = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        isAdmin = adminFlag;
        document.getElementById('loggedOutLinks').style.display='none';
        document.getElementById('loggedInLinks').style.display='block';
        updateProfileUI(name, null); // Initial header update

        if(isAdmin) {
            document.getElementById('admin-link').style.display='block';
            document.getElementById('admin-badge').style.display='inline';
            document.getElementById('live-count').innerText = liveUsage;
        }
    }
}

function logout() { localStorage.clear(); location.href="login.html"; }
function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }

function showSection(id) {
    document.querySelectorAll('.hidden-section').forEach(s => s.style.display='none');
    document.getElementById(id+'-section').style.display='block';
    if(id==='prime') checkPrime();
    // If opening profile, ensure data is loaded
    if(id==='profile' && currentUser) loadUserProfile();
    closeNav();
}

// --- FIREBASE LOADERS (Tools, Commands, Prime) ---
function loadTools() {
    if(!window.dbRef) return;
    window.dbOnValue(window.dbRef(window.db, 'tools'), snap => {
        const grid = document.getElementById('tools-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(t => {
            grid.innerHTML += `<div class="card"><img src="${t.img}" onerror="this.src='https://via.placeholder.com/300'"><div class="card-content"><h4>${t.name}</h4><button class="btn-main" style="background:#222; border:1px solid #00ff41; color:#00ff41;" onclick="openArticle('${t.name}', '${escape(t.desc)}', '${t.img}', '${t.video}')">See All</button></div></div>`;
        });
    });
}
function loadCommands() {
    if(!window.dbRef) return;
    window.dbOnValue(window.dbRef(window.db, 'commands'), snap => {
        const list = document.getElementById('commands-list'); list.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(c => {
            list.innerHTML += `<div class="card" style="border:1px solid cyan; padding:10px;"><h4>${c.title}</h4><div style="background:black; padding:10px; font-family:monospace; color:#ccc; overflow-x:auto;">${c.cmd}</div></div>`;
        });
    });
}
function loadPrimeContent() {
     if(!window.dbRef) return;
    window.dbOnValue(window.dbRef(window.db, 'prime_content'), snap => {
        const grid = document.getElementById('prime-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(p => {
            let btn = p.type === 'pdf' ? 'Download PDF' : 'Watch Video';
            grid.innerHTML += `<div class="card" style="border:1px solid gold; padding:10px;"><h4>${p.title}</h4><a href="${p.link}" target="_blank" class="btn-gold" style="display:block; text-align:center; text-decoration:none; padding:10px;">${btn}</a></div>`;
        });
    });
}

// --- UPLOADERS (Admin) ---
function uploadTool() {
    if(!isAdmin) return; const name = document.getElementById('tool-name').value; const img = document.getElementById('tool-img').value; const vid = document.getElementById('tool-vid').value; const desc = document.getElementById('tool-desc').value;
    if(name && desc) window.dbPush(window.dbRef(window.db, 'tools'), { name, img, video: vid, desc }).then(() => { alert("Tool Uploaded!"); document.getElementById('tool-name').value=''; });
}
function uploadPrime() {
    if(!isAdmin) return; const title = document.getElementById('prime-title').value; const link = document.getElementById('prime-link').value; const type = document.getElementById('prime-type').value;
    if(title && link) window.dbPush(window.dbRef(window.db, 'prime_content'), { title, link, type }).then(() => { alert("Prime Content Uploaded!"); });
}

// --- MODAL & UTILS ---
function openArticle(name, desc, img, vid) {
    document.getElementById('modal-title').innerText = name; document.getElementById('modal-img').src = img; document.getElementById('modal-desc').innerText = unescape(desc);
    const v = document.getElementById('modal-video'); if(vid && vid.length > 5) { v.parentElement.style.display='block'; v.src="https://www.youtube.com/embed/"+vid; } else { v.parentElement.style.display='none'; }
    document.getElementById('articleModal').style.display='block';
}
function closeModal() { document.getElementById('articleModal').style.display='none'; document.getElementById('modal-video').src=""; }
function checkPrime() { if(isAdmin) { document.getElementById('prime-locked').style.display='none'; document.getElementById('prime-unlocked').style.display='block'; } else { document.getElementById('prime-locked').style.display='block'; document.getElementById('prime-unlocked').style.display='none'; } }
