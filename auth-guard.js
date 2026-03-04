import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Chokidari (Route Protection)
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Agar user login nahi hai, toh login page par bhej do
        window.location.href = "login.html";
    }
});

// 2. Logout Logic
export function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn'); // ID check kar lena dashboard HTML mein
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = "login.html";
            }).catch((error) => {
                console.error("Logout Error:", error);
            });
        });
    }
}