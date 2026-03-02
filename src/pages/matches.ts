import { Header } from '../lib/header.js';

export const MatchesPage = {
    name: 'matches' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML = Header.getHTML({ pageName: 'matches', showProfileDropdown: true }) + `
            <div class="matches-content">
                <h1>Find Roommates</h1>
                <p>Browse available listings here.</p>
            </div>
        `;

        Header.setupListeners(MatchesPage, { pageName: 'matches', showProfileDropdown: true });
    },
    cleanup: () => {
        Header.cleanup(MatchesPage);
    }
};
