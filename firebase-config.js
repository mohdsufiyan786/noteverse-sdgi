import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLboDZ0iTz4zeYG6ZXbxjxLNMy0SgWzXQ",
  authDomain: "notevrse-sdgi.firebaseapp.com",
  projectId: "notevrse-sdgi",
  storageBucket: "notevrse-sdgi.firebasestorage.app",
  messagingSenderId: "76842842572",
  appId: "1:76842842572:web:a2e1001afa6e69314b0569",
  measurementId: "G-N87YGMQ2GB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Local storage mein session save karo
setPersistence(auth, browserLocalPersistence);

export { auth, db, collection, getDocs, query, orderBy };