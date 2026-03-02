import { Header } from '../lib/header.js';

export const ProfilePage = {
    name: 'profile' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML = Header.getHTML({ pageName: 'profile', showProfileDropdown: false }) + `
            <div class="profile-content">
                <div class="profile-header">
                    <h1>My Profile</h1>
                    <p>View and edit your profile here.</p>
                </div>
                    <div class="profile-info">
                    <div class="profile-details">
                        <h2>Preferences</h2>
                        <p>Manage your preferences and settings.</p>
                    </div>
                    <div class="profile-preferences">
                        <h2>Preferences</h2>
                        <p>Manage your preferences and settings.</p>
                    </div>
                </div>
            </div>
        `;

        Header.setupListeners(ProfilePage, { pageName: 'profile', showProfileDropdown: false });
    },
    cleanup: () => {
        Header.cleanup(ProfilePage);
    }
};
