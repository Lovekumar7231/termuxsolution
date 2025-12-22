/* --- VARIABLES --- */
let currentUser = null;
let currentUserKey = null;
let isAdmin = false;

/* --- INIT --- */
function initApp() {
    checkLogin();
    setTimeout(() => {
        loadTools();
        if(currentUser) loadUserProfile();
        listenForLiveStatus();
    }, 1500);
}

/* --- SEARCH FUNCTION --- */
function searchTools() {
    const input = document.getElementById('search-input').value.toLowerCase();
    const grid = document.getElementById('tools-grid');
    const cards = grid.getElementsByClassName('card');

    for (let i = 0; i < cards.length; i++) {
        let h4 = cards[i].getElementsByTagName("h4")[0];
        if (h4) {
            let txt = h4.textContent || h4.innerText;
            if (txt.toLowerCase().indexOf(input) > -1) {
                cards[i].style.display = "";
            } else {
                cards[i].style.display = "none";
            }
        }
    }
}

/* --- FILE UPLOAD HELPER --- */
async function uploadToStorage(file, folder) {
    if (!file) return null;
    const storageRef = window.sRef(window.storage, folder + "/" + Date.now() + "_" + file.name);
    try {
        const snapshot = await window.uploadBytes(storageRef, file);
        return await window.getDownloadURL(snapshot.ref);
    } catch (error) {
        alert("Upload Failed: Enable Firebase Storage!");
        return null;
    }
}
function previewFile(inputId, imgId) {
    const file = document.getElementById(inputId).files[0];
    if (file) document.getElementById(imgId).src = URL.createObjectURL(file);
}

/* --- ADMIN: UPLOAD TOOL --- */
async function uploadToolWithImage() {
    if(!isAdmin) return alert("Admins Only!");
    
    const name = document.getElementById('tool-name').value;
    const desc = document.getElementById('tool-desc').value;
    const cmds = document.getElementById('tool-cmds').value;
    const vid = document.getElementById('tool-video').value;
    const fileInput = document.getElementById('tool-file-input');

    if(!name || !cmds || fileInput.files.length === 0) return alert("Fill Name, Commands & Select Image!");

    const btn = document.getElementById('upload-tool-btn');
    btn.innerText = "Uploading... Wait";
    btn.disabled = true;

    const imgUrl = await uploadToStorage(fileInput.files[0], 'tool_images');

    if(imgUrl) {
        window.dbPush(window.dbRef(window.db, 'tools'), { 
            name, img: imgUrl, desc, commands: cmds, video: vid, timestamp: Date.now() 
        }).then(() => {
            alert("Tool Uploaded!");
            btn.innerText = "💾 UPLOAD TOOL"; btn.disabled = false;
            document.getElementById('tool-name').value = "";
            loadTools(); // Refresh list
        });
    } else {
        btn.disabled = false;
    }
}

/* --- LOAD TOOLS (HOME) --- */
function loadTools() {
    if(!window.dbRef) return;
    window.dbOnValue(window.dbRef(window.db, 'tools'), snap => {
        const grid = document.getElementById('tools-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) {
            Object.values(data).reverse().forEach(t => {
                const safeCmds = t.commands ? escape(t.commands) : ""; 
                grid.innerHTML += `
                <div class="card">
                    <img src="${t.img}" style="width:100%; height:150px; object-fit:cover; border-bottom:1px solid #333;">
                    <div class="card-content">
                        <h4 style="color:white; margin:10px 0;">${t.name}</h4>
                        <button class="btn-main" onclick="openToolModal('${t.name}', '${escape(t.desc)}', '${safeCmds}', '${t.img}', '${t.video}')">OPEN TOOL</button>
                    </div>
                </div>`;
            });
        }
    });
}

/* --- MODAL --- */
function openToolModal(name, desc, cmds, img, vid) {
    document.getElementById('modal-title').innerText = name;
    document.getElementById('modal-img').src = img;
    document.getElementById('modal-desc').innerHTML = `<b>Info:</b><br>${unescape(desc)}<br><br><b>Commands:</b><br><div style='background:#000; padding:10px; border:1px dashed lime;'>${unescape(cmds).replace(/\n/g, "<br>")}</div>`;
    const v = document.getElementById('modal-video');
    if(vid && vid.length > 5) { v.parentElement.style.display='block'; v.src="https://www.youtube.com/embed/"+vid; } 
    else { v.parentElement.style.display='none'; }
    document.getElementById('articleModal').style.display='block';
}
function closeModal() { document.getElementById('articleModal').style.display='none'; document.getElementById('modal-video').src=""; }

/* --- PROFILE & AUTH --- */
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
    .then(() => { alert("Profile Saved!"); btn.innerText = "💾 SAVE PROFILE"; btn.disabled = false; updateProfileUI(photoUrl); });
}

function updateProfileUI(url) { if(url) document.getElementById('headerProfileImg').src = url; }
function loadUserProfile() {
    window.dbGet(window.dbRef(window.db, 'users/' + currentUserKey)).then(snap => {
        if(snap.exists()) {
            const d = snap.val();
            document.getElementById('profile-name').value = d.name;
            document.getElementById('profile-dob').value = d.dob;
            updateProfileUI(d.photoUrl);
            document.getElementById('profile-preview-img').src = d.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
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
function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }
function showSection(id) {
    document.querySelectorAll('.hidden-section').forEach(s => s.style.display='none');
    document.getElementById(id+'-section').style.display='block';
    if(id==='profile' && currentUser) loadUserProfile();
    closeNav();
}
// Live Status Listener (Basic)
function listenForLiveStatus() {
    window.dbOnValue(window.dbRef(window.db, 'live_status/current'), snap => {
        const d = snap.val();
        if(d && d.isLive) { 
            document.getElementById('active-live-card').style.display='block'; 
            document.getElementById('no-live-msg').style.display='none'; 
        } else {
            document.getElementById('active-live-card').style.display='none'; 
            document.getElementById('no-live-msg').style.display='block'; 
        }
    });
}
