import { auth, db } from '/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

    // ✅ Profile se naam lao
    let displayName = user.displayName || user.email.split('@')[0];
    try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        if (profileSnap.exists() && profileSnap.data().name) {
            displayName = profileSnap.data().name;
        }
    } catch(e) {}

    const avatar = document.getElementById('headerAvatar');
    if (avatar) avatar.textContent = displayName.slice(0, 2).toUpperCase();

    await loadMyUploads();
});

async function loadMyUploads() {
    try {
        // ✅ Sirf current user ke notes - userId se
        const q = query(
            collection(db, "notes"),
            where("userId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        window.myUploads = [];
        snap.forEach(d => window.myUploads.push({ id: d.id, ...d.data() }));
        updateStats(window.myUploads);
        window.renderUploads(window.myUploads);

    } catch (err) {
        // Fallback for old notes without userId
        console.warn('userId query failed, trying email fallback:', err);
        try {
            const q2 = query(collection(db, "notes"), orderBy("createdAt", "desc"));
            const snap2 = await getDocs(q2);
            window.myUploads = [];
            snap2.forEach(d => {
                const data = d.data();
                if (data.userId === currentUser.uid || data.userEmail === currentUser.email) {
                    window.myUploads.push({ id: d.id, ...data });
                }
            });
            updateStats(window.myUploads);
            window.renderUploads(window.myUploads);
        } catch(e) {
            document.getElementById('uploadsContainer').innerHTML = `
                <div class="mu-empty"><div class="icon">⚠️</div><h3>Load nahi hua</h3><p>Page refresh karo</p></div>`;
        }
    }
}

function updateStats(notes) {
    document.getElementById('totalUploads').textContent = notes.length;
    const courses = new Set(notes.map(n => n.course).filter(Boolean));
    document.getElementById('totalCourses').textContent = courses.size;
    if (notes.length > 0 && notes[0].createdAt) {
        const d = notes[0].createdAt.toDate();
        document.getElementById('latestUpload').textContent =
            d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
    } else {
        document.getElementById('latestUpload').textContent = '—';
    }
}

window.renderUploads = function(notes) {
    const container = document.getElementById('uploadsContainer');
    if (!notes || notes.length === 0) {
        container.innerHTML = `
            <div class="mu-empty">
                <div class="icon">📭</div>
                <h3>Koi upload nahi mila</h3>
                <p>Home pe jao aur pehla note upload karo!</p>
                <a href="/views/student_dashboard.html" class="mu-empty-btn">+ Upload Note</a>
            </div>`;
        return;
    }

    container.innerHTML = notes.map((note, i) => {
        const c = COLORS[i % COLORS.length];
        const date = note.createdAt
            ? note.createdAt.toDate().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
            : '';
        return `
        <div class="note-card" style="display:flex;flex-direction:column;">
            <span class="note-card-date">${date}</span>
            <div class="note-card-badge" style="background:${c.bg};color:${c.color};border:1px solid ${c.border}">${note.course || 'General'}</div>
            <div class="note-icon-box" style="background:${c.bg};color:${c.color};margin-bottom:12px">📄</div>
            <h3 class="note-card-title">${note.title || 'Untitled Note'}</h3>
            <div class="note-card-meta">
                <i class="fas fa-layer-group" style="font-size:11px"></i> ${note.type || 'Notes'}
                &nbsp;•&nbsp;
                <i class="fas fa-calendar" style="font-size:11px"></i> ${note.semester || 'N/A'} Sem
            </div>
            <div class="note-card-file">📎 ${note.fileName || (note.title || 'Note') + '.pdf'}</div>
            <div class="card-actions">
                <a href="${note.fileUrl}" target="_blank" class="card-btn btn-view-card">
                    <i class="fas fa-eye"></i> View
                </a>
                <button class="card-btn btn-edit-card" onclick="openEditModal('${note.id}')">
                    <i class="fas fa-pen"></i> Edit
                </button>
                <button class="card-btn btn-delete-card" onclick="openDeleteModal('${note.id}')">
                    <i class="fas fa-trash"></i> Del
                </button>
            </div>
        </div>`;
    }).join('');
};

window.deleteNote = async function(noteId) {
    await deleteDoc(doc(db, "notes", noteId));
    window.myUploads = window.myUploads.filter(n => n.id !== noteId);
    updateStats(window.myUploads);
    window.renderUploads(window.myUploads);
};

window.updateNote = async function(noteId, data) {
    await updateDoc(doc(db, "notes", noteId), { ...data, updatedAt: new Date() });
    window.myUploads = window.myUploads.map(n => n.id === noteId ? { ...n, ...data } : n);
    updateStats(window.myUploads);
    window.renderUploads(window.myUploads);
};

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentUser) loadMyUploads();
});
