import { db } from './firebase-config.js'; 
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Current logged in user
let currentUser = null;
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

const modal = document.getElementById("uploadModal");
const uploadBtn = document.querySelector(".upload-note-btn");
const closeBtn = document.querySelector(".close-btn");

if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
        modal.style.display = "block";
    });
}

if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

const fileInput = document.getElementById("noteFile");
const infoBox = document.getElementById("fileInfoBox");
const nameDisplay = document.getElementById("selectedFileName");
const removeBtn = document.getElementById("removeFile");

let selectedFile = null;

fileInput.addEventListener("change", function() {
    if (this.files && this.files[0]) {
        selectedFile = this.files[0];
        infoBox.style.display = "block";
        nameDisplay.innerText = selectedFile.name + " (" + (selectedFile.size / 1024).toFixed(1) + " KB)";
        document.getElementById("fileNameDisplay").innerText = "File Attached Successfully";
    }
});

removeBtn.onclick = () => {
    fileInput.value = "";
    selectedFile = null;
    infoBox.style.display = "none";
    document.getElementById("fileNameDisplay").innerText = "Click to choose PDF Note";
};

const uploadForm = document.getElementById("uploadNoteForm");

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!selectedFile) {
        alert('Pehle file select karo!');
        return;
    }

    if (!currentUser) {
        alert('Pehle login karo!');
        return;
    }

    const title = document.getElementById("noteTitle").value;
    const course = document.getElementById("courseSelect").value;
    const sem = document.getElementById("semSelect").value;

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span>Uploading...</span>";

    const formData = new FormData();
    formData.append('noteFile', selectedFile);

    try {
        const response = await fetch('/api/upload-to-drive', {
            method: 'POST',
            body: formData
        });
        const driveData = await response.json();

        if (driveData.success) {
            await addDoc(collection(db, "notes"), {
                title: title,
                course: course,
                semester: sem,
                fileUrl: driveData.fileUrl,
                fileName: selectedFile.name,

                // ✅ Auth se real user data
                uploadedBy: currentUser.displayName || currentUser.email.split('@')[0],
                userEmail: currentUser.email,
                userId: currentUser.uid,   // ← Yeh sabse important hai

                createdAt: serverTimestamp()
            });

            alert("✅ Note Successfully Uploaded!");
            modal.style.display = "none";
            uploadForm.reset();
            selectedFile = null;
            infoBox.style.display = "none";
            document.getElementById("fileNameDisplay").innerText = "Click to choose PDF Note";
            location.reload();
        } else {
            alert("❌ Upload fail hua: " + driveData.error);
        }
    } catch (error) {
        console.error("Upload Error:", error);
        alert("❌ Upload fail hua, console check karo!");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "<span>Start Upload</span><i class='fas fa-arrow-right'></i>";
    }
});
