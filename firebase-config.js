
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// 1. Firestore import zaroori hai
import { getFirestore, collection, getDocs, query, orderBy} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";




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
// 2. db ko yahan initialize karo
const db = getFirestore(app);

// 3. Dono ko export karo
export { auth,db, collection, getDocs,query, orderBy};

