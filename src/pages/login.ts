import { authenticateUser } from "../lib/db.js";
import { router } from "./routes.js";

// src/pages/login.ts
export const LoginPage = {
    name: 'login' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML = `
            <div class="login-container">
                <h1>Roomie Match</h1>
                <form id="login-form">
                    <input type="email" id="email" placeholder="Email" required />
                    <input type="password" id="password" placeholder="Password" required />
                    <button type="submit">Login</button>
                </form>
                <button id="login-as-guest">Login as Guest</button>
            </div>
        `;

        document.getElementById('login-form')?.addEventListener('submit', handleLogin);

        document.getElementById('login-as-guest')?.addEventListener('click', () => {
            authenticateUser('dsteynor0@mysql.com', '$2a$04$di9TDfadKUkdFJSlZVZyhO0hDGa42Y1skGrueD9ILj.OHjtqBVI7a').then(result => {
                if (result.success) {
                    localStorage.setItem('authToken', 'guest-token');
                    router.navigate('dashboard');
                } else {
                    alert('Guest login failed');
                }
            });
        });
    },
    cleanup: () => {
        document.getElementById('login-form')?.removeEventListener('submit', handleLogin);
        document.getElementById('login-as-guest')?.removeEventListener('click', () => { });
    }
};

async function handleLogin(e: Event) {
    e.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    authenticateUser(email, password).then(result => {
        if (result.success) {
            localStorage.setItem('authToken', 'user-token');
            router.navigate('dashboard');
        } else {
            alert('Login failed');
        }
    }).catch(error => {
        console.error('Login error:', error);
        alert('An error occurred during login: ' + (error instanceof Error ? error.message : 'Unknown error'));
    });
}