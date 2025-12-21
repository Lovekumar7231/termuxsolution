// --- VARIABLES ---
let currentUser = null;
let isAdmin = false;
let liveUsage = parseInt(localStorage.getItem('liveUsageCount')) || 0;

// --- INITIALIZATION ---
// Jab page load ho to ye functions chalenge
document.addEventListener('DOMContentLoaded', function() {
    checkLogin();     // Login check karo
    loadTools();      // Tools load karo
    
    // Live Limit Reset (Naya din, nayi limit)
    const today = new Date().toDateString();
    if(localStorage.getItem('lastLiveDate') !== today) {
        liveUsage = 0;
        localStorage.setItem('liveUsageCount', 0);
        localStorage.setItem('lastLiveDate', today);
    }

    // Sidebar Close Button Fix
    const closeBtn = document.querySelector(".closebtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeNav);
    }
});

// --- LOGIN CHECK ---
function checkLogin() {
    const name = localStorage.getItem("agentName");
    const adminFlag = localStorage.getItem("isAdmin") === "true";
    
    if(name) {
        currentUser = name;
        isAdmin = adminFlag;
        
        // Login wale links dikhao, logout wale chupao
        const loggedOutLinks = document.getElementById('loggedOutLinks');
        const loggedInLinks = document.getElementById('loggedInLinks');
        if(loggedOutLinks) loggedOutLinks.style.display = 'none';
        if(loggedInLinks) loggedInLinks.style.display = 'block';
        
        // Agar Admin hai to Admin Panel ka link dikhao
        if(isAdmin) {
            const adminLink = document.getElementById('admin-link');
            const adminBadge = document.getElementById('admin-badge');
            const liveCount = document.getElementById('live-count');
            
            if(adminLink) adminLink.style.display = 'block';
            if(adminBadge) adminBadge.style.display = 'inline';
            if(liveCount) liveCount.innerText = liveUsage;
        }
    }
}

function logout() {
    if(confirm("Are you sure you want to logout?")) {
        localStorage.clear();
        location.href = "login.html";
    }
}

// --- NAVIGATION ---
function openNav() { 
    document.getElementById("mySidebar").style.width = "250px"; 
}

function closeNav() { 
    document.getElementById("mySidebar").style.width = "0"; 
}

function showSection(id) {
    // Sab sections chupao
    document.querySelectorAll('.hidden-section').forEach(s => s.style.display = 'none');
    
    // Jo chahiye wo dikhao
    const target = document.getElementById(id + '-section');
    if(target) target.style.display = 'block';
    
    // Prime check
    if(id === 'prime') checkPrime();
    
    closeNav();
}

// ==========================================
// 👇 ADMIN: LIVE CAMERA & SCREEN LOGIC 👇
// ==========================================

async function startCamera() {
    const videoPreview = document.getElementById('admin-live-preview');
    
    // Browser API (Camera Access)
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        if(videoPreview) {
            videoPreview.srcObject = stream;
            videoPreview.style.display = "block"; // Video box dikhao
            videoPreview.play();
        }
        
        alert("✅ Camera Started! You are visible on Admin Panel.");
    } catch(err) {
        alert("❌ Error: Camera permission denied! \nDetails: " + err.message);
    }
}

async function startScreen() {
    const videoPreview = document.getElementById('admin-live-preview');

    // Browser API (Screen Share Access)
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        if(videoPreview) {
            videoPreview.srcObject = stream;
            videoPreview.style.display = "block";
            videoPreview.play();
        }
        
        alert("✅ Screen Sharing Started!");
    } catch(err) {
        alert("❌ Error: Screen Share failed or cancelled.");
    }
}

