import '../styles/global.css';
import '../styles/dashboard.css';
import '../styles/matches.css';
import '../styles/messages.css';
import '../styles/profile.css';

import { router } from './routes.js';
import { LoginPage } from './login.js';
import { DashboardPage } from './dashboard.js';
import { MatchesPage } from './matches.js';
import { ProfilePage } from './profile.js';
import { NotFoundPage } from './notfound.js';
import { MessagesPage } from './messages.js';

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
