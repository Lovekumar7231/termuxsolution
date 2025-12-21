// --- GLOBAL VARIABLES ---
let currentUser = null;
let isAdmin = false;
let liveUsage = parseInt(localStorage.getItem('liveUsageCount')) || 0;
let lastLiveDate = localStorage.getItem('lastLiveDate');

// --- INITIALIZATION ---
function initApp() {
    checkLoginStatus();
    loadToolsFromFirebase();
    
    // Check Live Limit Date Reset
    const today = new Date().toDateString();
    if (lastLiveDate !== today) {
        liveUsage = 0;
        localStorage.setItem('liveUsageCount', 0);
        localStorage.setItem('lastLiveDate', today);
    }
    document.getElementById('live-count').innerText = liveUsage;
}

// --- NAVIGATION ---
function showSection(id) {
    document.querySelectorAll('.hidden-section').forEach(el => el.style.display = 'none');
    document.getElementById(id + '-section').style.display = 'block';
    
    if(id === 'prime') checkPrimeAccess();
    closeNav();
}

function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }

// --- LOGIN CHECK ---
function checkLoginStatus() {
    const name = localStorage.getItem("agentName");
    const adminFlag = localStorage.getItem("isAdmin");
    
    if (name) {
        currentUser = name;
        isAdmin = (adminFlag === "true");
        
        document.getElementById('loggedOutLinks').style.display = 'none';
        document.getElementById('loggedInLinks').style.display = 'block';
        
        if (isAdmin) {
            document.getElementById('admin-link').style.display = 'block';
            document.getElementById('admin-badge').style.display = 'inline';
        }
        showSection('home');
    } else {
        showSection('home'); // Show home for guest
    }
}

function logout() {
    localStorage.clear();
    location.href = "login.html";
}

// --- FIREBASE: LOAD TOOLS ---
function loadToolsFromFirebase() {
    const dbRef = window.dbInstance; 
    const toolsRef = window.dbRef(dbRef, 'tools');
    
    window.dbOnValue(toolsRef, (snapshot) => {
        const grid = document.getElementById('tools-grid');
        document.getElementById('tools-loader').style.display = 'none';
        grid.innerHTML = "";
        
        const data = snapshot.val();
        if (data) {
            Object.values(data).forEach(tool => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <img src="${tool.img}" onerror="this.src='https://via.placeholder.com/300'">
                    <div style="padding:15px;">
                        <h4 style="color:#00ff41; margin-top:0;">${tool.name}</h4>
                        <button class="btn" style="background:#222; border:1px solid #00ff41; color:#00ff41;" 
                        onclick="openArticle('${tool.name}', '${escape(tool.desc)}', '${tool.img}', '${tool.video}')">
                        See All / Read More
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = "<p style='color:#666;'>No tools uploaded yet.</p>";
        }
    });
}

// --- FIREBASE: UPLOAD TOOL (ADMIN ONLY) ---
function uploadTool() {
    if (!isAdmin) return alert("❌ Access Denied!");
    
    const name = document.getElementById('tool-name').value;
    const img = document.getElementById('tool-img').value;
    const vid = document.getElementById('tool-vid').value;
    const desc = document.getElementById('tool-desc').value;
    
    if (name && desc) {
        const dbRef = window.dbInstance;
        const toolsRef = window.dbRef(dbRef, 'tools');
        window.dbPush(toolsRef, {
            name: name,
            img: img,
            video: vid,
            desc: desc
        }).then(() => {
            alert("✅ Tool Uploaded Successfully!");
            showSection('home');
        });
    } else {
        alert("⚠️ Name and Description are required!");
    }
}

// --- MODAL: VIEW ARTICLE ---
function openArticle(name, desc, img, vid) {
    document.getElementById('modal-title').innerText = name;
    document.getElementById('modal-img').src = img;
    document.getElementById('modal-desc').innerText = unescape(desc);
    
    const vidFrame = document.getElementById('modal-video');
    if(vid && vid.length > 5) {
        document.getElementById('modal-video-container').style.display = 'block';
        vidFrame.src = "https://www.youtube.com/embed/" + vid;
    } else {
        document.getElementById('modal-video-container').style.display = 'none';
    }
    
    document.getElementById('articleModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('articleModal').style.display = 'none';
    document.getElementById('modal-video').src = ""; // Stop video
}

// --- ADMIN FEATURES: GO LIVE ---
function triggerGoLive() {
    if(!isAdmin) return;
    if(liveUsage >= 3) return alert("🚫 Daily Limit Reached (3/3)");
    
    const msg = document.getElementById('live-msg-input').value;
    document.getElementById('live-msg-text').innerText = msg;
    document.getElementById('live-banner').style.display = 'flex';
    
    liveUsage++;
    localStorage.setItem('liveUsageCount', liveUsage);
    document.getElementById('live-count').innerText = liveUsage;
}

// --- PRIME CHECK ---
function checkPrimeAccess() {
    // Simulation: Admin is automatically Prime
    if(isAdmin) {
        document.getElementById('prime-locked').style.display = 'none';
        document.getElementById('prime-unlocked').style.display = 'block';
    } else {
        document.getElementById('prime-locked').style.display = 'block';
        document.getElementById('prime-unlocked').style.display = 'none';
    }
}

