
/* --- VARIABLES --- */
let currentUser = null;
let currentUserKey = null;
let isAdmin = false;

/* --- INIT --- */
function initApp() {
    checkLogin();
    setTimeout(() => {
        loadTools();
        loadPrimeContent();
        if(currentUser) loadUserProfile();
    }, 1500);
}

/* --- NAVIGATION & WHATSAPP LOGIC --- */
function showSection(id) {
    document.querySelectorAll('.hidden-section').forEach(s => s.style.display='none');
    document.getElementById(id+'-section').style.display='block';
    
    // WhatsApp Logic: Sirf Admin ya Paid User ko dikhega
    if(id === 'prime') {
        if(isAdmin) { // filhal sirf Admin ke liye unlock kiya hai
            document.getElementById('wa-locked').style.display = 'none';
            document.getElementById('wa-unlocked').style.display = 'block';
        } else {
            document.getElementById('wa-locked').style.display = 'block';
            document.getElementById('wa-unlocked').style.display = 'none';
        }
    }
    
    closeNav();
}

function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }

/* --- FILE UPLOAD HELPER --- */
async function uploadToStorage(file, folder) {
    if (!file) return null;
    const storageRef = window.sRef(window.storage, folder + "/" + Date.now() + "_" + file.name);
    try {
        const snapshot = await window.uploadBytes(storageRef, file);
        return await window.getDownloadURL(snapshot.ref);
    } catch (error) {
        alert("Upload Failed: Enable Storage in Firebase!");
        return null;
    }
}
function previewFile(inputId, imgId) {
    const file = document.getElementById(inputId).files[0];
    if (file) document.getElementById(imgId).src = URL.createObjectURL(file);
}

/* --- SEARCH --- */
function searchTools() {
    const input = document.getElementById('search-input').value.toLowerCase();
    const cards = document.getElementById('tools-grid').getElementsByClassName('card');
    for (let card of cards) {
        let txt = card.getElementsByTagName("h4")[0].innerText;
        card.style.display = txt.toLowerCase().includes(input) ? "" : "none";
    }
}

/* --- UPLOAD PRIME CONTENT (PDF/VIDEO) --- */
async function uploadPrimeWithFile() {
    if(!isAdmin) return alert("Only Admin can upload!");

    const title = document.getElementById('prime-title').value;
    const type = document.getElementById('prime-type').value;
    const fileInput = document.getElementById('prime-file-input');

    if(!title || fileInput.files.length === 0) return alert("Title and File required!");

    const btn = document.getElementById('upload-prime-btn');
    btn.innerText = "Uploading..."; btn.disabled = true;

    const url = await uploadToStorage(fileInput.files[0], 'prime_content');

    if(url) {
        window.dbPush(window.dbRef(window.db, 'prime_content'), { title, link: url, type })
        .then(() => {
            alert("✅ Uploaded to Prime!");
            btn.innerText = "UPLOAD TO PRIME"; btn.disabled = false;
        });
    } else { btn.disabled = false; }
}

function loadPrimeContent() {
    window.dbOnValue(window.dbRef(window.db, 'prime_content'), snap => {
        const grid = document.getElementById('prime-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(p => {
            let btnTxt = p.type === 'pdf' ? 'Download PDF' : 'Watch Video';
            grid.innerHTML += `<div class="card" style="border:1px solid gold; padding:10px;">
                <h4 style="color:white;">${p.title}</h4>
                <a href="${p.link}" target="_blank" class="btn-gold" style="display:block; text-align:center; padding:10px; text-decoration:none;">${btnTxt}</a>
            </div>`;
        });
    });
}

/* --- UPLOAD TOOLS --- */
async function uploadToolWithImage() {
    if(!isAdmin) return alert("Admins Only!");
    const name = document.getElementById('tool-name').value;
    const desc = document.getElementById('tool-desc').value;
    const cmds = document.getElementById('tool-cmds').value;
    const vid = document.getElementById('tool-video').value;
    const fileInput = document.getElementById('tool-file-input');
    
    if(!name || fileInput.files.length === 0) return alert("Name & Image Required!");
    const btn = document.getElementById('upload-tool-btn'); btn.innerText = "Uploading..."; btn.disabled = true;

    const imgUrl = await uploadToStorage(fileInput.files[0], 'tool_images');
    if(imgUrl) {
        window.dbPush(window.dbRef(window.db, 'tools'), { name, img: imgUrl, desc, commands: cmds, video: vid })
        .then(() => { alert("Tool Added!"); btn.innerText = "UPLOAD TOOL"; btn.disabled = false; loadTools(); });
    }
}

function loadTools() {
    window.dbOnValue(window.dbRef(window.db, 'tools'), snap => {
        const grid = document.getElementById('tools-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(t => {
            grid.innerHTML += `<div class="card"><img src="${t.img}" style="width:100%; height:150px; object-fit:cover;">
            <div class="card-content"><h4>${t.name}</h4><button class="btn-main" onclick="openModal('${t.name}', '${escape(t.desc)}', '${escape(t.commands)}', '${t.img}', '${t.video}')">OPEN</button></div></div>`;
        });
    });
}

/* --- MODAL --- */
function openModal(n, d, c, i, v) {
    document.getElementById('modal-title').innerText = n;
    document.getElementById('modal-img').src = i;
    document.getElementById('modal-desc').innerHTML = `<b>Info:</b><br>${unescape(d)}<br><br><b>Cmds:</b><div style='background:#000; padding:10px; border:1px dashed lime;'>${unescape(c).replace(/\n/g, '<br>')}</div>`;
    const vf = document.getElementById('modal-video');
    if(v && v.length > 5) { vf.style.display='block'; vf.src="https://www.youtube.com/embed/"+v; } else { vf.style.display='none'; }
    document.getElementById('articleModal').style.display='block';
}
function closeModal() { document.getElementById('articleModal').style.display='none'; document.getElementById('modal-video').src=""; }

/* --- LOGIN/PROFILE --- */
async function saveUserProfileWithFile() {
    if(!currentUserKey) return alert("Login First!");
    const btn = document.getElementById('save-profile-btn'); btn.innerText = "Saving..."; btn.disabled = true;
    const name = document.getElementById('profile-name').value;
    const dob = document.getElementById('profile-dob').value;
    let photoUrl = document.getElementById('profile-preview-img').src;
    const fileInput = document.getElementById('profile-file-input');
    
    if (fileInput.files.length > 0) {
        const url = await uploadToStorage(fileInput.files[0], 'profile_pics');
        if(url) photoUrl = url;
    }
    window.dbSet(window.dbRef(window.db, 'users/' + currentUserKey), { name, dob, photoUrl, userId: currentUserKey })
    .then(() => { alert("Saved!"); btn.innerText = "SAVE PROFILE"; btn.disabled = false; document.getElementById('headerProfileImg').src = photoUrl; });
}

function loadUserProfile() {
    window.dbGet(window.dbRef(window.db, 'users/' + currentUserKey)).then(snap => {
        if(snap.exists()) {
            const d = snap.val();
            document.getElementById('profile-name').value = d.name;
            document.getElementById('profile-dob').value = d.dob;
            document.getElementById('profile-preview-img').src = d.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
            document.getElementById('headerProfileImg').src = d.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
        }
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
function logout() { localStorage.clear(); location.href="login.html"; }
