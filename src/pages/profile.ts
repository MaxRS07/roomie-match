import { router } from './routes.js';

export const ProfilePage = {
    name: 'profile' as const,
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
                    <button id="logout">Logout</button>
                </nav>
            </header>
            <div class="profile-content">
                <h1>My Profile</h1>
                <p>View and edit your profile here.</p>
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

        const logoutHandler = () => {
            localStorage.removeItem('authToken');
            router.navigate('login');
        };
        document.getElementById('logout')?.addEventListener('click', logoutHandler);
        (ProfilePage as any).logoutHandler = logoutHandler;
        (ProfilePage as any).navClickHandler = navClickHandler;
        (ProfilePage as any).brandClickHandler = brandClickHandler;
    },
    cleanup: () => {
        const logoutHandler = (ProfilePage as any).logoutHandler;
        const navClickHandler = (ProfilePage as any).navClickHandler;
        const brandClickHandler = (ProfilePage as any).brandClickHandler;

        document.getElementById('logout')?.removeEventListener('click', logoutHandler);
        document.querySelectorAll('.nav-link').forEach(link => {
            link.removeEventListener('click', navClickHandler);
        });
        document.querySelector('.brand-link')?.removeEventListener('click', brandClickHandler);
    }
};
