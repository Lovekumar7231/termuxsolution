
let currentUser = null;
let currentUserKey = null;
let isAdmin = false;
let isPrimeMember = false;

function initApp() {
    checkLogin();
    setTimeout(() => {
        loadTools();
        loadPrimeContent();
        if(currentUser) loadUserProfile();
    }, 1000);
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

function loadUserProfile() {
    document.getElementById('profile-name').value = currentUser;
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
        alert("Saved!"); btn.innerText = "SAVE DATA"; loadUserProfile();
    });
}

async function uploadToStorage(file, folder) {
    const ref = window.sRef(window.storage, folder + "/" + Date.now() + "_" + file.name);
    const snap = await window.uploadBytes(ref, file);
    return await window.getDownloadURL(snap.ref);
}

async function uploadToolWithImage() {
    const name = document.getElementById('tool-name').value;
    const cmds = document.getElementById('tool-cmds').value;
    const file = document.getElementById('tool-file-input').files[0];
    if(!name || !file) return alert("Required!");

    const url = await uploadToStorage(file, 'tools');
    window.dbPush(window.dbRef(window.db, 'tools'), { name, img: url, commands: cmds });
    alert("Tool Uploaded!");
}

async function uploadPrimeWithFile() {
    const title = document.getElementById('prime-title').value;
    const type = document.getElementById('prime-type').value;
    const file = document.getElementById('prime-file-input').files[0];
    if(!title || !file) return alert("Required!");

    const url = await uploadToStorage(file, 'prime');
    window.dbPush(window.dbRef(window.db, 'prime_content'), { title, link: url, type });
    alert("Prime Content Uploaded!");
}

function loadPrimeContent() {
    window.dbOnValue(window.dbRef(window.db, 'prime_content'), snap => {
        const grid = document.getElementById('prime-grid'); grid.innerHTML = "";
        if(snap.val()) Object.values(snap.val()).forEach(p => {
            let btn = (isPrimeMember || isAdmin) ? `<a href="${p.link}" target="_blank" class="btn-gold">VIEW ${p.type.toUpperCase()}</a>` : `<button class="btn-gold" onclick="alert('Buy Prime')">LOCKED 🔒</button>`;
            grid.innerHTML += `<div class="card"><h4>${p.title}</h4>${btn}</div>`;
        });
    });
}

function loadTools() {
    window.dbOnValue(window.dbRef(window.db, 'tools'), snap => {
        const grid = document.getElementById('tools-grid'); grid.innerHTML = "";
        if(snap.val()) Object.values(snap.val()).forEach(t => {
            grid.innerHTML += `<div class="card"><img src="${t.img}" style="width:100%;"><p>${t.name}</p><button onclick="alert('${t.commands}')">VIEW</button></div>`;
        });
    });
}

function checkPrimeAccess() {
    if(isPrimeMember || isAdmin) {
        document.getElementById('wa-locked').style.display = 'none';
        document.getElementById('wa-unlocked').style.display = 'block';
        document.getElementById('buy-btn-container').style.display = 'none';
        document.getElementById('already-prime').style.display = 'block';
    }
}

function showSection(id) {
    document.querySelectorAll('.hidden-section').forEach(s => s.style.display='none');
    document.getElementById(id+'-section').style.display='block';
    closeNav();
}
function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }
function previewFile(i, img) { const f = document.getElementById(i).files[0]; if(f) document.getElementById(img).src = URL.createObjectURL(f); }
function logout() { localStorage.clear(); location.href="login.html"; }
