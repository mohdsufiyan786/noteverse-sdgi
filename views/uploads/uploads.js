import { db } from '/firebase-config.js';
import { collection, getDocs, query, orderBy, where, deleteDoc, doc } from '/firebase-config.js';

// Current user ka naam (dashboard-logic se milega)
const CURRENT_USER = "Mohd Sufiyan"; // Baad mein auth se dynamic banao

async function loadMyUploads() {
    try {
        const q = query(
            collection(db, "notes"),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);

        window.myUploads = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Sirf is user ke notes
            if (data.uploadedBy === CURRENT_USER) {
                window.myUploads.push({ id: doc.id, ...data });
            }
        });

        updateStats(window.myUploads);
        renderUploads(window.myUploads);

    } catch (error) {
        console.error("Uploads load error:", error);
        document.getElementById('uploadsContainer').innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px;color:#8b91a7">
                <div style="font-size:48px;margin-bottom:16px">⚠️</div>
                <h3 style="color:#c0c4d6">Could not load uploads</h3>
                <p>Please refresh the page</p>
            </div>`;
    }
}

function updateStats(notes) {
    document.getElementById('totalUploads').textContent = notes.length;

    const courses = new Set(notes.map(n => n.course).filter(Boolean));
    document.getElementById('totalCourses').textContent = courses.size;

    if (notes.length > 0 && notes[0].createdAt) {
        const date = notes[0].createdAt.toDate();
        document.getElementById('latestUpload').textContent =
            date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
}

window.renderUploads = function(notes) {
    const container = document.getElementById('uploadsContainer');

    if (!notes || notes.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px;color:#8b91a7">
                <div style="font-size:48px;margin-bottom:16px">📭</div>
                <h3 style="font-size:18px;margin-bottom:8px;color:#c0c4d6">Koi upload nahi mila</h3>
                <p>Home pe jao aur pehla note upload karo!</p>
                <a href="/views/student_dashboard.html" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#f5a623;color:#0d0f14;border-radius:10px;font-weight:700;text-decoration:none;">
                    + Upload Note
                </a>
            </div>`;
        return;
    }

    const colors = [
        { bg: 'rgba(245,166,35,0.12)', color: '#f5a623' },
        { bg: 'rgba(255,107,107,0.12)', color: '#ff6b6b' },
        { bg: 'rgba(78,205,196,0.12)', color: '#4ecdc4' },
        { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
        { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
    ];

    container.innerHTML = notes.map((note, i) => {
        const c = colors[i % colors.length];
        const date = note.createdAt ?
            note.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Unknown date';

        return `
        <div class="note-card" style="gap:14px;">
            <!-- Badge + Date -->
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <div style="
                    display:inline-flex;align-items:center;
                    padding:4px 12px;
                    background:${c.bg};
                    border:1px solid ${c.color}40;
                    color:${c.color};
                    border-radius:50px;
                    font-size:11px;font-weight:700;
                    letter-spacing:0.5px;text-transform:uppercase;
                ">${note.course || 'General'}</div>
                <span style="font-size:11px;color:#4a5068;">${date}</span>
            </div>

            <!-- Icon -->
            <div style="
                width:48px;height:48px;
                background:${c.bg};
                border-radius:12px;
                display:flex;align-items:center;justify-content:center;
                font-size:22px;color:${c.color};
            ">📄</div>

            <!-- Title -->
            <h3 style="
                font-family:'Syne',sans-serif;
                font-size:16px;font-weight:700;
                color:#f0f2f8;line-height:1.4;
            ">${note.title || 'Untitled Note'}</h3>

            <!-- Semester -->
            <p style="font-size:13px;color:#8b91a7;">
                Semester: <span style="background:#13161e;padding:2px 8px;border-radius:4px;font-size:11px;color:${c.color};font-weight:600;">${note.semester || 'N/A'}</span>
            </p>

            <!-- Filename -->
            <div style="font-size:11px;color:#4a5068;display:flex;align-items:center;gap:6px;background:#13161e;padding:6px 10px;border-radius:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                📎 ${note.fileName || (note.title || 'Note') + '.pdf'}
            </div>

            <!-- Buttons -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto;">
                <a href="${note.fileUrl}" target="_blank" style="text-decoration:none;">
                    <button style="width:100%;padding:10px;border-radius:10px;background:#1f2333;border:1.5px solid #2d3147;color:#8b91a7;font-weight:600;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"
                    onmouseover="this.style.borderColor='#4ecdc4';this.style.color='#4ecdc4'"
                    onmouseout="this.style.borderColor='#2d3147';this.style.color='#8b91a7'">
                        👁 View
                    </button>
                </a>
                <button onclick="openDeleteModal('${note.id}')"
                    style="width:100%;padding:10px;border-radius:10px;background:rgba(255,107,107,0.1);border:1.5px solid rgba(255,107,107,0.3);color:#ff6b6b;font-weight:600;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"
                    onmouseover="this.style.background='rgba(255,107,107,0.2)'"
                    onmouseout="this.style.background='rgba(255,107,107,0.1)'">
                    🗑 Delete
                </button>
            </div>
        </div>`;
    }).join('');
};

// Delete function
window.deleteNote = async function(noteId) {
    await deleteDoc(doc(db, "notes", noteId));
    window.myUploads = window.myUploads.filter(n => n.id !== noteId);
    updateStats(window.myUploads);
    renderUploads(window.myUploads);
};

document.addEventListener('DOMContentLoaded', loadMyUploads);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadMyUploads();
});
