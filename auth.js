// 🔥 Firebase configuration (Keep your config here)
const firebaseConfig = {
  apiKey: "AIzaSyDVZCY-3xLepXzcdWGtR34wqdXqJQevI7Q",
  authDomain: "termuxhacking-aac55.firebaseapp.com",
  projectId: "termuxhacking-aac55",
  storageBucket: "termuxhacking-aac55.appspot.com",
  messagingSenderId: "921781091312",
  appId: "1:921781091312:web:39a1b96ceda5bc60b83b35"
};

// Check if Firebase is available before initializing
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
}

/* ===== GLITCH TEXT EFFECT (Common for all pages) ===== */
function glitchText(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return; // Element nahi mila to ruk jao

    const original = el.innerText;
    const chars = "!@#$%^&*()_+-=<>?/";

    let i = 0;
    const interval = setInterval(() => {
        el.innerText = original
            .split("")
            .map((c, index) =>
                index < i ? c : chars[Math.floor(Math.random() * chars.length)]
            )
            .join("");

        i += 1/2; // Thoda slow kiya taaki effect smooth dikhe
        if (i > original.length) {
            el.innerText = original;
            clearInterval(interval);
        }
    }, 40);
}

// Page load hone par glitch effect run karein
window.onload = () => {
    // Login page title
    if(document.getElementById("loginTitle")) glitchText("loginTitle");
    // Signup page title
    if(document.getElementById("signupTitle")) glitchText("signupTitle");
    // Forgot Password page title
    if(document.getElementById("forgotTitle")) glitchText("forgotTitle");
};

/* ===== BUTTON LOADING EFFECT ===== */
function loading(btn, text = "Processing...") {
    btn.disabled = true;
    btn.dataset.old = btn.innerText;
    btn.innerText = text;

    setTimeout(() => {
        btn.innerText = btn.dataset.old;
        btn.disabled = false;
        
        // Agar ye login page ka button hai, to checkLogin function call karo
        if(btn.id === "loginBtn") {
            checkLogin();
        }
    }, 2000);
}

/* ===== ADMIN LOGIN LOGIC ===== */
function checkLogin() {
    const user = document.getElementById('usernameInput').value;
    const pass = document.getElementById('passwordInput').value;
    const captchaInput = document.getElementById('captchaA').value;
    
    // Captcha validation (Assuming captcha vars a and b are global from captcha.js)
    // Note: Simple check logic here
    
    if (user === "Admin" && pass === "itzlove@7231") {
        alert("ACCESS GRANTED: WELCOME ADMIN");
        window.location.href = "index.html"; // Redirect to home
    } else {
        alert("ACCESS DENIED: Invalid Credentials");
    }
}

function checkStrength(pwd) {
    let strength = "Weak";
    if (pwd.length > 7 && /[A-Z]/.test(pwd) && /\d/.test(pwd))
        strength = "Strong";
    const strElem = document.getElementById("strength");
    if(strElem) strElem.innerText = "Strength: " + strength;
}
