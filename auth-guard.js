import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let isFirstCheck = true;

onAuthStateChanged(auth, (user) => {
    if (isFirstCheck) {
        isFirstCheck = false;
        if (!user) {
            window.location.href = "login.html";
        }
    }
});

export function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
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