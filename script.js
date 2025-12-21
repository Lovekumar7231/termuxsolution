// --- VARIABLES ---
let currentUser = null;
let isAdmin = false;
let liveUsage = parseInt(localStorage.getItem('liveUsageCount')) || 0;

// --- INITIALIZATION ---
function initApp() {
    checkLogin();
    loadTools();
    loadCommands();
    loadPrimeContent();
    
    // Live Limit Reset
    const today = new Date().toDateString();
    if(localStorage.getItem('lastLiveDate') !== today) {
        liveUsage = 0;
        localStorage.setItem('liveUsageCount', 0);
        localStorage.setItem('lastLiveDate', today);
    }
}

// --- LOGIN & NAV ---
function checkLogin() {
    const name = localStorage.getItem("agentName");
    const adminFlag = localStorage.getItem("isAdmin") === "true";
    if(name) {
        currentUser = name;
        isAdmin = adminFlag;
        document.getElementById('loggedOutLinks').style.display='none';
        document.getElementById('loggedInLinks').style.display='block';
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
    closeNav();
}

// --- ADMIN: CAMERA & SCREEN ---
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('admin-live-preview').srcObject = stream;
        alert("✅ Camera Started on Admin Panel");
    } catch(e) { alert("❌ Camera Error: " + e.message); }
}

async function startScreen() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        document.getElementById('admin-live-preview').srcObject = stream;
        alert("✅ Screen Share Started");
    } catch(e) { alert("❌ Screen Share Error: " + e.message); }
}

function triggerGoLive() {
    if(!isAdmin) return;
    if(liveUsage >= 3) return alert("Limit Reached!");
    document.getElementById('live-banner').style.display='flex';
    liveUsage++;
    localStorage.setItem('liveUsageCount', liveUsage);
    document.getElementById('live-count').innerText = liveUsage;
}

// --- UPLOAD FUNCTIONS ---
function uploadTool() {
    if(!isAdmin) return;
    const name = document.getElementById('tool-name').value;
    const img = document.getElementById('tool-img').value;
    const vid = document.getElementById('tool-vid').value;
    const desc = document.getElementById('tool-desc').value;
    if(name && desc) {
        window.dbPush(window.dbRef(window.db, 'tools'), { name, img, video: vid, desc })
        .then(() => { alert("Tool Uploaded!"); document.getElementById('tool-name').value=''; });
    }
}

function uploadCommand() {
    if(!isAdmin) return;
    const title = document.getElementById('cmd-title').value;
    const cmd = document.getElementById('cmd-text').value;
    if(title && cmd) {
        window.dbPush(window.dbRef(window.db, 'commands'), { title, cmd })
        .then(() => { alert("Command Uploaded!"); document.getElementById('cmd-text').value=''; });
    }
}

function uploadPrime() {
    if(!isAdmin) return;
    const title = document.getElementById('prime-title').value;
    const link = document.getElementById('prime-link').value;
    const type = document.getElementById('prime-type').value;
    if(title && link) {
        window.dbPush(window.dbRef(window.db, 'prime_content'), { title, link, type })
        .then(() => { alert("Prime Content Uploaded!"); });
    }
}

// --- LOAD CONTENT ---
function loadTools() {
    if(!window.dbRef) { setTimeout(loadTools, 500); return; }
    window.dbOnValue(window.dbRef(window.db, 'tools'), snap => {
        const grid = document.getElementById('tools-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(t => {
            grid.innerHTML += `<div class="card"><img src="${t.img}" onerror="this.src='https://via.placeholder.com/300'"><div class="card-content"><h4>${t.name}</h4><button class="btn-main" style="background:#222; border:1px solid #00ff41; color:#00ff41;" onclick="openArticle('${t.name}', '${escape(t.desc)}', '${t.img}', '${t.video}')">See All</button></div></div>`;
        });
    });
}

function loadCommands() {
    window.dbOnValue(window.dbRef(window.db, 'commands'), snap => {
        const list = document.getElementById('commands-list'); list.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(c => {
            list.innerHTML += `<div class="card" style="border:1px solid cyan; padding:10px;"><h4>${c.title}</h4><div style="background:black; padding:10px; font-family:monospace; color:#ccc; overflow-x:auto;">${c.cmd}</div></div>`;
        });
    });
}

function loadPrimeContent() {
    window.dbOnValue(window.dbRef(window.db, 'prime_content'), snap => {
        const grid = document.getElementById('prime-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(p => {
            let btn = p.type === 'pdf' ? 'Download PDF' : 'Watch Video';
            grid.innerHTML += `<div class="card" style="border:1px solid gold; padding:10px;"><h4>${p.title}</h4><a href="${p.link}" target="_blank" class="btn-gold" style="display:block; text-align:center; text-decoration:none; padding:10px;">${btn}</a></div>`;
        });
    });
}

// --- MODAL ---
function openArticle(name, desc, img, vid) {
    document.getElementById('modal-title').innerText = name;
    document.getElementById('modal-img').src = img;
    document.getElementById('modal-desc').innerText = unescape(desc);
    const v = document.getElementById('modal-video');
    if(vid && vid.length > 5) { v.parentElement.style.display='block'; v.src="https://www.youtube.com/embed/"+vid; }
    else { v.parentElement.style.display='none'; }
    document.getElementById('articleModal').style.display='block';
}
function closeModal() { document.getElementById('articleModal').style.display='none'; document.getElementById('modal-video').src=""; }

function checkPrime() {
    if(isAdmin) {
        document.getElementById('prime-locked').style.display='none';
        document.getElementById('prime-unlocked').style.display='block';
    } else {
        document.getElementById('prime-locked').style.display='block';
        document.getElementById('prime-unlocked').style.display='none';
    }
}

