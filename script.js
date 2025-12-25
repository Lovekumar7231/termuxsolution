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

/* --- AUTH & LOGIN CHECK --- */
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

/* --- PROFILE LOGIC --- */
function loadUserProfile() {
    if(!currentUserKey) return;
    
    // Set username from localStorage immediately
    document.getElementById('profile-name').value = currentUser;

    window.dbGet(window.dbRef(window.db, 'users/' + currentUserKey)).then(snap => {
        if(snap.exists()) {
            const d = snap.val();
            if(d.isPrime) isPrimeMember = true;
            if(d.dob) document.getElementById('profile-dob').value = d.dob;
            if(d.profilePic) {
                document.getElementById('profile-preview-img').src = d.profilePic;
                document.getElementById('headerProfileImg').src = d.profilePic;
            }
        }
    });
}

async function saveUserProfileWithFile() {
    if(!currentUserKey) return alert("Please Login!");

    const dob = document.getElementById('profile-dob').value;
    const fileInput = document.getElementById('profile-file-input');
    const btn = document.getElementById('save-profile-btn');
    
    btn.innerText = "Saving..."; btn.disabled = true;
    let updateData = { dob: dob };

    if(fileInput.files.length > 0) {
        const imgUrl = await uploadToStorage(fileInput.files[0], 'user_profiles');
        if(imgUrl) updateData.profilePic = imgUrl;
    }

    window.dbUpdate(window.dbRef(window.db, 'users/' + currentUserKey), updateData)
    .then(() => {
        alert("✅ Profile Updated!");
        btn.innerText = "SAVE PROFILE"; btn.disabled = false;
        loadUserProfile();
    }).catch(() => { btn.disabled = false; });
}

/* --- UPLOAD HELPERS --- */
async function uploadToStorage(file, folder) {
    if (!file) return null;
    const fileName = Date.now() + "_" + file.name.replace(/\s+/g, '_');
    const storageRef = window.sRef(window.storage, folder + "/" + fileName);
    try {
        const snapshot = await window.uploadBytes(storageRef, file);
        return await window.getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error(error);
        return null;
    }
}

/* --- ADMIN FUNCTIONS --- */
async function uploadPrimeWithFile() {
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
            alert("✅ Uploaded!");
            btn.innerText = "UPLOAD TO PRIME"; btn.disabled = false;
        });
    } else { btn.disabled = false; }
}

// Baki functions (loadTools, loadPrimeContent, etc.) wahi rahenge jo aapne pehle diye the.

