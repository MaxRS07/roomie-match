import { router } from './pages/routes.js';
import { LoginPage } from './pages/login.js';
import { DashboardPage } from './pages/dashboard.js';
import { MatchesPage } from './pages/matches.js';
import { ProfilePage } from './pages/profile.js';
import { NotFoundPage } from './pages/notfound.js';
import { Cache } from './lib/cache.js';

router.register(LoginPage);
router.register(DashboardPage);
router.register(MatchesPage);
router.register(ProfilePage);
router.register(NotFoundPage);

// Handle routing
window.addEventListener('popstate', (e) => {
    const page = (e.state?.page as string) || 'login';
    router.navigate(page as any);
});

// Parse the current URL path and navigate accordingly
const getPageFromPath = () => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const pageName = segments[0] || '';

    // Map valid page routes
    const validPages = ['login', 'dashboard', 'matches', 'profile'];
    if (validPages.includes(pageName)) {
        return pageName as any;
    }

    // If path is root or invalid
    const token = localStorage.getItem('authToken');
    return token ? 'dashboard' : 'login';
};

// Start app
const token = localStorage.getItem('authToken');
const initialPage = getPageFromPath();

// If trying to access a protected page without token, redirect to login
if (!token && initialPage !== 'login' && initialPage !== 'notfound') {
    router.navigate('login');
} else {
    router.navigate(initialPage);
}