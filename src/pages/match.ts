// src/pages/dashboard.ts
import { router } from './routes.js';

export const DashboardPage = {
    name: 'dashboard' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML = `
            <nav>
                <a href="/dashboard">Dashboard</a>
                <a href="/listings">Listings</a>
                <a href="/profile">Profile</a>
                <button id="logout">Logout</button>
            </nav>
            <div class="dashboard-content">
                <h1>Welcome back!</h1>
                <p>Find your perfect roommate.</p>
            </div>
        `;

        document.getElementById('logout')?.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            router.navigate('login');
        });
    },
    cleanup: () => {
        document.getElementById('logout')?.removeEventListener('click', () => { });
    }
};