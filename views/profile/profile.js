import { auth, db } from '/firebase-config.js';
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;

// ---- LOAD PROFILE ----
onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '/views/login.html'; return; }
    currentUser = user;

    try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() : {};

        // Fill inputs
        setValue('inp-name', data.name || '');
        setValue('inp-rollNo', data.rollNo || '');
        setValue('inp-college', data.college || 'SDGI University');
        setValue('inp-bio', data.bio || '');
        setValue('inp-linkedin', data.linkedin || '');
        setValue('inp-github', data.github || '');
        setValue('inp-twitter', data.twitter || '');
        setSelect('inp-course', data.course || '');
        setSelect('inp-semester', data.semester || '');

        // Update hero
        const displayName = data.name || user.email.split('@')[0];
        document.getElementById('heroName').textContent = displayName;
        document.getElementById('heroEmail').textContent = user.email;
        updateHeroTags(data.course, data.semester, data.college);
        updateAvatarDisplay(data.avatarUrl, displayName);

    } catch (e) {
        console.error('Profile load error:', e);
    }
});

// ---- SAVE PROFILE ----
window.saveProfile = async function() {
    if (!currentUser) return;
    const btn = document.getElementById('saveProfileBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const data = {
        name: getValue('inp-name'),
        rollNo: getValue('inp-rollNo'),
        course: getValue('inp-course'),
        semester: getValue('inp-semester'),
        college: getValue('inp-college'),
        bio: getValue('inp-bio'),
        linkedin: getValue('inp-linkedin'),
        github: getValue('inp-github'),
        twitter: getValue('inp-twitter'),
        email: currentUser.email,
        updatedAt: new Date()
    };

    try {
        await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
        showToast('profileToast', 'Profile save successful!', 'success');
        document.getElementById('heroName').textContent = data.name || currentUser.email.split('@')[0];
        updateHeroTags(data.course, data.semester, data.college);
    } catch (e) {
        showToast('profileToast', 'Save failed: ' + e.message, 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save Profile';
};

// ---- CHANGE PASSWORD ----
window.changePassword = async function() {
    const current = getValue('inp-currentPass');
    const newPass = getValue('inp-newPass');
    const confirm = getValue('inp-confirmPass');

    if (!current || !newPass || !confirm) {
        showToast('passToast', 'field should not be blank', 'error'); return;
    }
    if (newPass !== confirm) {
        showToast('passToast', 'password should be same as above!', 'error'); return;
    }
    if (newPass.length < 6) {
        showToast('passToast', 'Password Should be 6 characters!', 'error'); return;
    }

    const btn = document.getElementById('changePassBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';

    try {
        const credential = EmailAuthProvider.credential(currentUser.email, current);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPass);
        showToast('passToast', 'Password change successful!', 'success');
        document.getElementById('inp-currentPass').value = '';
        document.getElementById('inp-newPass').value = '';
        document.getElementById('inp-confirmPass').value = '';
    } catch (e) {
        const msg = e.code === 'auth/wrong-password' ? 'Wrong password!' : e.message;
        showToast('passToast', msg, 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-key"></i> Change Password';
};

// ---- AVATAR UPLOAD ----
document.getElementById('avatarFile').addEventListener('change', async function() {
    const file = this.files[0];
    if (!file || !currentUser) return;

    const icon = document.getElementById('camIcon');
    icon.className = 'fas fa-spinner fa-spin';

    try {
        const formData = new FormData();
        formData.append('noteFile', file);
        const res = await fetch('/api/upload-to-drive', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            await setDoc(doc(db, 'users', currentUser.uid), { avatarUrl: data.fileUrl }, { merge: true });
            updateAvatarDisplay(data.fileUrl, null);
            showToast('profileToast', 'Photo upload successful!', 'success');
        } else {
            showToast('profileToast', 'Photo upload fail!', 'error');
        }
    } catch (e) {
        showToast('profileToast', 'Photo upload fail!', 'error');
    }
    icon.className = 'fas fa-camera';
});

// ---- HELPERS ----
function getValue(id) { return document.getElementById(id)?.value?.trim() || ''; }
function setValue(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function setSelect(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    for (let opt of el.options) { if (opt.value === val) { opt.selected = true; break; } }
}

function updateAvatarDisplay(avatarUrl, name) {
    const initials = (name || 'U').slice(0, 2).toUpperCase();
    const heroEl = document.getElementById('heroAvatar');
    const headerEl = document.getElementById('headerAvatar');

    if (avatarUrl) {
        heroEl.innerHTML = `<img src="${avatarUrl}" alt="avatar">`;
        headerEl.innerHTML = `<img src="${avatarUrl}" alt="avatar">`;
    } else {
        heroEl.textContent = initials;
        headerEl.textContent = initials;
    }
}

function updateHeroTags(course, semester, college) {
    const el = document.getElementById('heroTags');
    el.innerHTML = '';
    if (course) el.innerHTML += `<span class="h-tag" style="background:#FFF7ED;color:#F97316;">${course}</span>`;
    if (semester) el.innerHTML += `<span class="h-tag" style="background:#EFF6FF;color:#3B82F6;">${semester} Sem</span>`;
    if (college) el.innerHTML += `<span class="h-tag" style="background:#F0FDF4;color:#16A34A;">${college}</span>`;
}
