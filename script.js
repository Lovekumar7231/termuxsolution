// --- VARIABLES ---
let currentUser = null;
let isAdmin = false;
let liveUsage = parseInt(localStorage.getItem('liveUsageCount')) || 0;

// --- INITIALIZATION ---
function initApp() {
    checkLogin();
    loadTools();
    
    // Reset Live Limit if new day
    const lastDate = localStorage.getItem('lastLiveDate');
    const today = new Date().toDateString();
    if (lastDate !== today) {
        liveUsage = 0;
        localStorage.setItem('liveUsageCount', 0);
        localStorage.setItem('lastLiveDate', today);
    }
}

// --- NAVIGATION ---
function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }

function showSection(id) {
    document.querySelectorAll('.hidden-section').forEach(el => el.style.display = 'none');
    document.getElementById(id + '-section').style.display = 'block';
    
    if(id === 'prime') checkPrime();
    closeNav();
}

// --- LOGIN CHECK ---
function checkLogin() {
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
            document.getElementById('live-count').innerText = liveUsage;
        }
    }
}

function logout() {
    localStorage.clear();
    location.href = "login.html";
}

// --- FIREBASE TOOLS ---
function loadTools() {
    // Wait for Firebase to load
    if(!window.dbRef) { setTimeout(loadTools, 500); return; }

    const toolsRef = window.dbRef(window.db, 'tools');
    window.dbOnValue(toolsRef, (snapshot) => {
        const grid = document.getElementById('tools-grid');
        document.getElementById('tools-loader').style.display = 'none';
        grid.innerHTML = "";
        
        const data = snapshot.val();
        if(data) {
            Object.values(data).reverse().forEach(tool => {
                grid.innerHTML += `
                <div class="card">
                    <img src="${tool.img}" onerror="this.src='https://via.placeholder.com/300'">
                    <div class="card-content">
                        <h4>${tool.name}</h4>
                        <button class="btn-main" style="background:#222; border:1px solid #00ff41; color:#00ff41;" 
                            onclick="openArticle('${tool.name}', '${escape(tool.desc)}', '${tool.img}', '${tool.video}')">
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

// --- ADMIN UPLOAD ---
function uploadTool() {
    if(!isAdmin) return alert("Access Denied!");
    
    const name = document.getElementById('tool-name').value;
    const img = document.getElementById('tool-img').value;
    const vid = document.getElementById('tool-vid').value;
    const desc = document.getElementById('tool-desc').value;

    if(name && desc) {
        const toolsRef = window.dbRef(window.db, 'tools');
        window.dbPush(toolsRef, { name, img, video: vid, desc }).then(() => {
            alert("✅ Tool Uploaded!");
            showSection('home');
        });
    } else {
        alert("Enter Name and Commands!");
    }
}

// --- MODAL POPUP ---
function openArticle(name, desc, img, vid) {
    document.getElementById('modal-title').innerText = name;
    document.getElementById('modal-img').src = img;
    document.getElementById('modal-desc').innerText = unescape(desc);

    const vFrame = document.getElementById('modal-video');
    if(vid && vid.length > 5) {
        document.getElementById('modal-video-container').style.display = 'block';
        vFrame.src = "https://www.youtube.com/embed/" + vid;
    } else {
        document.getElementById('modal-video-container').style.display = 'none';
    }
    document.getElementById('articleModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('articleModal').style.display = 'none';
    document.getElementById('modal-video').src = "";
}

// --- GO LIVE ---
function triggerGoLive() {
    if(!isAdmin) return;
    if(liveUsage >= 3) return alert("🚫 Limit Reached (3/3)");

    const msg = document.getElementById('live-msg-input').value;
    document.getElementById('live-msg-text').innerText = msg;
    document.getElementById('live-banner').style.display = 'flex';

    liveUsage++;
    localStorage.setItem('liveUsageCount', liveUsage);
    document.getElementById('live-count').innerText = liveUsage;
}

// --- PRIME CHECK ---
function checkPrime() {
    if(isAdmin) {
        document.getElementById('prime-locked').style.display = 'none';
        document.getElementById('prime-unlocked').style.display = 'block';
    } else {
        document.getElementById('prime-locked').style.display = 'block';
        document.getElementById('prime-unlocked').style.display = 'none';
    }
}

