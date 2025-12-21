/* --- SIDEBAR LOGIC --- */
function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }

/* --- FULL ARTICLE MODAL LOGIC --- */
function openArticle(title, cmds, img, videoId) {
    document.getElementById("modal-title").innerText = title;
    document.getElementById("modal-desc").innerText = cmds;
    document.getElementById("modal-img").src = img;
    
    // Video Setup
    const vidContainer = document.getElementById("video-container");
    const vidFrame = document.getElementById("modal-video");
    
    if (videoId && videoId.length > 5) {
        vidContainer.style.display = "block";
        vidFrame.src = "https://www.youtube.com/embed/" + videoId;
    } else {
        vidContainer.style.display = "none";
        vidFrame.src = "";
    }
    
    document.getElementById("articleModal").style.display = "block";
}

function closeArticle() {
    document.getElementById("articleModal").style.display = "none";
    document.getElementById("modal-video").src = ""; // Stop Video
}

/* --- GO LIVE LIMIT LOGIC (Client Side for Admin) --- */
let liveCount = 0; // Reset on refresh (Better to use localStorage for daily limit)

function triggerLive() {
    // Check local storage for today's limit
    let today = new Date().toDateString();
    let storedData = JSON.parse(localStorage.getItem("adminLiveLimit")) || { date: today, count: 0 };

    if (storedData.date !== today) {
        storedData = { date: today, count: 0 }; // Reset if new day
    }

    if (storedData.count >= 3) {
        alert("🚫 LIMIT REACHED: You can only go live 3 times per day.");
        return;
    }

    const msg = document.getElementById("live-msg-input").value;
    document.getElementById("live-msg-text").innerText = msg || "Admin is Live!";
    document.getElementById("live-banner").style.display = "flex";
    
    // Increment Count
    storedData.count++;
    localStorage.setItem("adminLiveLimit", JSON.stringify(storedData));
    document.getElementById("live-count").innerText = storedData.count + "/3 Used";
}

/* --- NAVIGATION --- */
function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }

/* --- MODAL LOGIC (See All) --- */
function openArticle(title, cmds, img, videoId) {
    // 1. Set Text & Image
    document.getElementById("modal-title").innerText = title;
    document.getElementById("modal-desc").innerText = cmds;
    document.getElementById("modal-img").src = img;
    
    // 2. Handle Video
    const vidContainer = document.getElementById("video-container");
    const vidFrame = document.getElementById("modal-video");
    
    if (videoId && videoId.trim() !== "") {
        vidContainer.style.display = "block";
        vidFrame.src = "https://www.youtube.com/embed/" + videoId;
    } else {
        vidContainer.style.display = "none";
        vidFrame.src = "";
    }
    
    // 3. Show Modal
    document.getElementById("articleModal").style.display = "block";
}

function closeArticle() {
    document.getElementById("articleModal").style.display = "none";
    document.getElementById("modal-video").src = ""; // Stop video playback
}

/* --- GO LIVE LIMIT LOGIC (3 Times/Day) --- */
function triggerLive() {
    // Check LocalStorage for today's count
    const today = new Date().toDateString();
    let data = JSON.parse(localStorage.getItem("adminLiveLimit")) || { date: today, count: 0 };

    // If date changed, reset count
    if (data.date !== today) {
        data = { date: today, count: 0 };
    }

    // Check Limit
    if (data.count >= 3) {
        alert("🚫 LIMIT REACHED: You have used all 3 Live sessions for today.");
        return;
    }

    // Show Live Banner
    const msg = document.getElementById("live-msg-input").value;
    document.getElementById("live-msg-text").innerText = msg || "Admin is Live!";
    document.getElementById("live-banner").style.display = "flex";
    
    // Update Count
    data.count++;
    localStorage.setItem("adminLiveLimit", JSON.stringify(data));
    document.getElementById("live-count").innerText = `Usage: ${data.count}/3 Today`;
}

// Close Modal on Outside Click
window.onclick = function(event) {
    const modal = document.getElementById("articleModal");
    if (event.target == modal) {
        closeArticle();
    }
}
