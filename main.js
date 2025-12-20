// Variable to track Login State (False = Guest, True = Logged In)
let isLoggedIn = false;

// 1. Function to Toggle (Show/Hide) the 3-Dot Menu
function toggleMenu() {
    const menu = document.getElementById('dropdown');
    
    // Pehle menu items update karo current state ke hisab se
    updateMenuContent();
    
    // Class toggle karo (CSS mein display: block ho jayega)
    menu.classList.toggle('active');
}

// 2. Function to Update Menu Content dynamically
function updateMenuContent() {
    const menu = document.getElementById('dropdown');
    
    if (!isLoggedIn) {
        // Agar user Guest hai
        menu.innerHTML = `
            <div class="dropdown-item btn-login-menu" onclick="openLoginModal()">Login / Sign Up</div>
            <div class="dropdown-item">Pricing Plans</div>
            <div class="dropdown-item">About Us</div>
            <div class="dropdown-item">Contact Support</div>
        `;
    } else {
        // Agar user Logged In hai
        menu.innerHTML = `
            <div class="dropdown-item"><b>My Profile</b></div>
            <div class="dropdown-item">My Dashboard</div>
            <div class="dropdown-item">Purchased Notes</div>
            <div class="dropdown-item btn-logout" onclick="logout()">Logout</div>
        `;
    }
}

// 3. Login Modal Functions
function openLoginModal() {
    // Menu band karo
    document.getElementById('dropdown').classList.remove('active');
    // Modal dikhao
    document.getElementById('loginModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('loginModal').style.display = 'none';
}

// 4. Simulate Login (Testing ke liye)
function simulateLogin() {
    const username = document.querySelector('.input-field').value;
    
    if(username) {
        isLoggedIn = true;
        closeModal();
        alert("Welcome " + username + "! You are now logged in.");
    } else {
        alert("Just click 'Login Now' for demo (Enter any name).");
        isLoggedIn = true; // Force login for demo
        closeModal();
    }
}

// 5. Logout Function
function logout() {
    isLoggedIn = false;
    alert("You have been logged out.");
    // Menu band karo taki agli baar refresh hoke khule
    document.getElementById('dropdown').classList.remove('active');
}

// Close menu if clicked outside (Optional UX improvement)
window.onclick = function(event) {
    if (!event.target.matches('.three-dots')) {
        var dropdowns = document.getElementsByClassName("dropdown-menu");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('active')) {
                openDropdown.classList.remove('active');
            }
        }
    }
}

/* Live Dashboard Open Karne Par */
function openLiveDashboard() {
    const section = document.getElementById("live-dashboard-section");
    section.style.display = "flex"; // Note: Yahan 'block' nahi 'flex' use karein
    
    const chat = document.getElementById("chat-box");
    // Agar chat khali hai to welcome msg dikhao
    if(chat.innerHTML.trim() === "") {
        systemMsg("🔒 Connected to Encrypted Server...");
        setTimeout(() => systemMsg("👋 Welcome Agent"), 1000);
    }
}

/* Message Bhejne Ka Logic */
function sendChat() {
    const input = document.getElementById("my-chat-msg");
    if (!input.value) return;
    
    const d = document.createElement("div");
    d.style.marginBottom = "8px";
    d.innerHTML = `<b style="color:#00ff41">You:</b> <span style="color:#fff">${input.value}</span>`;
    
    const chatBox = document.getElementById("chat-box");
    chatBox.appendChild(d);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto scroll niche
    
    input.value = ""; // Input khali karo
}

function systemMsg(t) {
    const d = document.createElement("div");
    d.style.color = "#888";
    d.style.fontSize = "12px";
    d.style.marginBottom = "5px";
    d.innerText = t;
    document.getElementById("chat-box").appendChild(d);
}
