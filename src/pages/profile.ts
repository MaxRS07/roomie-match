import { Header } from '../lib/header.js';
import { getCurrentUser, getProfilePhoto, getUserPreferences, updateUserPreferences, updateUserProfile, updateProfilePhoto } from '../lib/db.js';
import { arrayToUserPreferences } from '../types/entities.js';
import type { User, UserPreferences } from '../types/entities.js';

let isEditing = false;

//rrDO36u0wDAJm9pf

function showToast(message: string, type: 'success' | 'error' = 'success') {
    const existing = document.querySelector('.profile-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `profile-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

const PREF_OPTIONS: Record<string, { label: string; icon: string; options: string[] }> = {
    cleanliness_level: { label: 'Cleanliness', icon: '🧹', options: ['Low', 'Medium', 'High'] },
    sleep_schedule: { label: 'Sleep Schedule', icon: '🌙', options: ['Early Bird', 'Night Owl', 'Flexible'] },
    pet_friendly: { label: 'Pet Friendly', icon: '🐾', options: ['Yes', 'No'] },
    smoking_allowed: { label: 'Smoking', icon: '🚬', options: ['Yes', 'No'] },
    noise_tolerance: { label: 'Noise Tolerance', icon: '🔊', options: ['Low', 'Medium', 'High'] },
    guests_allowed: { label: 'Guests Allowed', icon: '👥', options: ['Rarely', 'Sometimes', 'Often'] },
    work_schedule: { label: 'Work Schedule', icon: '💼', options: ['Remote', 'Hybrid', 'In-Office', 'Other'] },
};

function renderProfileView(user: User, photo: string | null, prefs: UserPreferences | null) {
    const avatarHTML = photo
        ? `<img class="profile-avatar" src="${photo}" alt="${user.name}" />`
        : `<div class="profile-avatar-placeholder">${user.name.charAt(0).toUpperCase()}</div>`;

    const prefKeys = Object.keys(PREF_OPTIONS) as (keyof typeof PREF_OPTIONS)[];

    return `
        <!-- Profile Card -->
        <div class="profile-card">
            <div class="profile-avatar-wrap">
                ${avatarHTML}
                <label class="profile-avatar-edit" title="Change photo">
                    📷
                    <input type="file" id="photo-upload" accept="image/*" />
                </label>
            </div>
            <h1 class="profile-name">${user.name}</h1>
            <p class="profile-meta">${user.age ? user.age + ' · ' : ''}${user.gender || ''}${user.occupation ? ' · ' + user.occupation : ''}</p>
            ${user.bio ? `<p class="profile-bio">${user.bio}</p>` : ''}
            <p class="profile-email">${user.email}</p>
        </div>

        <!-- Personal Info -->
        <div class="profile-section">
            <div class="profile-section-header">
                <h2 class="profile-section-title">👤 Personal Info</h2>
                <button class="profile-edit-btn" id="edit-info-btn">Edit</button>
            </div>
            <div class="profile-info-grid" id="info-display">
                <div class="profile-info-item">
                    <span class="profile-info-label">Name</span>
                    <span class="profile-info-value">${user.name || '—'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Email</span>
                    <span class="profile-info-value">${user.email || '—'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Age</span>
                    <span class="profile-info-value">${user.age || '—'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Gender</span>
                    <span class="profile-info-value">${user.gender || '—'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Occupation</span>
                    <span class="profile-info-value">${user.occupation || '—'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Member Since</span>
                    <span class="profile-info-value">${user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
                </div>
            </div>
            <div id="info-edit" style="display:none;">
                <div class="profile-form-grid">
                    <div class="profile-form-group">
                        <label class="profile-form-label">Name</label>
                        <input class="profile-form-input" id="edit-name" value="${user.name || ''}" />
                    </div>
                    <div class="profile-form-group">
                        <label class="profile-form-label">Email</label>
                        <input class="profile-form-input" id="edit-email" type="email" value="${user.email || ''}" />
                    </div>
                    <div class="profile-form-group">
                        <label class="profile-form-label">Age</label>
                        <input class="profile-form-input" id="edit-age" type="number" value="${user.age || ''}" />
                    </div>
                    <div class="profile-form-group">
                        <label class="profile-form-label">Gender</label>
                        <select class="profile-form-select" id="edit-gender">
                            <option value="">Select</option>
                            ${['Male', 'Female', 'Non-binary', 'Other'].map(g =>
        `<option value="${g}" ${user.gender === g ? 'selected' : ''}>${g}</option>`
    ).join('')}
                        </select>
                    </div>
                    <div class="profile-form-group">
                        <label class="profile-form-label">Occupation</label>
                        <input class="profile-form-input" id="edit-occupation" value="${user.occupation || ''}" />
                    </div>
                    <div class="profile-form-group full-width">
                        <label class="profile-form-label">Bio</label>
                        <textarea class="profile-form-textarea" id="edit-bio">${user.bio || ''}</textarea>
                    </div>
                </div>
                <div class="profile-btn-row">
                    <button class="profile-edit-btn cancel" id="cancel-info-btn">Cancel</button>
                    <button class="profile-edit-btn save" id="save-info-btn">Save Changes</button>
                </div>
            </div>
        </div>

        <!-- Preferences -->
        <div class="profile-section">
            <div class="profile-section-header">
                <h2 class="profile-section-title">⚙️ Living Preferences</h2>
                <button class="profile-edit-btn" id="edit-prefs-btn">Edit</button>
            </div>
            <div class="profile-prefs-grid" id="prefs-display">
                ${prefKeys.map(key => {
        const cfg = PREF_OPTIONS[key]!;
        const val = prefs ? (prefs as any)[key] : '';
        return `
                        <div class="profile-pref-item">
                            <span class="profile-pref-label">${cfg.icon} ${cfg.label}</span>
                            <span class="profile-pref-value">${val || '—'}</span>
                        </div>
                    `;
    }).join('')}
            </div>
            <div id="prefs-edit" style="display:none;">
                <div class="profile-form-grid">
                    ${prefKeys.map(key => {
        const cfg = PREF_OPTIONS[key]!;
        const val = prefs ? (prefs as any)[key] : '';
        return `
                            <div class="profile-form-group">
                                <label class="profile-form-label">${cfg.icon} ${cfg.label}</label>
                                <select class="profile-form-select" id="edit-pref-${key}">
                                    <option value="">Select</option>
                                    ${cfg.options.map(opt =>
            `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`
        ).join('')}
                                </select>
                            </div>
                        `;
    }).join('')}
                </div>
                <div class="profile-btn-row">
                    <button class="profile-edit-btn cancel" id="cancel-prefs-btn">Cancel</button>
                    <button class="profile-edit-btn save" id="save-prefs-btn">Save Preferences</button>
                </div>
            </div>
        </div>
    `;
}

async function loadProfile() {
    const content = document.querySelector('.profile-content') as HTMLElement;
    if (!content) return;

    const user = await getCurrentUser();
    if (!user) {
        content.innerHTML = `<div class="profile-loading"><p>Please log in to view your profile.</p></div>`;
        return;
    }

    const [photo, prefsResult] = await Promise.all([
        getProfilePhoto(user.user_id).catch(() => null),
        getUserPreferences(user.user_id),
    ]);

    let prefs: UserPreferences | null = null;
    if (prefsResult.success && prefsResult.data && prefsResult.data.length > 0) {
        prefs = arrayToUserPreferences(prefsResult.data[0]);
    }

    content.innerHTML = renderProfileView(user, photo, prefs);
    attachProfileListeners(user, prefs);
}

function attachProfileListeners(user: User, prefs: UserPreferences | null) {
    // Photo upload
    const photoInput = document.getElementById('photo-upload') as HTMLInputElement;
    photoInput?.addEventListener('change', async () => {
        const file = photoInput.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result as string;
            try {
                await updateProfilePhoto(user.user_id, dataUrl);
                // Update avatar immediately
                const wrap = document.querySelector('.profile-avatar-wrap');
                if (wrap) {
                    const existing = wrap.querySelector('.profile-avatar, .profile-avatar-placeholder');
                    if (existing) {
                        const img = document.createElement('img');
                        img.className = 'profile-avatar';
                        img.src = dataUrl;
                        img.alt = user.name;
                        existing.replaceWith(img);
                    }
                }
                showToast('Photo updated!');
            } catch {
                showToast('Failed to update photo', 'error');
            }
        };
        reader.readAsDataURL(file);
    });

    // Edit info toggle
    const editInfoBtn = document.getElementById('edit-info-btn');
    const infoDisplay = document.getElementById('info-display');
    const infoEdit = document.getElementById('info-edit');
    const cancelInfoBtn = document.getElementById('cancel-info-btn');
    const saveInfoBtn = document.getElementById('save-info-btn');

    editInfoBtn?.addEventListener('click', () => {
        if (infoDisplay) infoDisplay.style.display = 'none';
        if (infoEdit) infoEdit.style.display = 'block';
        if (editInfoBtn) editInfoBtn.style.display = 'none';
    });

    cancelInfoBtn?.addEventListener('click', () => {
        if (infoDisplay) infoDisplay.style.display = '';
        if (infoEdit) infoEdit.style.display = 'none';
        if (editInfoBtn) editInfoBtn.style.display = '';
    });

    saveInfoBtn?.addEventListener('click', async () => {
        const data = {
            name: (document.getElementById('edit-name') as HTMLInputElement)?.value || '',
            email: (document.getElementById('edit-email') as HTMLInputElement)?.value || '',
            age: (document.getElementById('edit-age') as HTMLInputElement)?.value || '',
            gender: (document.getElementById('edit-gender') as HTMLSelectElement)?.value || '',
            occupation: (document.getElementById('edit-occupation') as HTMLInputElement)?.value || '',
            bio: (document.getElementById('edit-bio') as HTMLTextAreaElement)?.value || '',
        };

        try {
            await updateUserProfile(user.user_id, data);
            showToast('Profile updated!');
            // Reload the page to reflect changes
            await loadProfile();
        } catch {
            showToast('Failed to update profile', 'error');
        }
    });

    // Edit prefs toggle
    const editPrefsBtn = document.getElementById('edit-prefs-btn');
    const prefsDisplay = document.getElementById('prefs-display');
    const prefsEdit = document.getElementById('prefs-edit');
    const cancelPrefsBtn = document.getElementById('cancel-prefs-btn');
    const savePrefsBtn = document.getElementById('save-prefs-btn');

    editPrefsBtn?.addEventListener('click', () => {
        if (prefsDisplay) prefsDisplay.style.display = 'none';
        if (prefsEdit) prefsEdit.style.display = 'block';
        if (editPrefsBtn) editPrefsBtn.style.display = 'none';
    });

    cancelPrefsBtn?.addEventListener('click', () => {
        if (prefsDisplay) prefsDisplay.style.display = '';
        if (prefsEdit) prefsEdit.style.display = 'none';
        if (editPrefsBtn) editPrefsBtn.style.display = '';
    });

    savePrefsBtn?.addEventListener('click', async () => {
        const prefData: Record<string, string> = {};
        for (const key of Object.keys(PREF_OPTIONS)) {
            prefData[key] = (document.getElementById(`edit-pref-${key}`) as HTMLSelectElement)?.value || '';
        }

        try {
            await updateUserPreferences(user.user_id, prefData);
            showToast('Preferences updated!');
            await loadProfile();
        } catch {
            showToast('Failed to update preferences', 'error');
        }
    });
}

export const ProfilePage = {
    name: 'profile' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML = Header.getHTML({ pageName: 'profile', showProfileDropdown: false }) + `
            <div class="profile-content">
                <div class="profile-loading">
                    <div class="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        `;

        Header.setupListeners(ProfilePage, { pageName: 'profile', showProfileDropdown: false });
        loadProfile();
    },
    cleanup: () => {
        Header.cleanup(ProfilePage);
        const toast = document.querySelector('.profile-toast');
        if (toast) toast.remove();
    }
};
