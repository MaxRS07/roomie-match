// src/pages/dashboard.ts
import { router } from './routes.js';
import { getCurrentUser, getProfilePhoto } from '../lib/db.js';
import { Cache } from '../lib/cache.js';

export const DashboardPage = {
    name: 'dashboard' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML = `
            <header class="dashboard-header">
                <div>
                    <a href="#" class="brand-link">Roomie Match</a>
                </div>
                <nav>
                    <a href="#" class="nav-link" data-page="dashboard">Dashboard</a>
                    <a href="#" class="nav-link" data-page="matches">Listings</a>
                    <button id="open-dropdown">
                        <img id="profile-img"></img>
                    </button>
                </nav>
            </header>
            <div class="dashboard-content">
                <h1>Welcome back!</h1>
                <p>Find your perfect roommate.</p>
            </div>
        `;

        // Handle navigation link clicks
        const navLinks = document.querySelectorAll('.nav-link');
        const navClickHandler = (e: Event) => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            const page = target.getAttribute('data-page');
            if (page) router.navigate(page as any);
        };
        navLinks.forEach(link => link.addEventListener('click', navClickHandler));

        // Handle brand link click
        const brandLink = document.querySelector('.brand-link');
        const brandClickHandler = (e: Event) => {
            e.preventDefault();
            router.navigate('matches');
        };
        brandLink?.addEventListener('click', brandClickHandler);

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

        const logoutHandler = () => {
            Cache.getInstance().delete('authToken');
            localStorage.removeItem('authToken');
            router.navigate('login');
        };
        document.getElementById('logout')?.addEventListener('click', logoutHandler);
        (DashboardPage as any).logoutHandler = logoutHandler;
        (DashboardPage as any).navClickHandler = navClickHandler;
        (DashboardPage as any).brandClickHandler = brandClickHandler;

        document.addEventListener('load', async () => {
            const user = await getCurrentUser();
            if (!user) return;
            const prof = await getProfilePhoto(user.user_id);
            const profileImg = document.getElementById('profile-img') as HTMLImageElement;
            if (profileImg) {
                profileImg.src = prof || 'https://via.placeholder.com/32?text=User';
            }
        });
    },
    cleanup: () => {
        const logoutHandler = (DashboardPage as any).logoutHandler;
        const navClickHandler = (DashboardPage as any).navClickHandler;
        const brandClickHandler = (DashboardPage as any).brandClickHandler;

        document.getElementById('logout')?.removeEventListener('click', logoutHandler);
        document.querySelectorAll('.nav-link').forEach(link => {
            link.removeEventListener('click', navClickHandler);
        });
        document.querySelector('.brand-link')?.removeEventListener('click', brandClickHandler);
    }
};