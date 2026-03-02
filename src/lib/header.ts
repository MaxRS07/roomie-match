import { router } from '../pages/routes.js';
import { getCurrentUser, getProfilePhoto } from './db.js';

interface HeaderOptions {
    pageName: string;
    showProfileDropdown?: boolean;
}

interface HeaderState {
    navClickHandler: (e: Event) => void;
    brandClickHandler: (e: Event) => void;
    dropdownClickHandler?: (e: Event) => void;
    dropdownLogoutHandler?: (e: Event) => void;
    dropdownProfileHandler?: (e: Event) => void;
    logoutHandler: (e: Event) => void;
    documentClickHandler?: (e: Event) => void;
}

export const Header = {
    getHTML: (options: HeaderOptions): string => `
        <header class="dashboard-header">
            <div>
                <a href="#" class="brand-link">Roomie Match</a>
            </div>
            <nav>
                <a href="#" class="nav-link" data-page="dashboard">Dashboard</a>
                <a href="#" class="nav-link" data-page="matches">Matches</a>
                <a href="#" class="nav-link" data-page="messages">Messages</a>
                <div class="profile-dropdown-container">
                    <button id="open-dropdown">
                        <img id="profile-img"></img>
                    </button>
                    <div id="profile-dropdown" class="profile-dropdown">
                        <a href="#" class="dropdown-link" data-page="profile">Profile</a>
                        <button id="dropdown-logout" class="dropdown-logout">Logout</button>
                    </div>
                </div>
            </nav>
        </header>
    `,

    setupListeners: (pageObject: any, options: HeaderOptions): HeaderState => {
        const state: HeaderState = {
            navClickHandler: () => { },
            brandClickHandler: () => { },
            logoutHandler: () => { },
        };

        // Navigation link handler
        state.navClickHandler = (e: Event) => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            const page = target.getAttribute('data-page');
            if (page) router.navigate(page as any);
        };
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.addEventListener('click', state.navClickHandler));

        // Brand link handler
        state.brandClickHandler = (e: Event) => {
            e.preventDefault();
            router.navigate('matches');
        };
        const brandLink = document.querySelector('.brand-link');
        brandLink?.addEventListener('click', state.brandClickHandler);

        // Logout handler
        // state.logoutHandler = () => {
        //     localStorage.removeItem('authToken');
        //     router.navigate('login');
        // };
        // const logoutBtn = document.getElementById('logout');
        // if (logoutBtn) {
        //     logoutBtn.addEventListener('click', state.logoutHandler);
        // }

        // Profile dropdown handler
        if (options.showProfileDropdown) {
            state.dropdownClickHandler = (e: Event) => {
                e.stopPropagation();
                document.getElementById('profile-dropdown')?.classList.toggle('show');
            };
            const dropdownBtn = document.getElementById('open-dropdown');
            if (dropdownBtn) {
                dropdownBtn.addEventListener('click', state.dropdownClickHandler);
            }

            // Profile dropdown logout handler
            state.dropdownLogoutHandler = () => {
                localStorage.removeItem('authToken');
                router.navigate('login');
            };
            const dropdownLogoutBtn = document.getElementById('dropdown-logout');
            if (dropdownLogoutBtn) {
                dropdownLogoutBtn.addEventListener('click', state.dropdownLogoutHandler);
            }

            // Profile dropdown profile link handler
            state.dropdownProfileHandler = (e: Event) => {
                e.preventDefault();
                document.getElementById('profile-dropdown')?.classList.remove('show');
                router.navigate('profile');
            };
            const dropdownProfileLink = document.querySelector('.dropdown-link');
            if (dropdownProfileLink) {
                dropdownProfileLink.addEventListener('click', state.dropdownProfileHandler);
            }

            // Close dropdown when clicking outside
            state.documentClickHandler = (e: Event) => {
                const dropdown = document.getElementById('profile-dropdown');
                const dropdownContainer = document.querySelector('.profile-dropdown-container');
                if (dropdown && !dropdownContainer?.contains(e.target as Node)) {
                    dropdown.classList.remove('show');
                }
            };
            document.addEventListener('click', state.documentClickHandler);

            // Load and display profile photo
            (async () => {
                const user = await getCurrentUser();
                if (user) {
                    const prof = await getProfilePhoto(user.user_id);
                    const profileImg = document.getElementById('profile-img') as HTMLImageElement;
                    if (profileImg) {
                        profileImg.src = prof || 'https://via.placeholder.com/32?text=User';
                    }
                }
            })();
        }

        // Store state on page object for cleanup
        pageObject.headerState = state;
        return state;
    },

    cleanup: (pageObject: any) => {
        const state: HeaderState | undefined = pageObject.headerState;
        if (!state) return;

        // Remove navigation link listeners
        document.querySelectorAll('.nav-link').forEach(link => {
            link.removeEventListener('click', state.navClickHandler);
        });

        // Remove brand link listener
        document.querySelector('.brand-link')?.removeEventListener('click', state.brandClickHandler);

        // Remove logout listener
        document.getElementById('logout')?.removeEventListener('click', state.logoutHandler);

        // Remove dropdown listeners if they exist
        if (state.dropdownClickHandler) {
            document.getElementById('open-dropdown')?.removeEventListener('click', state.dropdownClickHandler);
        }
        if (state.dropdownLogoutHandler) {
            document.getElementById('dropdown-logout')?.removeEventListener('click', state.dropdownLogoutHandler);
        }
        if (state.dropdownProfileHandler) {
            document.querySelector('.dropdown-link')?.removeEventListener('click', state.dropdownProfileHandler);
        }
        if (state.documentClickHandler) {
            document.removeEventListener('click', state.documentClickHandler);
        }
    }
};
