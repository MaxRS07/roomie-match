import { router } from './pages/routes.js';
import { LoginPage } from './pages/login.js';
import { DashboardPage } from './pages/match.js';

router.register(LoginPage);
router.register(DashboardPage);

// Handle routing
window.addEventListener('popstate', (e) => {
    const page = (e.state?.page as string) || 'login';
    router.navigate(page as any);
});

// Start app
const token = localStorage.getItem('authToken');
router.navigate(token ? 'dashboard' : 'login');