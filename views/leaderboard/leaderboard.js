import { auth, db } from '/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;
let uploadsData = [];
let viewsData = [];

const AVATAR_COLORS = [
    { bg: '#FFF7ED', color: '#F97316' },
    { bg: '#EFF6FF', color: '#3B82F6' },
    { bg: '#F0FDF4', color: '#16A34A' },
    { bg: '#FAF5FF', color: '#A855F7' },
    { bg: '#FDF2F8', color: '#EC4899' },
    { bg: '#FFFBEB', color: '#D97706' },
];

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '/views/login.html'; return; }
    currentUser = user;

    let displayName = user.displayName || user.email.split('@')[0];
    try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().name) displayName = snap.data().name;
    } catch(e) {}

    const avatar = document.getElementById('headerAvatar');
    if (avatar) avatar.textContent = displayName.slice(0, 2).toUpperCase();

    await loadLeaderboard();
});

async function loadLeaderboard() {
    try {
        const notesSnap = await getDocs(collection(db, 'notes'));
        const notes = [];
        notesSnap.forEach(d => notes.push({ id: d.id, ...d.data() }));

        const uploadsMap = {};
        notes.forEach(note => {
            const uid = note.userId || note.userEmail || note.uploadedBy || 'unknown';
            if (!uploadsMap[uid]) {
                uploadsMap[uid] = {
                    uid: note.userId || null,
                    email: note.userEmail || '',
                    name: note.uploadedBy || 'Unknown',
                    course: note.course || '',
                    semester: '',
                    count: 0,
                    viewCount: 0,
                    avatarUrl: null,
                };
            }
            uploadsMap[uid].count += 1;
            uploadsMap[uid].viewCount += (note.viewCount || 0);
        });

        uploadsData = Object.values(uploadsMap).sort((a, b) => b.count - a.count);
        viewsData = [...uploadsData].sort((a, b) => b.viewCount - a.viewCount);

        // Fetch profiles for ALL users
        await enrichWithProfiles(uploadsData);

        // Update count
        const countEl = document.getElementById('totalCount');
        if (countEl) countEl.textContent = `${uploadsData.length} contributors`;

        window.renderLeaderboard('uploads');

    } catch(e) {
        console.error('Leaderboard error:', e);
        document.getElementById('lbList').innerHTML = `
            <div class="lb-empty">
                <div class="icon">⚠️</div>
                <p>Load nahi hua — page refresh karo</p>
            </div>`;
    }
}

async function enrichWithProfiles(users) {
    const promises = users.map(async (u) => {
        if (u.uid) {
            try {
                const snap = await getDoc(doc(db, 'users', u.uid));
                if (snap.exists()) {
                    const d = snap.data();
                    if (d.name) u.name = d.name;
                    if (d.avatarUrl) u.avatarUrl = d.avatarUrl;
                    if (d.course) u.course = d.course;
                    if (d.semester) u.semester = d.semester;
                }
            } catch(e) {}
        }
    });
    await Promise.all(promises);
}

window.renderLeaderboard = function(tab) {
    const data = tab === 'uploads' ? uploadsData : viewsData;
    const scoreKey = tab === 'uploads' ? 'count' : 'viewCount';
    const scoreLabel = tab === 'uploads' ? 'uploads' : 'views';

    renderTop3(data.slice(0, 3), scoreKey, scoreLabel);
    renderMyRank(data, scoreKey, scoreLabel);
    renderList(data, scoreKey, scoreLabel);
};

function avatarHtml(user, colorIndex) {
    const c = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
    const initials = (user.name || 'U').slice(0, 2).toUpperCase();
    if (user.avatarUrl) {
        return `<img src="${user.avatarUrl}" alt="${user.name}">`;
    }
    return `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:${c.bg};color:${c.color};font-family:'Outfit',sans-serif;font-weight:800;border-radius:50%;">${initials}</span>`;
}

function renderTop3(top3, scoreKey, scoreLabel) {
    const grid = document.getElementById('top3Grid');
    if (!top3 || top3.length === 0) {
        grid.innerHTML = `<div class="lb-empty" style="grid-column:1/-1"><div class="icon">📭</div><p>Abhi koi uploads nahi</p></div>`;
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const scoreIcons = { uploads: 'fas fa-upload', views: 'fas fa-eye' };

    grid.innerHTML = top3.map((user, i) => {
        const rank = i + 1;
        return `
        <div class="lb-rank-card rank-${rank}">
            <div class="lb-rank-badge">${medals[i]}</div>
            <div class="lb-card-avatar">
                ${avatarHtml(user, i)}
            </div>
            <div class="lb-card-name">${user.name || 'Unknown'}</div>
            <div class="lb-card-course">
                ${user.course || 'Student'}${user.semester ? ' • ' + user.semester + ' Sem' : ''}
            </div>
            <div class="lb-card-score">
                <i class="${scoreIcons[scoreKey === 'count' ? 'uploads' : 'views']}" style="font-size:12px;opacity:0.7"></i>
                ${user[scoreKey]} ${scoreLabel}
            </div>
        </div>`;
    }).join('');
}

function renderMyRank(data, scoreKey, scoreLabel) {
    if (!currentUser) return;
    const myIdx = data.findIndex(u =>
        u.uid === currentUser.uid || u.email === currentUser.email
    );

    const card = document.getElementById('myRankCard');
    if (myIdx === -1) { card.style.display = 'none'; return; }

    const me = data[myIdx];
    card.style.display = 'flex';
    document.getElementById('myRankNum').textContent = `#${myIdx + 1}`;
    document.getElementById('myRankName').textContent = me.name || 'You';
    document.getElementById('myRankScore').textContent = `${me[scoreKey]} ${scoreLabel}`;

    const avatarEl = document.getElementById('myRankAvatar');
    if (me.avatarUrl) {
        avatarEl.innerHTML = `<img src="${me.avatarUrl}" alt="avatar">`;
    } else {
        avatarEl.textContent = (me.name || 'U').slice(0, 2).toUpperCase();
    }
}

function renderList(data, scoreKey, scoreLabel) {
    const container = document.getElementById('lbList');
    if (!data || data.length === 0) {
        container.innerHTML = `<div class="lb-empty"><div class="icon">📭</div><p>Koi data nahi</p></div>`;
        return;
    }

    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const rankClass = { 1: 'top1', 2: 'top2', 3: 'top3' };

    container.innerHTML = data.map((user, i) => {
        const rank = i + 1;
        const isMe = user.uid === currentUser?.uid || user.email === currentUser?.email;
        const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
        const initials = (user.name || 'U').slice(0, 2).toUpperCase();

        return `
        <div class="lb-row ${isMe ? 'is-me' : ''}">
            <div class="lb-rank ${rankClass[rank] || ''}">
                ${rank <= 3 ? medals[rank] : '#' + rank}
            </div>
            <div class="lb-avatar" style="${!user.avatarUrl ? `background:${c.bg};color:${c.color}` : ''}">
                ${user.avatarUrl ? `<img src="${user.avatarUrl}" alt="avatar">` : initials}
            </div>
            <div class="lb-info">
                <div class="lb-uname">
                    ${user.name || 'Unknown'}
                    ${isMe ? '<span class="you-tag">You</span>' : ''}
                </div>
                <div class="lb-ucourse">
                    ${user.course || 'Student'}${user.semester ? ' &bull; ' + user.semester + ' Sem' : ''}
                </div>
            </div>
            <div class="lb-score">
                ${user[scoreKey]}
                <span>${scoreLabel}</span>
            </div>
        </div>`;
    }).join('');
}
