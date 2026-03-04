import { db } from './firebase-config.js'; 
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function displayAllNotes() {
    try {
        const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        window.allNotes = [];
        querySnapshot.forEach((doc) => {
            window.allNotes.push({ id: doc.id, ...doc.data() });
        });

        if (typeof window.renderNotes === 'function') {
            window.renderNotes(window.allNotes);
        }

    } catch (error) {
        console.error("Notes load error:", error);
        const container = document.getElementById('notesContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Could not load notes</h3>
                    <p>Please refresh the page</p>
                </div>`;
        }
    }
}

// Pehli baar load
document.addEventListener('DOMContentLoaded', displayAllNotes);

// Tab switch karke wapas aao
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) displayAllNotes();
});

// Browser back button
window.addEventListener('pageshow', () => {
    displayAllNotes();
});
