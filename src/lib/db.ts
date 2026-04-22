import type { QueryResult } from '../types/query.js';
import type { Message, User, Listing, UserInterest } from '../types/entities.js';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

async function apiRequest<T = any>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
        ...init,
    });

    const payload = await response.json().catch(() => ({}));
    console.log(`${response.status} ${response.statusText} - ${path}`, payload);
    if (!response.ok) {
        throw new Error(payload?.error ?? `Request failed: ${response.status}`);
    }


    return payload as T;
}

export async function getAllUsers(): Promise<QueryResult<User[]>> {
    try {
        const data = await apiRequest<User[]>('/users');
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUserById(userId: string): Promise<QueryResult<User[]>> {
    try {
        const data = await apiRequest<User[]>(`/users/${encodeURIComponent(userId)}`);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function createUser(userData: { name: string; email: string; password_hash: string; age?: string; gender?: string; occupation?: string; bio?: string }): Promise<QueryResult> {
    try {
        const data = await apiRequest<any>('/users', { method: 'POST', body: JSON.stringify(userData) });
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateUser(userId: string, userData: Partial<{ name: string; email: string; preferences: any }>): Promise<QueryResult> {
    try {
        const data = await apiRequest<any>(`/users/${encodeURIComponent(userId)}`, { method: 'PUT', body: JSON.stringify(userData) });
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateUserProfile(userId: string, data: {
    name?: string; email?: string; age?: string; gender?: string; occupation?: string; bio?: string;
}): Promise<QueryResult> {
    try {
        const result = await apiRequest<any>(`/users/${encodeURIComponent(userId)}/profile`, { method: 'PUT', body: JSON.stringify(data) });
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteUser(userId: string): Promise<QueryResult> {
    try {
        const data = await apiRequest<any>(`/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function authenticateUser(email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const data = await apiRequest<any>('/auth/authenticate', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        console.log('Authentication successful:', data);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        const data = await apiRequest<User>('/session/me');
        return data ?? null;
    } catch {
        return null;
    }
}

export async function getUserPreferences(userId: string): Promise<QueryResult> {
    try {
        const data = await apiRequest<any>(`/users/${encodeURIComponent(userId)}/preferences`);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateUserPreferences(userId: string, prefs: {
    cleanliness_level?: string; sleep_schedule?: string; pet_friendly?: string;
    smoking_allowed?: string; noise_tolerance?: string; guests_allowed?: string; work_schedule?: string;
}): Promise<QueryResult> {
    try {
        const data = await apiRequest<any>(`/users/${encodeURIComponent(userId)}/preferences`, {
            method: 'PUT',
            body: JSON.stringify(prefs)
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getProfilePhoto(userId: string): Promise<string | null> {
    try {
        const data = await apiRequest<{ data: string | null }>(`/users/${encodeURIComponent(userId)}/profile-photo`);
        return data?.data ?? null;
    } catch {
        return null;
    }
}

export async function updateProfilePhoto(userId: string, dataUrl: string): Promise<QueryResult> {
    try {
        const data = await apiRequest<any>(`/users/${encodeURIComponent(userId)}/profile-photo`, {
            method: 'PUT',
            body: JSON.stringify({ dataUrl })
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getListingPhoto(listingId: string): Promise<string | null> {
    try {
        const data = await apiRequest<{ data: string | null }>(`/listings/${encodeURIComponent(listingId)}/photo`);
        return data?.data ?? null;
    } catch {
        return null;
    }
}

export async function getActiveListings(): Promise<QueryResult<Listing[]>> {
    try {
        const data = await apiRequest<Listing[]>('/listings/active');
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUserListings(userId: string): Promise<QueryResult<Listing[]>> {
    try {
        const data = await apiRequest<Listing[]>(`/users/${encodeURIComponent(userId)}/listings`);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function createUserInterest(renterId: string, listingId: string): Promise<QueryResult> {
    try {
        const data = await apiRequest<any>('/interests', {
            method: 'POST',
            body: JSON.stringify({ renterId, listingId })
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getInterestsForListing(listingId: string): Promise<QueryResult<UserInterest[]>> {
    try {
        const data = await apiRequest<UserInterest[]>(`/listings/${encodeURIComponent(listingId)}/interests`);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUserSentInterests(userId: string): Promise<QueryResult<UserInterest[]>> {
    try {
        const data = await apiRequest<UserInterest[]>(`/users/${encodeURIComponent(userId)}/interests/sent`);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUserChats(userId: string): Promise<QueryResult<[string, number][]>> {
    try {
        const data = await apiRequest<[string, number][]>(`/users/${encodeURIComponent(userId)}/chats`);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getChatMessages(from_id: string, to_id: string): Promise<QueryResult> {
    try {
        const data = await apiRequest<any[]>(`/messages/chat?from=${encodeURIComponent(from_id)}&to=${encodeURIComponent(to_id)}`);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function sendMessage(message: Message): Promise<QueryResult> {
    try {
        const data = await apiRequest<any>('/messages', {
            method: 'POST',
            body: JSON.stringify(message)
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
    try {
        const data = await apiRequest<{ count: number }>(`/users/${encodeURIComponent(userId)}/messages/unread-count`);
        return data.count ?? 0;
    } catch {
        return 0;
    }
}
