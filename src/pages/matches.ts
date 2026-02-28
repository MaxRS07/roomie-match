import { router } from './routes.js';

export const MatchesPage = {
    name: 'matches' as const,
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
                        <img></img>
                    </button>
                </nav>
            </header>
            <div class="matches-content">
                <h1>Find Roommates</h1>
                <p>Browse available listings here.</p>
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
        (MatchesPage as any).logoutHandler = logoutHandler;
        (MatchesPage as any).navClickHandler = navClickHandler;
        (MatchesPage as any).brandClickHandler = brandClickHandler;
    },
    cleanup: () => {
        const logoutHandler = (MatchesPage as any).logoutHandler;
        const navClickHandler = (MatchesPage as any).navClickHandler;
        const brandClickHandler = (MatchesPage as any).brandClickHandler;

        document.getElementById('logout')?.removeEventListener('click', logoutHandler);
        document.querySelectorAll('.nav-link').forEach(link => {
            link.removeEventListener('click', navClickHandler);
        });
        document.querySelector('.brand-link')?.removeEventListener('click', brandClickHandler);
    }
};
