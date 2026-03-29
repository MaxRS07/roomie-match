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
    if (validPages.includes(pageName)) {
        return pageName as any;
    }

    const token = localStorage.getItem('authToken');
    return token ? 'dashboard' : 'login';
};

const token = localStorage.getItem('authToken');
const initialPage = getPageFromPath();

if (!token && initialPage !== 'login' && initialPage !== 'notfound') {
    router.navigate('login');
} else {
    router.navigate(initialPage);
}
