// signup.js

// Auth import karo (Upar wali file se)

import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Purana code:
// import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// HTML Elements
const signupForm = document.querySelector('form');
const nameInput = document.querySelector('input[type="text"]'); // Full Name
const emailInput = document.querySelector('input[type="email"]'); // Email
const passwordInput = document.querySelector('input[type="password"]'); // Password
const signupBtn = document.querySelector('button'); // Button


// --- 1. Google Signup Logic ---
const googleProvider = new GoogleAuthProvider();
const googleSignupBtn = document.getElementById('google-signup-btn');

if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Firestore check taaki purana data overwrite na ho
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) {
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    name: user.displayName,
                    role: "student",
                    createdAt: new Date()
                });
                // await setDoc ke turant baad ye add karein
        console.log("New student detected! Sending welcome mail...");
        sendWelcomeEmail(user.displayName, user.email);
            }
            window.location.href = "student_dashboard.html";
        } catch (error) {
            console.error("Signup Error:", error);
            alert("Google Signup failed!");
        }
    });
}
// Jab Form Submit
// hoga
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Page reload roko

    const name = nameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    console.log("Registering:", email);

    try {
        signupBtn.innerText = "Creating Account...";
        signupBtn.disabled = true;

        // --- FIREBASE: Account Banao ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Naam Update Karo
        await updateProfile(user, {
            displayName: name
        });

        
        
        // Dashboard par bhejo
        window.location.href = "/student_dashboard.html";

    } catch (error) {
        console.error("Error:", error);
        
        if (error.code === 'auth/email-already-in-use') {
            alert("Email already rgistered!");
        } else if (error.code === 'auth/weak-password') {
            alert("Password should be 8 character.");
        } else {
            alert("Error: " + error.message);
        }
        
        signupBtn.innerText = "Create Account";
        signupBtn.disabled = false;
    }
});

function sendWelcomeEmail(userName, userEmail) {
    const templateParams = {
        user_name: userName,    // Template ke {{user_name}} variable ke liye
        user_email: userEmail   // Template ke {{user_email}} variable ke liye
    };

    emailjs.send(
        'service_qxaio4a',      // Aapki Service ID
        'template_j9kadca',     // Aapki Nayi Template ID
        templateParams
    ).then(() => {
        console.log('Welcome Email Sent successfully! 🚀');
    }).catch((error) => {
        console.error('Email failed:', error);
    });
}

