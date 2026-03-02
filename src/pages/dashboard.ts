import { getCurrentUser } from '../lib/db.js';
import { Header } from '../lib/header.js';

export const DashboardPage = {
    name: 'dashboard' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML = Header.getHTML({ pageName: 'dashboard', showProfileDropdown: true }) + `
            <div class="dashboard-content">
                <h1>Welcome back!</h1>
                <p>Find your perfect roommate.</p>
            </div>
        `;

        Header.setupListeners(DashboardPage, { pageName: 'dashboard', showProfileDropdown: true });

        // Fetch and display current user
        getCurrentUser().then(user => {
            if (user) {
                const welcomeMessage = document.querySelector('.dashboard-content h1');
                if (welcomeMessage) {
                    welcomeMessage.textContent = `Welcome back, ${user.name}!`;
                }
            }
        }).catch(error => {
            console.error('Error fetching current user:', error);
        });
    },
    cleanup: () => {
        Header.cleanup(DashboardPage);
    }
};