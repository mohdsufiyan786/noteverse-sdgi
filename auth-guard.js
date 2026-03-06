import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase ko time do session check karne ka
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes('login.html') || 
                        currentPage.includes('signup.html');

    if (!user && !isLoginPage) {
        // User nahi hai aur login page pe bhi nahi — redirect
        window.location.href = "/views/login.html";
    }
});

export function setupLogout() {
    // Sidebar ka Log Out button
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = "/views/login.html";
            }).catch((error) => {
                console.error("Logout Error:", error);
            });
        });
    });
}