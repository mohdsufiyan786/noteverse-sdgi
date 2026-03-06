import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Pehle kuch mat karo — Firebase ko load hone do
auth.authStateReady().then(() => {
    onAuthStateChanged(auth, (user) => {
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('login.html') || 
                            currentPage.includes('signup.html');

        if (!user && !isLoginPage) {
            window.location.href = "/views/login.html";
        }
    });
});

export function setupLogout() {
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = "/views/login.html";
            });
        });
    });
}