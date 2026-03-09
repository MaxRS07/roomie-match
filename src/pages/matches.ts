import { Header } from '../lib/header.js';
import { getCurrentUser, getActiveListings, createUserInterest, getListingPhoto, getUserById, getUserPreferences, getProfilePhoto } from '../lib/db.js';
import { arrayToUser, arrayToUserPreferences } from '../types/entities.js';
import type { Listing, User, UserPreferences } from '../types/entities.js';

let cleanupFn: (() => void) | null = null;

function showToast(message: string, type: 'success' | 'info' | 'error' = 'info') {
    const existing = document.querySelector('.match-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `match-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatPreference(key: string, value: string): string {
    const labels: Record<string, string> = {
        cleanliness_level: '🧹 Cleanliness',
        sleep_schedule: '🌙 Sleep',
        pet_friendly: '🐾 Pets',
        smoking_allowed: '🚬 Smoking',
        noise_tolerance: '🔊 Noise',
        guests_allowed: '👥 Guests',
        work_schedule: '💼 Work',
    };
    return `<span class="card-detail">${labels[key] || key}: ${value}</span>`;
}

function buildCardHTML(listing: Listing, photoData: string | null, lister: User | null, prefs: UserPreferences | null, listerPhoto: string | null): string {
    const photoContent = photoData
        ? `<img src="${photoData}" alt="${listing.title}" />`
        : `🏠`;

    const listerPhotoHTML = listerPhoto
        ? `<img src="${listerPhoto}" alt="${lister?.name}" class="lister-avatar" />`
        : `<div class="lister-avatar-placeholder">${lister?.name?.charAt(0).toUpperCase() ?? '?'}</div>`;

    const listerSection = lister ? `
        <div class="card-lister">
            ${listerPhotoHTML}
            <div class="lister-info">
                <span class="lister-name">${lister.name}</span>
                <span class="lister-meta">${lister.age ? lister.age + ' · ' : ''}${lister.gender || ''}${lister.occupation ? ' · ' + lister.occupation : ''}</span>
            </div>
        </div>
        ${lister.bio ? `<p class="lister-bio">${lister.bio}</p>` : ''}
    ` : '';

    const prefsSection = prefs ? `
        <div class="card-prefs">
            ${prefs.cleanliness_level ? formatPreference('cleanliness_level', prefs.cleanliness_level) : ''}
            ${prefs.sleep_schedule ? formatPreference('sleep_schedule', prefs.sleep_schedule) : ''}
            ${prefs.pet_friendly ? formatPreference('pet_friendly', prefs.pet_friendly) : ''}
            ${prefs.smoking_allowed ? formatPreference('smoking_allowed', prefs.smoking_allowed) : ''}
            ${prefs.noise_tolerance ? formatPreference('noise_tolerance', prefs.noise_tolerance) : ''}
            ${prefs.guests_allowed ? formatPreference('guests_allowed', prefs.guests_allowed) : ''}
            ${prefs.work_schedule ? formatPreference('work_schedule', prefs.work_schedule) : ''}
        </div>
    ` : '';

    return `
        <div class="swipe-overlay like"><span class="label">INTERESTED</span></div>
        <div class="swipe-overlay nope"><span class="label">PASS</span></div>
        <div class="card-photo">${photoContent}</div>
        <div class="card-body">
            <p class="card-price">$${Number(listing.rent_price).toLocaleString()}/mo</p>
            <h2 class="card-title">${listing.title}</h2>
            <div class="card-location">📍 ${listing.city}, ${listing.state} ${listing.zip_code}</div>
            <div class="card-details">
                <span class="card-detail">🛏 ${listing.num_rooms} room${Number(listing.num_rooms) !== 1 ? 's' : ''}</span>
                <span class="card-detail">🚿 ${listing.num_bathrooms} bath${Number(listing.num_bathrooms) !== 1 ? 's' : ''}</span>
            </div>
            <p class="card-description">${listing.description}</p>
            <p class="card-available">Available ${formatDate(listing.available_date)}</p>
            <hr class="card-divider" />
            ${listerSection}
            ${prefsSection}
        </div>
    `;
}

function initSwipeEngine(container: HTMLElement, listings: Listing[], userId: string) {
    let currentIndex = 0;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isDragging = false;
    let cardEl: HTMLElement | null = null;
    let behindCardEl: HTMLElement | null = null;

    const SWIPE_THRESHOLD = 100;
    const MAX_ROTATION = 15;

    const stack = container.querySelector('.card-stack') as HTMLElement;
    const declineBtn = container.querySelector('.action-btn.decline') as HTMLElement;
    const interestBtn = container.querySelector('.action-btn.interest') as HTMLElement;

    async function renderCard(index: number, isBehind = false): Promise<HTMLElement | null> {
        if (index >= listings.length) return null;

        const listing = listings[index]!;
        const card = document.createElement('div');
        card.className = 'listing-card' + (isBehind ? ' behind' : '');
        card.dataset.index = String(index);

        // Try to load photo + lister info in parallel
        let photoData: string | null = null;
        let lister: User | null = null;
        let prefs: UserPreferences | null = null;
        let listerPhoto: string | null = null;
        try {
            const [photoRes, userRes, prefsRes, listerPhotoRes] = await Promise.all([
                getListingPhoto(listing.listing_id).catch(() => null),
                getUserById(listing.user_id),
                getUserPreferences(listing.user_id),
                getProfilePhoto(listing.user_id).catch(() => null),
            ]);
            photoData = photoRes;
            listerPhoto = listerPhotoRes;
            if (userRes.success && userRes.data && userRes.data.length > 0) {
                lister = arrayToUser(userRes.data[0]);
            }
            if (prefsRes.success && prefsRes.data && prefsRes.data.length > 0) {
                prefs = arrayToUserPreferences(prefsRes.data[0]);
            }
        } catch { /* graceful fallback */ }

        card.innerHTML = buildCardHTML(listing, photoData, lister, prefs, listerPhoto);
        if (isBehind) {
            stack.prepend(card);
        } else {
            stack.appendChild(card);
        }
        return card;
    }

    async function setupCards() {
        stack.innerHTML = '';

        // Render behind card first (so it's below)
        if (currentIndex + 1 < listings.length) {
            behindCardEl = await renderCard(currentIndex + 1, true);
        }

        // Render current card on top
        if (currentIndex < listings.length) {
            cardEl = await renderCard(currentIndex);
            attachDragListeners(cardEl!);
        } else {
            showEmpty();
        }
    }

    function showEmpty() {
        stack.innerHTML = '';
        const empty = document.createElement('div');
        empty.className = 'matches-empty';
        empty.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p>No more listings to show</p>
            <p style="font-size:0.9rem; margin-top:0.5rem;">Check back later for new listings!</p>
        `;
        stack.appendChild(empty);

        // Hide action buttons
        const actions = container.querySelector('.card-actions') as HTMLElement;
        if (actions) actions.style.display = 'none';
    }

    function attachDragListeners(card: HTMLElement) {
        card.addEventListener('pointerdown', onPointerDown);
        card.addEventListener('pointermove', onPointerMove);
        card.addEventListener('pointerup', onPointerUp);
        card.addEventListener('pointercancel', onPointerUp);
    }

    function onPointerDown(e: PointerEvent) {
        if (!cardEl) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        currentX = 0;
        cardEl.classList.add('dragging');
        cardEl.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!isDragging || !cardEl) return;
        currentX = e.clientX - startX;
        const rotation = (currentX / window.innerWidth) * MAX_ROTATION;
        cardEl.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;

        // Show overlays
        const likeOverlay = cardEl.querySelector('.swipe-overlay.like') as HTMLElement;
        const nopeOverlay = cardEl.querySelector('.swipe-overlay.nope') as HTMLElement;
        const progress = Math.min(Math.abs(currentX) / SWIPE_THRESHOLD, 1);

        if (currentX > 0) {
            likeOverlay.style.opacity = String(progress);
            nopeOverlay.style.opacity = '0';
        } else {
            nopeOverlay.style.opacity = String(progress);
            likeOverlay.style.opacity = '0';
        }

        // Animate behind card
        if (behindCardEl) {
            const scale = 0.95 + 0.05 * Math.min(progress, 1);
            const translateY = 12 - 12 * Math.min(progress, 1);
            behindCardEl.style.transform = `scale(${scale}) translateY(${translateY}px)`;
            behindCardEl.style.opacity = String(0.6 + 0.4 * Math.min(progress, 1));
        }
    }

    function onPointerUp(_e: PointerEvent) {
        if (!isDragging || !cardEl) return;
        isDragging = false;
        cardEl.classList.remove('dragging');

        if (Math.abs(currentX) >= SWIPE_THRESHOLD) {
            const direction = currentX > 0 ? 'right' : 'left';
            animateOut(direction);
        } else {
            // Snap back
            cardEl.style.transition = 'transform 0.3s ease';
            cardEl.style.transform = '';
            const likeOverlay = cardEl.querySelector('.swipe-overlay.like') as HTMLElement;
            const nopeOverlay = cardEl.querySelector('.swipe-overlay.nope') as HTMLElement;
            likeOverlay.style.opacity = '0';
            nopeOverlay.style.opacity = '0';

            if (behindCardEl) {
                behindCardEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                behindCardEl.style.transform = 'scale(0.95) translateY(12px)';
                behindCardEl.style.opacity = '0.6';
            }

            setTimeout(() => {
                if (cardEl) cardEl.style.transition = '';
                if (behindCardEl) behindCardEl.style.transition = '';
            }, 300);
        }
    }

    async function animateOut(direction: 'left' | 'right') {
        if (!cardEl) return;

        const listing = listings[currentIndex]!;
        const flyX = direction === 'right' ? window.innerWidth : -window.innerWidth;
        const rotation = direction === 'right' ? 30 : -30;

        cardEl.classList.add('animate-out');
        cardEl.style.transform = `translateX(${flyX}px) rotate(${rotation}deg)`;
        cardEl.style.opacity = '0';

        // Promote behind card
        if (behindCardEl) {
            behindCardEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            behindCardEl.classList.remove('behind');
            behindCardEl.style.transform = '';
            behindCardEl.style.opacity = '1';
        }

        if (direction === 'right') {
            // Send interest
            try {
                await createUserInterest(userId, listing.listing_id);
                showToast('Interest sent! 🎉', 'success');
            } catch {
                showToast('Failed to send interest', 'error');
            }
        } else {
            showToast('Passed', 'info');
        }

        // Wait for exit animation
        await new Promise(r => setTimeout(r, 400));

        // Clean up old card
        cardEl.remove();
        currentIndex++;

        // The behind card becomes the current card
        cardEl = behindCardEl;
        if (cardEl) {
            cardEl.style.transition = '';
            attachDragListeners(cardEl);
        }

        // Load next behind card
        behindCardEl = null;
        if (currentIndex + 1 < listings.length) {
            behindCardEl = await renderCard(currentIndex + 1, true);
        }

        // If no more cards
        if (currentIndex >= listings.length) {
            showEmpty();
        }
    }

    // Button handlers
    function onDeclineClick() {
        if (cardEl && !isDragging) animateOut('left');
    }

    function onInterestClick() {
        if (cardEl && !isDragging) animateOut('right');
    }

    declineBtn?.addEventListener('click', onDeclineClick);
    interestBtn?.addEventListener('click', onInterestClick);

    // Keyboard support
    function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'ArrowLeft') onDeclineClick();
        if (e.key === 'ArrowRight') onInterestClick();
    }
    document.addEventListener('keydown', onKeyDown);

    // Start
    setupCards();

    // Return cleanup
    return () => {
        declineBtn?.removeEventListener('click', onDeclineClick);
        interestBtn?.removeEventListener('click', onInterestClick);
        document.removeEventListener('keydown', onKeyDown);
    };
}

export const MatchesPage = {
    name: 'matches' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML = Header.getHTML({ pageName: 'matches', showProfileDropdown: true }) + `
            <div class="matches-content">
                <div class="card-stack">
                    <div class="matches-loading">
                        <div class="spinner"></div>
                        <p>Loading listings...</p>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="action-btn decline" title="Pass (← arrow key)">✕</button>
                    <button class="action-btn interest" title="Interested (→ arrow key)">♥</button>
                </div>
            </div>
        `;

        Header.setupListeners(MatchesPage, { pageName: 'matches', showProfileDropdown: true });

        // Load data
        Promise.all([getCurrentUser(), getActiveListings()]).then(([user, listingsResult]) => {
            if (!user) {
                showToast('Please log in first', 'error');
                return;
            }

            if (!listingsResult.success || !listingsResult.data || listingsResult.data.length === 0) {
                const stack = document.querySelector('.card-stack') as HTMLElement;
                if (stack) {
                    stack.innerHTML = `
                        <div class="matches-empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <p>No listings available yet</p>
                        </div>
                    `;
                }
                const actions = document.querySelector('.card-actions') as HTMLElement;
                if (actions) actions.style.display = 'none';
                return;
            }

            // Filter out user's own listings
            const listings = (listingsResult.data as Listing[]).filter(l => l.user_id !== user.user_id);

            if (listings.length === 0) {
                const stack = document.querySelector('.card-stack') as HTMLElement;
                if (stack) {
                    stack.innerHTML = `
                        <div class="matches-empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <p>No more listings to show</p>
                        </div>
                    `;
                }
                const actions = document.querySelector('.card-actions') as HTMLElement;
                if (actions) actions.style.display = 'none';
                return;
            }

            const content = document.querySelector('.matches-content') as HTMLElement;
            cleanupFn = initSwipeEngine(content, listings, user.user_id);
        }).catch(err => {
            console.error('Error loading matches:', err);
            showToast('Error loading listings', 'error');
        });
    },
    cleanup: () => {
        if (cleanupFn) {
            cleanupFn();
            cleanupFn = null;
        }
        Header.cleanup(MatchesPage);
        const toast = document.querySelector('.match-toast');
        if (toast) toast.remove();
    }
};
