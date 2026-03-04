import { auth, db } from '/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    collection, doc, getDoc, getDocs,
    setDoc, deleteDoc, query, orderBy, where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;

const COLORS = [
    { bg: '#FFF7ED', color: '#F97316', border: '#FED7AA' },
    { bg: '#EFF6FF', color: '#3B82F6', border: '#BFDBFE' },
    { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
    { bg: '#FAF5FF', color: '#A855F7', border: '#E9D5FF' },
    { bg: '#FDF2F8', color: '#EC4899', border: '#FBCFE8' },
];

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '/views/login.html'; return; }
    currentUser = user;

    // Profile se naam lao
    let displayName = user.displayName || user.email.split('@')[0];
    try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        if (profileSnap.exists() && profileSnap.data().name) {
            displayName = profileSnap.data().name;
        }
    } catch(e) {}

    const avatar = document.getElementById('headerAvatar');
    if (avatar) avatar.textContent = displayName.slice(0, 2).toUpperCase();

    await loadSavedNotes();
});

// ---- LOAD SAVED NOTES ----
async function loadSavedNotes() {
    try {
        // User ke saved notes — subcollection: users/{uid}/savedNotes
        const savedSnap = await getDocs(
            collection(db, 'users', currentUser.uid, 'savedNotes')
        );

        window.savedNotes = [];
        savedSnap.forEach(d => {
            window.savedNotes.push({ id: d.id, ...d.data() });
        });

        // Sort by savedAt descending
        window.savedNotes.sort((a, b) => {
            const aTime = a.savedAt?.toDate?.() || new Date(0);
            const bTime = b.savedAt?.toDate?.() || new Date(0);
            return bTime - aTime;
        });

        updateStats(window.savedNotes);
        window.renderSaved(window.savedNotes);

    } catch(e) {
        console.error('Load saved notes error:', e);
        document.getElementById('savedContainer').innerHTML = `
            <div class="sn-empty">
                <div class="icon">⚠️</div>
                <h3>Load nahi hua</h3>
                <p>Page refresh karo</p>
            </div>`;
    }
}

// ---- UPDATE STATS ----
function updateStats(notes) {
    document.getElementById('totalSaved').textContent = notes.length;
    const courses = new Set(notes.map(n => n.course).filter(Boolean));
    document.getElementById('totalCourses').textContent = courses.size;
    const authors = new Set(notes.map(n => n.uploadedBy).filter(Boolean));
    document.getElementById('totalAuthors').textContent = authors.size;
}

// ---- RENDER ----
window.renderSaved = function(notes) {
    const container = document.getElementById('savedContainer');

    if (!notes || notes.length === 0) {
        container.innerHTML = `
            <div class="sn-empty">
                <div class="icon">💔</div>
                <h3>Koi saved note nahi</h3>
                <p>Home page pe notes ke upar ❤️ icon click karo!</p>
                <a href="/views/student_dashboard.html" class="sn-empty-btn">Browse Notes</a>
            </div>`;
        return;
    }

    container.innerHTML = notes.map((note, i) => {
        const c = COLORS[i % COLORS.length];
        const savedDate = note.savedAt
            ? note.savedAt.toDate().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
            : '';
        const authorInitials = (note.uploadedBy || 'U').slice(0, 2).toUpperCase();

        return `
        <div class="note-card" style="display:flex;flex-direction:column;">

            <button class="sn-heart-btn" onclick="openUnsaveModal('${note.id}')" title="Remove from saved">
                <i class="fas fa-heart"></i>
            </button>

            <div class="sn-note-badge" style="background:${c.bg};color:${c.color};border:1px solid ${c.border}">
                ${note.course || 'General'}
            </div>

            <div class="note-icon-box" style="background:${c.bg};color:${c.color};margin-bottom:12px">📄</div>

            <h3 class="sn-note-title">${note.title || 'Untitled Note'}</h3>

            <div class="sn-note-meta">
                <i class="fas fa-layer-group" style="font-size:11px"></i>
                ${note.type || 'Notes'}
                &nbsp;•&nbsp;
                <i class="fas fa-calendar" style="font-size:11px"></i>
                ${note.semester || 'N/A'} Sem
            </div>

            <div class="sn-author">
                <div class="sn-author-avatar">${authorInitials}</div>
                ${note.uploadedBy || 'Unknown'}
            </div>

            <div class="sn-card-actions">
                <a href="${note.fileUrl}" target="_blank" class="sn-btn sn-btn-view">
                    <i class="fas fa-eye"></i> View
                </a>
                <button class="sn-btn sn-btn-remove" onclick="openUnsaveModal('${note.id}')">
                    <i class="fas fa-heart-broken"></i> Remove
                </button>
            </div>
        </div>`;
    }).join('');
};

// ---- UNSAVE ----
window.unsaveNote = async function(noteId) {
    try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'savedNotes', noteId));
        window.savedNotes = window.savedNotes.filter(n => n.id !== noteId);
        updateStats(window.savedNotes);
        window.renderSaved(window.savedNotes);
    } catch(e) {
        console.error('Unsave error:', e);
    }
};

// ---- SAVE NOTE (called from dashboard) ----
// Usage: saveNote(noteData) — noteId = note's Firestore ID
window.saveNoteToFavorites = async function(noteId, noteData) {
    if (!currentUser) return;
    try {
        await setDoc(doc(db, 'users', currentUser.uid, 'savedNotes', noteId), {
            ...noteData,
            savedAt: new Date()
        });
        return true;
    } catch(e) {
        console.error('Save error:', e);
        return false;
    }
};
