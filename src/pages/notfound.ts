import { router } from './routes.js';

export const NotFoundPage = {
    name: 'notfound' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML = `
            <div class="notfound-container">
                <h1>404</h1>
                <p>Page not found</p>
                <p>Redirecting to dashboard...</p>
            </div>
        `;

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            router.navigate('dashboard');
        }, 2000);
    },
    cleanup: () => { }
};
