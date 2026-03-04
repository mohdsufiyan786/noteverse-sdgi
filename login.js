import { auth, db } from "./firebase-config.js";
import { 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ✅ Switch Login (Student/Faculty)
window.switchLogin = function(type) {
    const loginTitle = document.getElementById('login-title');
    const identityLabel = document.getElementById('identity-label');
    const identityInput = document.getElementById('identity-input');
    const tabs = document.querySelectorAll('.toggle-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    if (type === 'faculty') {
        loginTitle.innerText = "Faculty Login";
        identityLabel.innerText = "Faculty Email ID";
        identityInput.placeholder = "faculty@sdgi.edu.in";
        tabs[1].classList.add('active');
    } else {
        loginTitle.innerText = "Student Login";
        identityLabel.innerText = "Student Email ID";
        identityInput.placeholder = "name@gmail.com";
        tabs[0].classList.add('active');
    }
};

const loginForm = document.querySelector('form');
const identityInput = document.getElementById('identity-input');
const passwordInput = document.querySelector('input[type="password"]');
const loginBtn = document.querySelector('.btn-primary');
const errorBox = document.getElementById('error-message');
const forgotLink = document.querySelector('.forgot-pass a');

// ✅ Forgot Password
forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = identityInput.value.trim();

    if (!email) {
        errorBox.innerText = "Please Enter Email!";
        errorBox.style.display = "block";
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        errorBox.style.color = "#22c55e";
        errorBox.style.background = "#f0fdf4";
        errorBox.style.borderColor = "#86efac";
        errorBox.innerText = "✅ Password reset email send successfully! Check Inbox.";
        errorBox.style.display = "block";
    } catch (error) {
        errorBox.style.color = "#ff4d4d";
        errorBox.style.background = "#ffe6e6";
        errorBox.style.borderColor = "#ffcccc";
        errorBox.innerText = "❌ Wrong Email Id.";
        errorBox.style.display = "block";
    }
});

// ✅ Google Login
const googleBtn = document.getElementById('google-login-btn');
const provider = new GoogleAuthProvider();

if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (!userDoc.exists()) {
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    name: user.displayName,
                    role: "student",
                    createdAt: new Date()
                });
                window.location.href = "student_dashboard.html";
            } else {
                const role = userDoc.data().role;
                window.location.href = role === "faculty" ? "faculty_dashboard.html" : "student_dashboard.html";
            }
        } catch (error) {
            errorBox.innerText = "Google Login fail: " + error.message;
            errorBox.style.display = "block";
        }
    });
}

// ✅ Email/Password Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = identityInput.value.trim();
    const password = passwordInput.value;

    try {
        loginBtn.innerText = "Checking... ⏳";
        loginBtn.disabled = true;
        errorBox.style.display = "none";

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const role = userDoc.data().role;
            window.location.href = role === "faculty" ? "faculty_dashboard.html" : "student_dashboard.html";
        } else {
            window.location.href = "student_dashboard.html";
        }

    } catch (error) {
        errorBox.style.color = "#ff4d4d";
        errorBox.style.background = "#ffe6e6";
        errorBox.style.borderColor = "#ffcccc";
        errorBox.innerText = "❌ Invalid Email or Password!";
        errorBox.style.display = "block";
        loginBtn.innerText = "Log In →";
        loginBtn.disabled = false;
    }
});