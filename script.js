// --- GLOBAL VARIABLES ---
let currentUser = null;
let currentUserKey = null;
let isAdmin = false;

// PeerJS Variables (Live)
let localStream = null;
let adminPeer = null;
let userPeer = null;

// --- INITIALIZATION ---
function initApp() {
    checkLogin();
    
    // 1.5 Second delay to ensure Firebase loads
    setTimeout(() => {
        if(currentUser) loadUserProfile();
        loadPrimeContent();
        listenForLiveStatus();
    }, 1500);
}

/* --- NAVIGATION --- */
function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }

function showSection(id) {
    document.querySelectorAll('.hidden-section').forEach(s => s.style.display='none');
    document.getElementById(id+'-section').style.display='block';
    
    // Specific logic
    if(id === 'prime') checkPrime();
    if(id === 'profile' && currentUser) loadUserProfile();
    
    closeNav();
}

/* --- FILE PREVIEW HELPER --- */
function previewFile(inputId, imgId) {
    const file = document.getElementById(inputId).files[0];
    if (file) {
        document.getElementById(imgId).src = URL.createObjectURL(file);
    }
}
document.getElementById('prime-file-input').addEventListener('change', function(){
    if(this.files[0]) document.getElementById('file-name-display').innerText = this.files[0].name;
});

/* --- UPLOAD TO FIREBASE STORAGE --- */
async function uploadToStorage(file, folder) {
    if (!file) return null;
    // Create Unique Name: folder/timestamp_filename
    const storageRef = window.sRef(window.storage, folder + "/" + Date.now() + "_" + file.name);
    
    try {
        const snapshot = await window.uploadBytes(storageRef, file);
        const url = await window.getDownloadURL(snapshot.ref);
        return url;
    } catch (error) {
        alert("Upload Failed: " + error.message);
        console.error(error);
        return null;
    }
}

/* --- PROFILE: SAVE & UPLOAD PHOTO --- */
async function saveUserProfileWithFile() {
    if(!currentUserKey) return alert("Please Login First!");
    
    const btn = document.getElementById('save-profile-btn');
    btn.innerText = "Uploading Image...";
    btn.disabled = true;

    const name = document.getElementById('profile-name').value;
    const dob = document.getElementById('profile-dob').value;
    const fileInput = document.getElementById('profile-file-input');
    
    let photoUrl = document.getElementById('profile-preview-img').src; 

    // Upload New Photo if selected
    if (fileInput.files.length > 0) {
        const uploadedUrl = await uploadToStorage(fileInput.files[0], 'profile_pics');
        if (uploadedUrl) photoUrl = uploadedUrl;
    }

    const userData = {
        name: name,
        dob: dob,
        photoUrl: photoUrl,
        userId: currentUserKey,
        lastUpdated: Date.now()
    };

    window.dbSet(window.dbRef(window.db, 'users/' + currentUserKey), userData)
    .then(() => {
        alert("✅ Profile Updated!");
        updateProfileUI(name, photoUrl);
        btn.innerText = "💾 SAVE PROFILE";
        btn.disabled = false;
    });
}

function loadUserProfile() {
    if(!currentUserKey) return;
    window.dbGet(window.dbRef(window.db, 'users/' + currentUserKey)).then((snap) => {
        if (snap.exists()) {
            const data = snap.val();
            document.getElementById('profile-name').value = data.name || "";
            document.getElementById('profile-dob').value = data.dob || "";
            updateProfileUI(data.name, data.photoUrl);
        }
    });
}

function updateProfileUI(name, photoUrl) {
    if(photoUrl) {
        document.getElementById('headerProfileImg').src = photoUrl;
        document.getElementById('profile-preview-img').src = photoUrl;
    }
}