function triggerGoLive() {
    if(!isAdmin) return alert("❌ Access Denied: Admins Only!");
    
    // Limit Check
    if(liveUsage >= 3) return alert("🚫 Daily Limit Reached (3/3). Try tomorrow.");
    
    // Banner Show Karo
    const banner = document.getElementById('live-banner');
    const msgInput = document.getElementById('live-msg-input');
    const msgText = document.getElementById('live-msg-text');
    
    if(banner) {
        banner.style.display = 'flex';
        if(msgInput && msgText) {
            msgText.innerText = msgInput.value || "ADMIN IS LIVE!";
        }
    }
    
    // Usage Update
    liveUsage++;
    localStorage.setItem('liveUsageCount', liveUsage);
    
    const countDisplay = document.getElementById('live-count');
    if(countDisplay) countDisplay.innerText = liveUsage;
    
    alert("🔴 YOU ARE NOW LIVE! (Simulation Active)");
}

// --- FIREBASE TOOLS (Simulation / Real) ---
function loadTools() {
    // Agar Firebase config window object me hai to use karo
    if(window.dbRef && window.db) {
        const toolsRef = window.dbRef(window.db, 'tools');
        window.dbOnValue(toolsRef, (snapshot) => {
            const grid = document.getElementById('tools-grid');
            if(!grid) return;
            
            grid.innerHTML = "";
            const data = snapshot.val();
            
            if(data) {
                Object.values(data).reverse().forEach(t => {
                    grid.innerHTML += `
                    <div class="card">
                        <img src="${t.img}" onerror="this.src='https://via.placeholder.com/300'">
                        <div class="card-content">
                            <h4>${t.name}</h4>
                            <button class="btn-main" style="background:#222; border:1px solid #00ff41; color:#00ff41;"
                            onclick="openArticle('${t.name}', '${escape(t.desc)}', '${t.img}', '${t.video}')">
                            See All / Read More
                            </button>
                        </div>
                    </div>`;
                });
            } else {
                grid.innerHTML = "<p style='text-align:center; color:#666;'>No tools uploaded yet.</p>";
            }
        });
    }
}

// --- UPLOAD TOOL (Admin) ---
function uploadTool() {
    if(!isAdmin) return alert("Access Denied!");
    
    const name = document.getElementById('tool-name').value;
    const img = document.getElementById('tool-img').value;
    const vid = document.getElementById('tool-vid').value;
    const desc = document.getElementById('tool-desc').value;
    
    if(name && desc) {
        if(window.dbPush) {
            window.dbPush(window.dbRef(window.db, 'tools'), { name, img, video: vid, desc })
            .then(() => { 
                alert("✅ Tool Uploaded Successfully!"); 
                document.getElementById('tool-name').value='';
                showSection('home');
            });
        } else {
            alert("Database not connected properly.");
        }
    } else {
        alert("⚠️ Tool Name and Description required!");
    }
}

// --- MODAL (POPUP) ---
function openArticle(name, desc, img, vid) {
    const modal = document.getElementById('articleModal');
    if(!modal) return;

    document.getElementById('modal-title').innerText = name;
    document.getElementById('modal-img').src = img;
    document.getElementById('modal-desc').innerText = unescape(desc);
    
    const v = document.getElementById('modal-video');
    const vContainer = document.getElementById('modal-video-container');
    
    if(vid && vid.length > 5) {
        vContainer.style.display = 'block';
        v.src = "https://www.youtube.com/embed/" + vid;
    } else {
        vContainer.style.display = 'none';
        v.src = "";
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('articleModal');
    if(modal) modal.style.display = 'none';
    
    const v = document.getElementById('modal-video');
    if(v) v.src = ""; // Stop video
}

// --- PRIME CHECK ---
function checkPrime() {
    const locked = document.getElementById('prime-locked');
    const unlocked = document.getElementById('prime-unlocked');
    
    if(isAdmin) {
        if(locked) locked.style.display = 'none';
        if(unlocked) unlocked.style.display = 'block';
    } else {
        if(locked) locked.style.display = 'block';
        if(unlocked) unlocked.style.display = 'none';
    }
}

// --- LIVE DASHBOARD (User Side) ---
function openLiveDashboard() {
    const dash = document.getElementById('live-dashboard-section');
    if(dash) dash.style.display = 'flex';
}

function closeLiveDashboard() {
    const dash = document.getElementById('live-dashboard-section');
    if(dash) dash.style.display = 'none';
                }
       w
