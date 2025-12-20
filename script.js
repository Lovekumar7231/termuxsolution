/* DOM Load hone ka wait karein taaki button click miss na ho */
document.addEventListener('DOMContentLoaded', function() {
    
    // Menu Button ko pakdo
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("mySidebar");
    const closeBtn = document.querySelector(".closebtn");

    // Agar button mil gaya to click event lagao
    if (menuBtn) {
        menuBtn.addEventListener("click", function() {
            console.log("Menu Clicked!"); // Testing ke liye
            sidebar.style.width = "250px";
        });
    }

    // Close button ka logic
    if (closeBtn) {
        closeBtn.addEventListener("click", function() {
            sidebar.style.width = "0";
        });
    }
});

/* Navigation Manager (Updated to Hide Commands) */
function showSection(name) {
    // 1. Close the sidebar first
    document.getElementById("mySidebar").style.width = "0";

    // 2. List all section IDs that need to be hidden. 
    // Added 'commands' to this array.
    ["home", "login", "signup", "about", "prime", "commands"].forEach(s => {
        const el = document.getElementById(s + "-section");
        if (el) {
            el.style.display = "none"; // Hide every section in the list
        }
    });

    // 3. Show only the requested section
    const target = document.getElementById(name + "-section");
    if (target) {
        target.style.display = "block"; // Show the targeted section
    }
}

/* Live Dashboard Functions */
function openLiveDashboard() {
    // block ki jagah 'flex' karein
    var dashboard = document.getElementById("live-dashboard-section");
    dashboard.style.display = "flex"; 
    dashboard.style.flexDirection = "column"; 
}



function openLiveDashboard() {
    // Live Dashboard Section ko select karo
    var dashboard = document.getElementById("live-dashboard-section");
    
    // Usko dikhane ke liye 'flex' set karo
    if (dashboard) {
        dashboard.style.display = "flex";
        dashboard.style.flexDirection = "column";
    }

    // Chat box mein welcome message dikhane ka logic
    var chat = document.getElementById("chat-box");
    if (chat && chat.innerHTML.trim() === "") {
         systemMsg("🔴 Connected to Encrypted Server...");
         setTimeout(function(){ systemMsg("👋 Welcome Agent"); }, 1000);
    }
}



function sendChat() {
    const input = document.getElementById("my-chat-msg");
    if (!input.value) return;
    
    const d = document.createElement("div");
    d.style.marginBottom = "5px";
    d.innerHTML = `<b style="color:#00ff41">You:</b> <span style="color:#fff">${input.value}</span>`;
    
    document.getElementById("chat-box").appendChild(d);
    input.value = "";
}

function systemMsg(t) {
    const d = document.createElement("div");
    d.style.color = "#888";
    d.innerText = t;
    document.getElementById("chat-box").appendChild(d);
}

function joinPrime() {
    alert("Payment Gateway Integration Pending...");
}

function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
}

function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
}

function handleUnlock() {
    // This variable should be connected to your Razorpay/Firebase payment status later
    let userIsPremium = false; 

    if (userIsPremium) {
        const container = document.getElementById('mobile-container');
        const display = document.getElementById('number-display');
        
        // Update styling for Premium View
        container.style.background = "#fff9e6"; 
        container.style.border = "1px solid #ffeeba";
        
        display.innerHTML = `<i class="fas fa-phone-alt" style="color: #28a745; margin-right: 10px;"></i><span style="color: #28a745; font-weight: bold;">Mobile: +91 7231860034</span>`;
        
        // Hide the unlock button since it is already unlocked
        container.querySelector('button').style.display = 'none';
        alert("Access Granted: Support number is now visible.");
    } else {
        // English Alert Message
        alert("🔒 This feature is exclusive to Premium Members. Please subscribe to view the contact number.");
        
        // Optional: Redirect user to payment page
        // window.location.href = "payment.html";
    }
}

// Sample Data
let myTools = [
    { name: "Nmap", cmds: "pkg install nmap\nnmap --version" },
    { name: "Metasploit", cmds: "pkg install unstable-repo\npkg install metasploit" }
];

// Display tools as large cards
function renderTools() {
    const list = document.getElementById('tools-list-container');
    list.innerHTML = ""; 

    myTools.forEach((tool, index) => {
        list.innerHTML += `
            <div class="card tool-card" style="border: 1px solid #ff0066; margin-bottom: 20px; padding: 20px; text-align: center;">
                <h3 style="color: #00ff00; font-size: 22px; margin-bottom: 15px;">📦 ${tool.name}</h3>
                
                <div id="cmds-${index}" style="display: none; background: #000; padding: 15px; border-radius: 5px; color: #0f0; font-family: monospace; text-align: left; border: 1px solid #333; margin-bottom: 15px; font-size: 14px; overflow-x: auto;">
                    ${tool.cmds.replace(/\n/g, '<br>')}
                </div>

                <button onclick="toggleTool(${index})" style="background: #ff0066; color: white; border: none; padding: 12px; width: 100%; border-radius: 5px; font-weight: bold; cursor: pointer;">
                    VIEW COMMANDS
                </button>
            </div>
        `;
    });
}

// Function to open/close commands
function toggleTool(index) {
    let box = document.getElementById(`cmds-${index}`);
    box.style.display = (box.style.display === "none") ? "block" : "none";
}

// Search Filter
function searchTools() {
    let input = document.getElementById('toolSearch').value.toLowerCase();
    let cards = document.getElementsByClassName('tool-card');

    for (let card of cards) {
        let name = card.innerText.toLowerCase();
        card.style.display = name.includes(input) ? "block" : "none";
    }
}

// Admin function to add new tool
function addNewTool() {
    let name = document.getElementById('adminToolName').value;
    let cmds = document.getElementById('adminToolCmds').value;
    if(name && cmds) {
        myTools.push({name: name, cmds: cmds});
        renderTools();
        alert("Tool Saved!");
    }
}

// Initialize on page load
renderTools();
