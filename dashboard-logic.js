import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Jab user login state change hogi, ye function chalega
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User mil gaya:", user.email);

        // HTML element ko pakdo
        const welcomeName = document.getElementById('user-welcome-name');

        if (welcomeName) {
            // Agar Ajay ne naam set kiya hai toh wo, nahi toh email ka pehla part
            const name = user.displayName || user.email.split('@')[0];
            
            // UI par naam update karo
            welcomeName.innerText = `Hi, ${name} 👋`;
            console.log("Username update ho gaya:", name);
        } else {
            console.log("Error: HTML mein 'user-welcome-name' ID nahi mili!");
        }
    } else {
        // Agar user login nahi hai toh login page par bhej do
        window.location.href = "login.html";
    }
});