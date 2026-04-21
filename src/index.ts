import './styles/global.css';
import './styles/login.css';
import './styles/dashboard.css';
import './styles/matches.css';
import './styles/messages.css';
import './styles/profile.css';
import { router } from './pages/routes.js';
import { LoginPage } from './pages/login.js';
import { DashboardPage } from './pages/dashboard.js';
import { MatchesPage } from './pages/matches.js';
import { ProfilePage } from './pages/profile.js';
import { NotFoundPage } from './pages/notfound.js';
import { MessagesPage } from './pages/messages.js';

router.register(LoginPage);
router.register(DashboardPage);
router.register(MatchesPage);
router.register(MessagesPage);
router.register(ProfilePage);
router.register(NotFoundPage);

window.addEventListener('popstate', (e) => {
    const page = (e.state?.page as string) || 'login';
    router.navigate(page as any);
});

const getPageFromPath = () => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const pageName = segments[0] || '';
    const validPages = ['login', 'dashboard', 'matches', 'messages', 'profile'];
    return validPages.includes(pageName) ? (pageName as any) : 'login';
};

(async () => {
    const page = getPageFromPath();
    const sessionRes = await fetch('/api/session/me', { credentials: 'include' }).catch(() => null);
    const isLoggedIn = sessionRes?.ok ?? false;

    if (!isLoggedIn) {
        router.navigate('login');
    } else if (page === 'login') {
        router.navigate('dashboard');
    } else {
        router.navigate(page);
    }
})();
