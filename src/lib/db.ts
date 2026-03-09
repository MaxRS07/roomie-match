import { createClient } from '@supabase/supabase-js';
import {
    rowToUser, rowToListing, rowToUserInterest, rowToUserPreferences, rowToMessage,
    type Message, type User, type Listing, type UserInterest
} from '../types/entities.js';
import type { QueryResult } from '../types/query.js';

const SUPABASE_URL = 'https://njkmhwmxlqxjtoikodgr.supabase.co';
const SUPABASE_ANON_KEY = "sb_publishable_BBneOiwuHde2l2Ofa_04Qw_rLWhCsT1";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<QueryResult<User[]>> {
    const { data, error } = await supabase.from('Users').select('*');
    if (error) return { success: false, error: error.message };
    return { success: true, data: data.map(rowToUser) };
}

export async function getUserById(userId: string): Promise<QueryResult<User[]>> {
    const { data, error } = await supabase.from('Users').select('*').eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: data.map(rowToUser) };
}

export async function createUser(userData: { name: string; email: string; password_hash: string; age?: string; gender?: string; occupation?: string; bio?: string }): Promise<QueryResult> {
    const { error } = await supabase.from('Users').insert([{
        ...userData,
        created_at: Date.now()
    }]);
    if (error) return { success: false, error: error.message };
    return { success: true, data: { affected: 1 } };
}

export async function updateUser(userId: string, userData: Partial<{ name: string; email: string; preferences: any }>): Promise<QueryResult> {
    const { error } = await supabase.from('Users').update(userData).eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: { affected: 1 } };
}

export async function updateUserProfile(userId: string, data: {
    name?: string; email?: string; age?: string; gender?: string; occupation?: string; bio?: string;
}): Promise<QueryResult> {
    const { error } = await supabase.from('Users').update(data).eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    // Bust localStorage cache so header/pages see fresh data
    localStorage.removeItem('user:' + userId);
    return { success: true, data: { affected: 1 } };
}

export async function deleteUser(userId: string): Promise<QueryResult> {
    const { error } = await supabase.from('Users').delete().eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: { affected: 1 } };
}

export async function authenticateUser(email: string, password: string): Promise<{ success: boolean; data: User }> {
    const { data, error } = await supabase
        .from('Users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .single();
    if (error || !data) throw new Error('Authentication failed: Invalid email or password');
    return { success: true, data: rowToUser(data) };
}

// ─── Current User (client-side session via localStorage) ─────────────────────

export async function getCurrentUser(): Promise<User | null> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return null;

    const cached = localStorage.getItem('user:' + authToken);
    if (cached) return JSON.parse(cached) as User;

    const result = await getUserById(authToken);
    if (result.success && result.data && result.data.length > 0) {
        const user = result.data[0]!;
        localStorage.setItem('user:' + authToken, JSON.stringify(user));
        return user;
    }
    return null;
}

// ─── User Preferences ─────────────────────────────────────────────────────────

export async function getUserPreferences(userId: string): Promise<QueryResult> {
    const { data, error } = await supabase.from('UserPreferences').select('*').eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: data.map(rowToUserPreferences) };
}

export async function updateUserPreferences(userId: string, prefs: {
    cleanliness_level?: string; sleep_schedule?: string; pet_friendly?: string;
    smoking_allowed?: string; noise_tolerance?: string; guests_allowed?: string; work_schedule?: string;
}): Promise<QueryResult> {
    const { error } = await supabase.from('UserPreferences').update(prefs).eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: { affected: 1 } };
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function getProfilePhoto(userId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('ProfilePhoto')
        .select('data')
        .eq('user_id', userId)
        .single();
    if (error || !data) return null;
    return data.data ?? null;
}

export async function updateProfilePhoto(userId: string, dataUrl: string): Promise<QueryResult> {
    // Upsert so it works whether or not a row already exists
    const { error } = await supabase
        .from('ProfilePhoto')
        .upsert({ user_id: userId, data: dataUrl }, { onConflict: 'user_id' });
    if (error) return { success: false, error: error.message };
    return { success: true, data: { affected: 1 } };
}

export async function getListingPhoto(listingId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('ListingPhotos')
        .select('data')
        .eq('listing_id', listingId)
        .single();
    if (error || !data) return null;
    return data.data ?? null;
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function getActiveListings(): Promise<QueryResult<Listing[]>> {
    const { data, error } = await supabase
        .from('Listings')
        .select('*')
        .eq('is_active', '1')
        .order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data.map(rowToListing) };
}

export async function getUserListings(userId: string): Promise<QueryResult<Listing[]>> {
    const { data, error } = await supabase
        .from('Listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data.map(rowToListing) };
}

// ─── User Interests ───────────────────────────────────────────────────────────

export async function createUserInterest(renterId: string, listingId: string): Promise<QueryResult> {
    const { error } = await supabase.from('UserInterests').insert([{
        renter_id: renterId,
        listing_id: listingId,
        status: 'Pending',
        created_at: Date.now()
    }]);
    if (error) return { success: false, error: error.message };
    return { success: true, data: { affected: 1 } };
}

export async function getInterestsForListing(listingId: string): Promise<QueryResult<UserInterest[]>> {
    const { data, error } = await supabase
        .from('UserInterests')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data.map(rowToUserInterest) };
}

export async function getUserSentInterests(userId: string): Promise<QueryResult<UserInterest[]>> {
    const { data, error } = await supabase
        .from('UserInterests')
        .select('*')
        .eq('renter_id', userId)
        .order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data.map(rowToUserInterest) };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getUserChats(userId: string): Promise<QueryResult<[string, number][]>> {
    // Fetch all messages involving this user, then group client-side
    const { data, error } = await supabase
        .from('Messages')
        .select('sender_id, receiver_id, read')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    if (error) return { success: false, error: error.message };

    const counts = new Map<string, number>();
    for (const row of data) {
        const otherId = row.sender_id === userId ? row.receiver_id : row.sender_id;
        if (!counts.has(otherId)) counts.set(otherId, 0);
        if (row.receiver_id === userId && row.read === 'False') {
            counts.set(otherId, counts.get(otherId)! + 1);
        }
    }

    const result: [string, number][] = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1]);
    return { success: true, data: result };
}

export async function getChatMessages(from_id: string, to_id: string): Promise<QueryResult> {
    const { data, error } = await supabase
        .from('Messages')
        .select('*')
        .or(`and(sender_id.eq.${from_id},receiver_id.eq.${to_id}),and(sender_id.eq.${to_id},receiver_id.eq.${from_id})`)
        .order('sent_at', { ascending: true });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data.map(rowToMessage) };
}

export async function sendMessage(message: Message): Promise<QueryResult> {
    const { error } = await supabase.from('Messages').insert([{
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        sent_at: message.sent_at,
        read: message.read
    }]);
    if (error) return { success: false, error: error.message };
    return { success: true, data: { affected: 1 } };
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from('Messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('read', 'False');
    if (error) return 0;
    return count ?? 0;
}
