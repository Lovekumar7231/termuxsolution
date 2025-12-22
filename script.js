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

/* --- RAZORPAY PAYMENT LOGIC --- */
function startRazorpayPayment() {
    if(!currentUserKey) return alert("Please Login First to Buy!");

    var options = {
        "key": "rzp_test_123456789", // ⚠️ REPLACE WITH YOUR REAL RAZORPAY KEY ID
        "amount": 39900, // Amount in paise (399.00)
        "currency": "INR",
        "name": "Termux Hacking Family",
        "description": "Prime Membership",
        "image": "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        "handler": function (response){
            // Payment Success hone par ye chalega
            activatePrimeMembership(response.razorpay_payment_id);
        },
        "prefill": {
            "name": currentUser,
            "email": "user@example.com",
            "contact": "9999999999"
        },
        "theme": { "color": "#00ff41" }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
    
    // Error Handler
    rzp1.on('payment.failed', function (response){
        alert("Payment Failed: " + response.error.description);
    });
}

// Database me Prime Activate karna
function activatePrimeMembership(paymentId) {
    window.dbUpdate(window.dbRef(window.db, 'users/' + currentUserKey), {
        isPrime: true,
        paymentId: paymentId,
        primeDate: Date.now()
    }).then(() => {
        alert("🎉 Congratulations! Prime Membership Activated.");
        isPrimeMember = true;
        checkPrimeAccess(); // UI update karo
        showSection('about'); // Wapas about section dikhao taki number dikhe
    });
}

/* --- WHATSAPP UNLOCK LOGIC --- */
function checkPrimeAccess() {
    // Agar Admin hai ya Prime Member hai
    if(isAdmin || isPrimeMember) {
        document.getElementById('wa-locked').style.display = 'none';
        document.getElementById('wa-unlocked').style.display = 'block';
        document.getElementById('buy-btn-container').style.display = 'none';
        document.getElementById('already-prime').style.display = 'block';
    } else {
        document.getElementById('wa-locked').style.display = 'block';
        document.getElementById('wa-unlocked').style.display = 'none';
        document.getElementById('buy-btn-container').style.display = 'block';
        document.getElementById('already-prime').style.display = 'none';
    }
}

/* --- NAVIGATION --- */
function showSection(id) {
    document.querySelectorAll('.hidden-section').forEach(s => s.style.display='none');
    document.getElementById(id+'-section').style.display='block';
    
    // Jab bhi About ya Prime page khule, check karo ki Prime hai ya nahi
    if(id === 'about' || id === 'prime') {
        checkPrimeAccess();
    }
    closeNav();
}

function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }

/* --- FIXED: UPLOAD FUNCTION --- */
async function uploadToStorage(file, folder) {
    if (!file) {
        alert("⚠️ No File Selected!");
        return null;
    }
    
    // Unique Filename Generation
    const fileName = Date.now() + "_" + file.name.replace(/\s+/g, '_'); // Remove spaces
    const storageRef = window.sRef(window.storage, folder + "/" + fileName);
    
    try {
        const snapshot = await window.uploadBytes(storageRef, file);
        const url = await window.getDownloadURL(snapshot.ref);
        return url;
    } catch (error) {
        console.error("Upload Error:", error);
        alert("❌ Upload Failed! Check Firebase Storage Rules.");
        return null;
    }
}

/* --- ADMIN: UPLOAD PRIME CONTENT --- */
async function uploadPrimeWithFile() {
    if(!isAdmin) return alert("Only Admin can upload!");

    const title = document.getElementById('prime-title').value;
    const type = document.getElementById('prime-type').value;
    const fileInput = document.getElementById('prime-file-input');

    if(!title || fileInput.files.length === 0) return alert("Title and File required!");

    const btn = document.getElementById('upload-prime-btn');
    btn.innerText = "Uploading (Wait)..."; btn.disabled = true;

    const url = await uploadToStorage(fileInput.files[0], 'prime_content');

    if(url) {
        window.dbPush(window.dbRef(window.db, 'prime_content'), { title, link: url, type })
        .then(() => {
            alert("✅ Uploaded Successfully!");
            btn.innerText = "UPLOAD TO PRIME"; btn.disabled = false;
        });
    } else { 
        btn.innerText = "UPLOAD TO PRIME";
        btn.disabled = false; 
    }
}

/* --- ADMIN: UPLOAD TOOLS --- */
async function uploadToolWithImage() {
    if(!isAdmin) return alert("Admins Only!");
    const name = document.getElementById('tool-name').value;
    const desc = document.getElementById('tool-desc').value;
    const cmds = document.getElementById('tool-cmds').value;
    const fileInput = document.getElementById('tool-file-input');
    
    if(!name || fileInput.files.length === 0) return alert("Name & Image Required!");
    
    const btn = document.getElementById('upload-tool-btn'); btn.innerText = "Uploading..."; btn.disabled = true;

    const imgUrl = await uploadToStorage(fileInput.files[0], 'tool_images');
    if(imgUrl) {
        window.dbPush(window.dbRef(window.db, 'tools'), { name, img: imgUrl, desc, commands: cmds })
        .then(() => { 
            alert("✅ Tool Added!"); 
            btn.innerText = "UPLOAD TOOL"; btn.disabled = false; 
            loadTools(); 
        });
    } else {
        btn.innerText = "UPLOAD TOOL"; btn.disabled = false; 
    }
}

/* --- LOAD DATA --- */
function loadTools() {
    window.dbOnValue(window.dbRef(window.db, 'tools'), snap => {
        const grid = document.getElementById('tools-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(t => {
            grid.innerHTML += `<div class="card"><img src="${t.img}" style="width:100%; height:150px; object-fit:cover;">
            <div class="card-content"><h4>${t.name}</h4><button class="btn-main" onclick="alert('${t.commands}')">VIEW</button></div></div>`;
        });
    });
}

function loadPrimeContent() {
    window.dbOnValue(window.dbRef(window.db, 'prime_content'), snap => {
        const grid = document.getElementById('prime-grid'); grid.innerHTML = "";
        const data = snap.val();
        if(data) Object.values(data).reverse().forEach(p => {
            // Sirf Prime users ko link dikhao
            let action = (isPrimeMember || isAdmin) ? `<a href="${p.link}" target="_blank" class="btn-gold">OPEN</a>` : `<button class="btn-gold" onclick="alert('Buy Prime First!')">LOCKED 🔒</button>`;
            
            grid.innerHTML += `<div class="card" style="border:1px solid gold; padding:10px;">
                <h4 style="color:white;">${p.type.toUpperCase()}: ${p.title}</h4>
                ${action}
            </div>`;
        });
    });
}

function loadUserProfile() {
    window.dbGet(window.dbRef(window.db, 'users/' + currentUserKey)).then(snap => {
        if(snap.exists()) {
            const d = snap.val();
            // Check Prime Status from DB
            if(d.isPrime) { isPrimeMember = true; }
            document.getElementById('profile-name').value = d.name;
        }
    });
}

/* --- AUTH --- */
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
function previewFile(inputId, imgId) {
    const file = document.getElementById(inputId).files[0];
    if (file) document.getElementById(imgId).src = URL.createObjectURL(file);
}
// Profile save logic same as before...
async function saveUserProfileWithFile() {
    // (Purana code use karein, bas uploadToStorage call karein)
}