/* --- ADMIN: UPLOAD PRIME CONTENT --- */
async function uploadPrimeWithFile() {
    if(!isAdmin) return alert("Admins Only!");

    const title = document.getElementById('prime-title').value;
    const type = document.getElementById('prime-type').value;
    const fileInput = document.getElementById('prime-file-input');

    if(!title || fileInput.files.length === 0) {
        return alert("⚠️ Title aur File dono select karo!");
    }

    const btn = document.getElementById('upload-prime-btn');
    btn.innerText = "Uploading File (Wait)...";
    btn.disabled = true;

    // 1. Upload to Storage
    const fileUrl = await uploadToStorage(fileInput.files[0], 'prime_content');

    if(fileUrl) {
        // 2. Save Data to DB
        window.dbPush(window.dbRef(window.db, 'prime_content'), { 
            title: title, 
            link: fileUrl, 
            type: type 
        }).then(() => { 
            alert("✅ Upload Successful!"); 
            btn.innerText = "🚀 UPLOAD NOW";
            btn.disabled = false;
            document.getElementById('prime-title').value = "";
        });
    } else {
        btn.innerText = "🚀 UPLOAD NOW";
        btn.disabled = false;
    }
}

function loadPrimeContent() {
    window.dbOnValue(window.dbRef(window.db, 'prime_content'), snap => {
        const grid = document.getElementById('prime-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(p => {
            let btnText = p.type === 'pdf' ? 'Download PDF' : 'Watch Video';
            grid.innerHTML += `
                <div class="card" style="border:1px solid gold; padding:10px;">
                    <h4 style="color:white;">${p.title}</h4>
                    <a href="${p.link}" target="_blank" class="btn-gold" style="display:block; text-align:center; text-decoration:none; padding:10px; margin-top:5px;">
                        ${btnText}
                    </a>
                </div>`;
        });
    });
}

/* --- LOGIN/AUTH CHECK --- */
function checkLogin() {
    const name = localStorage.getItem("agentName");
    const adminFlag = localStorage.getItem("isAdmin") === "true";
    if(name) {
        currentUser = name;
        currentUserKey = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        isAdmin = adminFlag;
        
        document.getElementById('loggedOutLinks').style.display='none';
        document.getElementById('loggedInLinks').style.display='block';

        if(isAdmin) {
            document.getElementById('admin-link').style.display='block';
        }
    }
}

function checkPrime() {
    if(isAdmin) { 
        document.getElementById('prime-locked').style.display='none'; 
        document.getElementById('prime-unlocked').style.display='block'; 
    } else { 
        document.getElementById('prime-locked').style.display='block'; 
        document.getElementById('prime-unlocked').style.display='none'; 
    }
}

function logout() { localStorage.clear(); location.href="login.html"; }

/* --- LIVE LOGIC (Keep Basic) --- */
function listenForLiveStatus() {
    window.dbOnValue(window.dbRef(window.db, 'live_status/current'), (snap) => {
        const data = snap.val();
        if (data && data.isLive) {
            document.getElementById('active-live-card').style.display = 'block';
            document.getElementById('active-live-card').dataset.peerId = data.peerId;
            document.getElementById('live-topic-user').innerText = data.topic;
            document.getElementById('no-live-msg').style.display = 'none';
        } else {
            document.getElementById('active-live-card').style.display = 'none';
            document.getElementById('no-live-msg').style.display = 'block';
        }
    });
}

// ... (Baaki Live Stream Functions tumhare purane wale use honge)

/* --- LOGIN CHECK & ADMIN PANEL VISIBILITY --- */
function checkLogin() {
    const name = localStorage.getItem("agentName");
    // "isAdmin" को string की तरह चेक करें
    const isAdminUser = localStorage.getItem("isAdmin") === "true"; 

    if(name) {
        currentUser = name;
        currentUserKey = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        isAdmin = isAdminUser;
        
        // Login/Logout links toggle
        document.getElementById('loggedOutLinks').style.display = 'none';
        document.getElementById('loggedInLinks').style.display = 'block';

        // अगर ADMIN है, तो Sidebar में Panel दिखाओ
        if(isAdmin) {
            const adminLink = document.getElementById('admin-link');
            if(adminLink) {
                adminLink.style.display = 'block';
            }
            // Admin Section (Main Page) भी visible कर सकते हो अगर चाहो
            // लेकिन sidebar लिंक बेहतर है
        }
    } else {
        // अगर लॉगिन नहीं है
        document.getElementById('loggedOutLinks').style.display = 'block';
        document.getElementById('loggedInLinks').style.display = 'none';
    }
}
