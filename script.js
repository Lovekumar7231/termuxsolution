// --- DATA STORAGE (Simulation) ---
let toolsDB = [
    {
        id: 1,
        title: "Termux Basic Setup",
        desc: "apt update && apt upgrade\npkg install python\npkg install git",
        img: "https://via.placeholder.com/300/000000/00ff41?text=Setup",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
        id: 2,
        title: "Nmap Scanning",
        desc: "pkg install nmap\nnmap -sV google.com",
        img: "https://via.placeholder.com/300/000000/ff0055?text=Nmap",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    }
];

let liveUsage = 0; // Limit counter

document.addEventListener('DOMContentLoaded', () => {
    checkGlobalLoginState();
    renderTools();
});

// --- 1. RENDER TOOLS (Home Page) ---
function renderTools() {
    const grid = document.getElementById('tools-grid');
    if(!grid) return;
    grid.innerHTML = "";

    toolsDB.forEach(tool => {
        const card = `
            <div class="card tool-card">
                <img src="${tool.img}" alt="${tool.title}">
                <div style="padding:10px;">
                    <h3 style="color:#00ff41;">${tool.title}</h3>
                    <button class="btn" onclick="openArticle(${tool.id})">See All / Read More</button>
                </div>
            </div>
        `;
        grid.innerHTML += card;
    });
}

// --- 2. MODAL VIEW (Open Article) ---
function openArticle(id) {
    const tool = toolsDB.find(t => t.id === id);
    if(tool) {
        document.getElementById('view-title').innerText = tool.title;
        document.getElementById('view-desc').innerText = tool.desc;
        document.getElementById('view-img').src = tool.img;
        document.getElementById('view-video').src = tool.video;
        document.getElementById('article-viewer').style.display = 'block';
    }
}

function closeArticle() {
    document.getElementById('article-viewer').style.display = 'none';
    document.getElementById('view-video').src = ""; // Stop Video
}

// --- 3. ADMIN: UPLOAD TOOL ---
function uploadNewTool() {
    // Security Check
    if(localStorage.getItem("isAdmin") !== "true") {
        alert("❌ Access Denied!");
        return;
    }

    const title = document.getElementById('new-tool-title').value;
    const desc = document.getElementById('new-tool-desc').value;
    const img = document.getElementById('new-tool-img').value;
    const vid = document.getElementById('new-tool-video').value;

    if(title && desc) {
        toolsDB.unshift({ // Add to top
            id: Date.now(),
            title, desc, img,
            video: `https://www.youtube.com/embed/${vid}`
        });
        alert("✅ Tool Uploaded Successfully!");
        renderTools(); // Refresh Grid
        showSection('home');
    } else {
        alert("⚠️ Title and Description required!");
    }
}

// --- 4. ADMIN: GO LIVE (Limit 3) ---
function triggerLive() {
    if(localStorage.getItem("isAdmin") !== "true") return;

    if(liveUsage >= 3) {
        alert("🚫 Limit Reached! You can only Go Live 3 times per day.");
        return;
    }

    const msg = document.getElementById('live-msg-input').value;
    document.getElementById('live-msg-text').innerText = msg || "Admin is Live!";
    document.getElementById('live-banner').style.display = 'flex';
    
    liveUsage++;
    document.getElementById('live-count-display').innerText = liveUsage;
}

function closeLive() {
    document.getElementById('live-banner').style.display = 'none';
}

// --- 5. NAVIGATION & LOGIN CHECK ---
function showSection(id) {
    document.getElementById("mySidebar").style.width = "0"; // Close Sidebar
    document.querySelectorAll('.hidden-section').forEach(s => s.style.display = 'none');
    
    const target = document.getElementById(id + '-section');
    if(target) target.style.display = 'block';
}

function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }

function checkGlobalLoginState() {
    const user = localStorage.getItem("agentName");
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    if(user) {
        // Logged In
        document.getElementById("loggedOutLinks").style.display = "none";
        document.getElementById("loggedInLinks").style.display = "block";
        
        // Show Admin Link if Admin
        if(isAdmin) {
            document.getElementById("admin-link").style.display = "block";
            document.getElementById("profileNameDisplay").innerText = "COMMANDER (Admin)";
            document.getElementById("profileNameDisplay").style.color = "red";
        } else {
            document.getElementById("profileNameDisplay").innerText = "Agent " + user;
        }

        // Unlock Prime for Admin
        if(isAdmin) {
             document.getElementById('prime-content-locked').style.display = 'none';
             document.getElementById('prime-content-unlocked').style.display = 'block';
        }
    } else {
        // Guest
        document.getElementById("loggedOutLinks").style.display = "block";
        document.getElementById("loggedInLinks").style.display = "none";
    }
}

function logout() {
    localStorage.clear();
    location.href = "login.html";
}

