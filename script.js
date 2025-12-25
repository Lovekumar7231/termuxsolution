/* --- TELEGRAM CONFIG --- */
const BOT_TOKEN = "8004087165:AAF-fMbvjDYSK64m0maGNf6oIUOvq9Xr-8w";
const CHANNEL_ID = "-1003225658257"; // Channel ID usually starts with -100

/* --- VARIABLES --- */
let currentUser = null;
let currentUserKey = null;
let isAdmin = false;
let isPrimeMember = false;

/* --- INIT --- */
function initApp() {
    checkLogin();
    setTimeout(() => {
        loadTools();
        loadPrimeContent();
        if(currentUser) loadUserProfile();
    }, 1500);
}

/* --- TELEGRAM UPLOAD LOGIC --- */
async function sendToTelegram(file, caption) {
    const formData = new FormData();
    formData.append("chat_id", CHANNEL_ID);
    formData.append("caption", caption);
    
    let type = "document";
    if (file.type.startsWith("image/")) type = "photo";
    else if (file.type.startsWith("video/")) type = "video";
    
    formData.append(type, file);

    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/send${type.charAt(0).toUpperCase() + type.slice(1)}`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if(data.ok) return data.result; // Telegram message object returns
        else throw new Error(data.description);
    } catch (err) {
        console.error("Telegram Error:", err);
        alert("Telegram Upload Failed: " + err.message);
        return null;
    }
}

/* --- ADMIN: UPLOAD TOOLS (Via Telegram) --- */
async function uploadToolWithImage() {
    if(!isAdmin) return alert("Admins Only!");
    const name = document.getElementById('tool-name').value;
    const cmds = document.getElementById('tool-cmds').value;
    const fileInput = document.getElementById('tool-file-input');
    
    if(!name || fileInput.files.length === 0) return alert("Name & Image Required!");
    
    const btn = document.getElementById('upload-tool-btn');
    btn.innerText = "Sending to Telegram..."; btn.disabled = true;

    // 1. Upload to Storage for App Display
    const imgUrl = await uploadToStorage(fileInput.files[0], 'tool_images');
    
    // 2. Send Notification to Telegram
    if(imgUrl) {
        await sendToTelegram(fileInput.files[0], `🔥 New Tool: ${name}\n\nCommands:\n${cmds}`);
        
        window.dbPush(window.dbRef(window.db, 'tools'), { 
            name, 
            img: imgUrl, 
            commands: cmds,
            date: new Date().toLocaleDateString()
        }).then(() => { 
            alert("✅ Tool Added & Sent to Telegram!"); 
            btn.innerText = "UPLOAD TOOL"; btn.disabled = false; 
            loadTools(); 
        });
    } else { btn.disabled = false; }
}

/* --- ADMIN: UPLOAD PRIME (Via Telegram) --- */
async function uploadPrimeWithFile() {
    if(!isAdmin) return alert("Only Admin can upload!");

    const title = document.getElementById('prime-title').value;
    const type = document.getElementById('prime-type').value;
    const fileInput = document.getElementById('prime-file-input');

    if(!title || fileInput.files.length === 0) return alert("Title and File required!");

    const btn = document.getElementById('upload-prime-btn');
    btn.innerText = "Uploading to Cloud & Telegram..."; btn.disabled = true;

    // 1. Storage Upload
    const url = await uploadToStorage(fileInput.files[0], 'prime_content');

    if(url) {
        // 2. Telegram Send
        await sendToTelegram(fileInput.files[0], `👑 PRIME CONTENT UPLOADED\nTitle: ${title}\nType: ${type.toUpperCase()}`);

        window.dbPush(window.dbRef(window.db, 'prime_content'), { title, link: url, type })
        .then(() => {
            alert("✅ Prime Content Online!");
            btn.innerText = "UPLOAD TO PRIME"; btn.disabled = false;
        });
    } else { btn.disabled = false; }
}

/* --- STORAGE HELPER --- */
async function uploadToStorage(file, folder) {
    if (!file) return null;
    const fileName = Date.now() + "_" + file.name.replace(/\s+/g, '_');
    const storageRef = window.sRef(window.storage, folder + "/" + fileName);
    try {
        const snapshot = await window.uploadBytes(storageRef, file);
        return await window.getDownloadURL(snapshot.ref);
    } catch (error) {
        return null;
    }
}

/* --- LOAD FUNCTIONS (Same as before but with UI checks) --- */
function loadTools() {
    window.dbOnValue(window.dbRef(window.db, 'tools'), snap => {
        const grid = document.getElementById('tools-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(t => {
            grid.innerHTML += `<div class="card"><img src="${t.img}" style="width:100%; height:150px; object-fit:cover;">
            <div class="card-content"><h4>${t.name}</h4><button class="btn-main" onclick="alert('${t.commands}')">VIEW COMMANDS</button></div></div>`;
        });
    });
}

function loadPrimeContent() {
    window.dbOnValue(window.dbRef(window.db, 'prime_content'), snap => {
        const grid = document.getElementById('prime-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(p => {
            let action = (isPrimeMember || isAdmin) ? `<a href="${p.link}" target="_blank" class="btn-gold">OPEN ${p.type.toUpperCase()}</a>` : `<button class="btn-gold" onclick="showSection('prime')">LOCKED 🔒</button>`;
            grid.innerHTML += `<div class="card" style="border:1px solid gold; padding:10px;">
                <h4 style="color:white;">${p.title}</h4>${action}</div>`;
        });
    });
}

/* --- PROFILE & AUTH --- */
function loadUserProfile() {
    const localName = localStorage.getItem("agentName");
    document.getElementById('profile-name').value = localName; // Signup wala username
    
    window.dbGet(window.dbRef(window.db, 'users/' + currentUserKey)).then(snap => {
        if(snap.exists()) {
            const d = snap.val();
            if(d.isPrime) { isPrimeMember = true; checkPrimeAccess(); }
            if(d.dob) document.getElementById('profile-dob').value = d.dob;
            if(d.profilePic) {
                document.getElementById('profile-preview-img').src = d.profilePic;
                document.getElementById('headerProfileImg').src = d.profilePic;
            }
        }
    });
}

async function saveUserProfileWithFile() {
    const dob = document.getElementById('profile-dob').value;
    const fileInput = document.getElementById('profile-file-input');
    const btn = document.getElementById('save-profile-btn');
    btn.innerText = "Saving...";
    
    let updateData = { dob: dob };
    if(fileInput.files.length > 0) {
        const url = await uploadToStorage(fileInput.files[0], 'profiles');
        if(url) updateData.profilePic = url;
    }
    
    window.dbUpdate(window.dbRef(window.db, 'users/' + currentUserKey), updateData).then(() => {
        alert("Profile Updated!"); 
        btn.innerText = "SAVE PROFILE"; 
        loadUserProfile();
    });
}

function checkLogin() {
    const name = localStorage.getItem("agentName");
    const adminFlag = localStorage.getItem("isAdmin") === "true";
    if(name) {
        currentUser = name;
        currentUserKey = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        isAdmin = adminFlag;
        document.getElementById('loggedOutLinks').style.display='none';
        document.getElementById('loggedInLinks').style.display='block';
        if(isAdmin) document.getElementById('admin-link').style.display='block';
    }
}
function showSection(id) {
    document.querySelectorAll('.hidden-section').forEach(s => s.style.display='none');
    document.getElementById(id+'-section').style.display='block';
    if(id === 'about' || id === 'prime') checkPrimeAccess();
    closeNav();
}
function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }
function previewFile(i, img) { const f = document.getElementById(i).files[0]; if(f) document.getElementById(img).src = URL.createObjectURL(f); }
function logout() { localStorage.clear(); location.href="login.html"; }

function checkPrimeAccess() {
    if(isAdmin || isPrimeMember) {
        if(document.getElementById('wa-locked')) document.getElementById('wa-locked').style.display = 'none';
        if(document.getElementById('wa-unlocked')) document.getElementById('wa-unlocked').style.display = 'block';
        if(document.getElementById('buy-btn-container')) document.getElementById('buy-btn-container').style.display = 'none';
        if(document.getElementById('already-prime')) document.getElementById('already-prime').style.display = 'block';
    }
}

