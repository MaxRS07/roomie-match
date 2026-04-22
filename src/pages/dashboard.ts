import { getCurrentUser, getProfilePhoto, getUserListings, getInterestsForListing, getUnreadMessageCount, getUserSentInterests, getUserById, getListingPhoto } from '../lib/db.js';
import { arrayToUser } from '../types/entities.js';
import type { Listing, UserInterest, User } from '../types/entities.js';
import { Header } from '../lib/header.js';
import { router } from './routes.js';

export const DashboardPage = {
    name: 'dashboard' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML = Header.getHTML({ pageName: 'dashboard', showProfileDropdown: true }) + `
            <div class="dashboard-content">
                <div class="dash-loading">
                    <div class="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        `;

        Header.setupListeners(DashboardPage, { pageName: 'dashboard', showProfileDropdown: true });

        loadDashboard();
    },
    cleanup: () => {
        Header.cleanup(DashboardPage);
    }
};

async function loadDashboard() {
    const content = document.querySelector('.dashboard-content') as HTMLElement;
    if (!content) return;

    const user = await getCurrentUser();
    if (!user) {
        content.innerHTML = `<div class="dash-empty"><div class="icon">🔒</div><p>Please log in to view your dashboard.</p></div>`;
        return;
    }

    // Fetch all dashboard data in parallel
    const [photoData, listingsResult, unreadCount, sentInterestsResult] = await Promise.all([
        getProfilePhoto(user.user_id).catch(() => null),
        getUserListings(user.user_id),
        getUnreadMessageCount(user.user_id),
        getUserSentInterests(user.user_id),
    ]);

    const listings: Listing[] = (listingsResult.success && listingsResult.data) ? listingsResult.data as Listing[] : [];
    const sentInterests: UserInterest[] = (sentInterestsResult.success && sentInterestsResult.data) ? sentInterestsResult.data as UserInterest[] : [];

    // Get interest counts per listing
    const listingInterestCounts: Map<string, number> = new Map();
    let totalIncomingInterests = 0;
    if (listings.length > 0) {
        const interestResults = await Promise.all(
            listings.map(l => getInterestsForListing(l.listing_id))
        );
        interestResults.forEach((res, i) => {
            const count = (res.success && res.data) ? (res.data as UserInterest[]).length : 0;
            listingInterestCounts.set(listings[i]!.listing_id, count);
            totalIncomingInterests += count;
        });
    }

    // Build welcome banner
    const avatarHTML = photoData
        ? `<img class="dash-welcome-avatar" src="${photoData}" alt="${user.name}" />`
        : `<div class="dash-welcome-avatar-placeholder">${user.name.charAt(0).toUpperCase()}</div>`;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    // Build stats
    const activeListings = listings.filter(l => l.is_active === 'TRUE' || l.is_active === ('1' as any)).length;

    // Build listings section
    let listingsHTML = '';
    if (listings.length > 0) {
        // Fetch listing photos in parallel
        const listingPhotos = await Promise.all(
            listings.map(l => getListingPhoto(l.listing_id).catch(() => null))
        );

        listingsHTML = `
            <h2 class="dash-section-title">🏠 My Listings</h2>
            <div class="dash-listings">
                ${listings.map((l, i) => {
            const interests = listingInterestCounts.get(l.listing_id) || 0;
            const isActive = l.is_active === 'TRUE' || l.is_active === ('1' as any);
            const photo = listingPhotos[i];
            const thumbContent = photo
                ? `<img src="${photo}" alt="${l.title}" />`
                : '🏠';
            return `
                        <div class="dash-listing-card">
                            <div class="dash-listing-thumb">${thumbContent}</div>
                            <div class="dash-listing-info">
                                <div class="dash-listing-title">${l.title}</div>
                                <div class="dash-listing-meta">$${Number(l.rent_price).toLocaleString()}/mo · ${l.city}, ${l.state}</div>
                            </div>
                            <div class="dash-listing-interests">${interests} interest${interests !== 1 ? 's' : ''}</div>
                            <span class="dash-listing-status ${isActive ? 'active' : 'inactive'}">${isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    // Build recent incoming interests
    let interestsHTML = '';
    if (totalIncomingInterests > 0) {
        // Gather all interests across listings
        const allInterests: { interest: UserInterest; listingTitle: string }[] = [];
        const interestResults = await Promise.all(
            listings.map(l => getInterestsForListing(l.listing_id))
        );
        interestResults.forEach((res, i) => {
            if (res.success && res.data) {
                (res.data as UserInterest[]).forEach(interest => {
                    allInterests.push({ interest, listingTitle: listings[i]!.title });
                });
            }
        });

        // Sort by most recent, take top 5
        allInterests.sort((a, b) => b.interest.created_at - a.interest.created_at);
        const recentInterests = allInterests.slice(0, 5);

        // Fetch renter info
        const renterInfos = await Promise.all(
            recentInterests.map(async ({ interest }) => {
                try {
                    const res = await getUserById(interest.renter_id);
                    if (res.success && res.data && res.data.length > 0) {
                        return arrayToUser(res.data[0]);
                    }
                } catch { }
                return null;
            })
        );

        const renterPhotos = await Promise.all(
            recentInterests.map(({ interest }) =>
                getProfilePhoto(interest.renter_id).catch(() => null)
            )
        );

        interestsHTML = `
            <h2 class="dash-section-title">📬 Recent Interest in Your Listings</h2>
            <div class="dash-interests">
                ${recentInterests.map(({ interest, listingTitle }, i) => {
            const renter = renterInfos[i];
            const rPhoto = renterPhotos[i];
            const avatarEl = rPhoto
                ? `<img class="dash-interest-avatar" src="${rPhoto}" />`
                : `<div class="dash-interest-avatar-placeholder">${renter?.name?.charAt(0).toUpperCase() ?? '?'}</div>`;
            return `
                        <div class="dash-interest-row">
                            ${avatarEl}
                            <div class="dash-interest-text">
                                <strong>${renter?.name ?? 'Someone'}</strong> is interested in <strong>${listingTitle}</strong>
                            </div>
                            <span class="dash-interest-status ${interest.status}">${interest.status}</span>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    // Build sent interests section
    let sentHTML = '';
    if (sentInterests.length > 0) {
        const recentSent = sentInterests.slice(0, 5);

        sentHTML = `
            <h2 class="dash-section-title">💌 Your Sent Interests</h2>
            <div class="dash-interests">
                ${recentSent.map(interest => `
                    <div class="dash-interest-row">
                        <div class="dash-interest-avatar-placeholder">📋</div>
                        <div class="dash-interest-text">
                            Listing <strong>${interest.listing_id.slice(0, 8)}…</strong>
                        </div>
                        <span class="dash-interest-status ${interest.status}">${interest.status}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    content.innerHTML = `
        <!-- Welcome -->
        <div class="dash-welcome">
            ${avatarHTML}
            <div class="dash-welcome-text">
                <h1>${greeting}, ${user.name}!</h1>
                <p>Here's an overview of your Roomie Match activity.</p>
            </div>
        </div>

        <!-- Stats -->
        <div class="dash-stats">
            <div class="dash-stat" data-nav="matches">
                <div class="dash-stat-icon listings">🏠</div>
                <div class="dash-stat-body">
                    <span class="dash-stat-value">${activeListings}</span>
                    <span class="dash-stat-label">Active Listings</span>
                </div>
            </div>
            <div class="dash-stat" data-nav="dashboard">
                <div class="dash-stat-icon interests">📬</div>
                <div class="dash-stat-body">
                    <span class="dash-stat-value">${totalIncomingInterests}</span>
                    <span class="dash-stat-label">Incoming Interests</span>
                </div>
            </div>
            <div class="dash-stat" data-nav="messages">
                <div class="dash-stat-icon messages">💬</div>
                <div class="dash-stat-body">
                    <span class="dash-stat-value">${unreadCount}</span>
                    <span class="dash-stat-label">Unread Messages</span>
                </div>
            </div>
            <div class="dash-stat" data-nav="matches">
                <div class="dash-stat-icon sent">💌</div>
                <div class="dash-stat-body">
                    <span class="dash-stat-value">${sentInterests.length}</span>
                    <span class="dash-stat-label">Interests Sent</span>
                </div>
            </div>
        </div>

        <!-- Quick actions -->
        <div class="dash-actions">
            <button class="dash-action-btn" data-nav="matches"><span class="icon">🔍</span> Browse Listings</button>
            <button class="dash-action-btn" data-nav="messages"><span class="icon">💬</span> Messages</button>
            <button class="dash-action-btn" data-nav="profile"><span class="icon">👤</span> Edit Profile</button>
        </div>

        <!-- My listings -->
        ${listingsHTML || `
            <h2 class="dash-section-title">🏠 My Listings</h2>
            <div class="dash-empty">
                <div class="icon">📋</div>
                <p>You haven't created any listings yet.</p>
            </div>
        `}

        <!-- Incoming interests -->
        ${interestsHTML}

        <!-- Sent interests -->
        ${sentHTML}
    `;

    // Attach click handlers for stat cards and action buttons
    content.querySelectorAll('[data-nav]').forEach(el => {
        el.addEventListener('click', () => {
            const page = (el as HTMLElement).dataset.nav;
            if (page) router.navigate(page as any);
        });
    });
}