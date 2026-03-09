import { arrayToUser, arrayToListing, arrayToUserInterest, type Message, type User, type Listing, type UserInterest } from '../types/entities.js';
import type { QueryResult } from '../types/query.js';

const DATABASE_URL = 'http://localhost:8000';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const queryCache = new Map<string, CacheEntry<any>>();

function generateCacheKey(query: string, params: any[]): string {
    return `${query}:${JSON.stringify(params)}`;
}

function getCachedQuery<T>(key: string): T | null {
    const entry = queryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_TTL) {
        queryCache.delete(key);
        return null;
    }

    return entry.data as T;
}

function setCachedQuery<T>(key: string, data: T): void {
    queryCache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(pattern?: string): void {
    if (!pattern) {
        queryCache.clear();
    } else {
        for (const key of queryCache.keys()) {
            if (key.includes(pattern)) {
                queryCache.delete(key);
            }
        }
    }
}

async function executeQuery<T = any>(
    query: string,
    params: any[] = [],
    useCache: boolean = true
): Promise<QueryResult<T>> {
    const cacheKey = generateCacheKey(query, params);

    // Check cache for read queries
    if (useCache) {
        const cached = getCachedQuery<T>(cacheKey);
        if (cached !== null) {
            return { success: true, data: cached };
        }
    }

    try {
        const response = await fetch(`${DATABASE_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, params })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const response_data = await response.json();
        const result = { success: true, data: response_data.data };

        // Cache successful read queries
        if (useCache) {
            setCachedQuery(cacheKey, response_data.data);
        }

        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Query error:', errorMessage);
        return { success: false, error: errorMessage };
    }
}

export async function getAllUsers() {
    return executeQuery('SELECT * FROM Users');
}

export async function getUserById(userId: string) {
    return executeQuery('SELECT * FROM Users WHERE user_id = ?', [userId]);
}

export async function createUser(userData: { name: string; email: string; preferences?: any }) {
    const { name, email, preferences } = userData;
    const result = await executeQuery(
        'INSERT INTO Users (name, email, preferences) VALUES (?, ?, ?)',
        [name, email, JSON.stringify(preferences || {})],
        false // Don't cache write operations
    );
    invalidateCache('Users'); // Invalidate related caches
    return result;
}

export async function updateUser(userId: string, userData: Partial<{ name: string; email: string; preferences: any }>) {
    const { name, email, preferences } = userData;
    const result = await executeQuery(
        'UPDATE Users SET name = ?, email = ?, preferences = ? WHERE id = ?',
        [name, email, JSON.stringify(preferences || {}), userId],
        false // Don't cache write operations
    );
    invalidateCache('Users'); // Invalidate related caches
    return result;
}
export async function authenticateUser(email: string, password: string) {
    const user = await executeQuery(
        'SELECT * FROM Users WHERE email = ? AND password_hash = ?',
        [email, password]
    );
    if (user.success && user.data && user.data.length > 0) {
        return { success: true, data: arrayToUser(user.data[0]) };
    } else {
        throw new Error('Authentication failed: Invalid email or password');
    }
}
export async function deleteUser(userId: string) {
    const result = await executeQuery('DELETE FROM Users WHERE id = ?', [userId], false);
    invalidateCache('Users'); // Invalidate related caches
    return result;
}

export async function getUserPreferences(userId: string) {
    return executeQuery('SELECT * FROM UserPreferences WHERE user_id = ?', [userId]);
}

export async function updateUserPreferences(userId: string, prefs: {
    cleanliness_level?: string;
    sleep_schedule?: string;
    pet_friendly?: string;
    smoking_allowed?: string;
    noise_tolerance?: string;
    guests_allowed?: string;
    work_schedule?: string;
}): Promise<QueryResult> {
    const result = await executeQuery(
        `UPDATE UserPreferences SET 
            cleanliness_level = ?, sleep_schedule = ?, pet_friendly = ?,
            smoking_allowed = ?, noise_tolerance = ?, guests_allowed = ?, work_schedule = ?
         WHERE user_id = ?`,
        [
            prefs.cleanliness_level ?? '', prefs.sleep_schedule ?? '', prefs.pet_friendly ?? '',
            prefs.smoking_allowed ?? '', prefs.noise_tolerance ?? '', prefs.guests_allowed ?? '',
            prefs.work_schedule ?? '', userId
        ],
        false
    );
    invalidateCache('UserPreferences');
    return result;
}

export async function updateUserProfile(userId: string, data: {
    name?: string;
    email?: string;
    age?: string;
    gender?: string;
    occupation?: string;
    bio?: string;
}): Promise<QueryResult> {
    const result = await executeQuery(
        `UPDATE User SET name = ?, email = ?, age = ?, gender = ?, occupation = ?, bio = ? WHERE user_id = ?`,
        [data.name ?? '', data.email ?? '', data.age ?? '', data.gender ?? '', data.occupation ?? '', data.bio ?? '', userId],
        false
    );
    invalidateCache('Users');
    // Also invalidate localStorage cache
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        localStorage.removeItem('user:' + authToken);
    }
    return result;
}

export async function updateProfilePhoto(userId: string, dataUrl: string): Promise<QueryResult> {
    // Try update first, then insert if no rows affected
    const result = await executeQuery(
        'UPDATE ProfilePhoto SET data = ? WHERE user_id = ?',
        [dataUrl, userId],
        false
    );
    invalidateCache('ProfilePhoto');
    return result;
}

export async function getProfilePhoto(userId: string): Promise<string | null> {
    const result = await executeQuery('SELECT data FROM ProfilePhoto WHERE user_id = ?', [userId]);
    if (result.success && result.data && result.data.length > 0) {
        return result.data[0][0];
    }
    return null;
}

export async function getUserChats(userId: string): Promise<QueryResult<[string, number][]>> {
    return executeQuery(`
        SELECT 
            sender_id, 
            SUM(CASE WHEN Messages.read = 'False' THEN 1 ELSE 0 END) AS unread_count
        FROM Messages
        WHERE receiver_id = ? OR sender_id = ?
        GROUP BY sender_id
        ORDER BY unread_count DESC, sender_id DESC;
    `, [userId, userId]);
}

export async function getChatMessages(from_id: string, to_id: string): Promise<QueryResult> {
    return executeQuery(`
        SELECT * FROM Messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY sent_at ASC;
    `, [from_id, to_id, to_id, from_id]);
}

export async function sendMessage(message: Message): Promise<QueryResult> {
    const result = await executeQuery(
        'INSERT INTO Messages (sender_id, receiver_id, content, sent_at, read) VALUES (?, ?, ?, ?, ?)',
        [message.sender_id, message.receiver_id, message.content, message.sent_at, message.read],
        false // Don't cache write operations
    );
    return result;
}

export async function getCurrentUser(): Promise<User | null> {
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        return null;
    }

    // Check if user data is cached in localStorage
    const cachedUser = localStorage.getItem('user:' + authToken);
    if (cachedUser) {
        return JSON.parse(cachedUser) as User;
    }

    const result = await getUserById(authToken);

    if (result.success && result.data && result.data.length > 0) {
        console.log('User data retrieved from database:', result.data[0]);
        const user = arrayToUser(result.data[0]);
        localStorage.setItem('user:' + authToken, JSON.stringify(user));
        return user;
    }
    return null;
}

export async function getActiveListings(): Promise<QueryResult<Listing[]>> {
    const result = await executeQuery(
        "SELECT * FROM Listings WHERE is_active = '1' ORDER BY created_at DESC"
    );
    console.log('Active listings query result:', result);
    if (result.success && result.data) {
        return { success: true, data: result.data.map(arrayToListing) };
    }
    return result;
}

export async function createUserInterest(renterId: string, listingId: string): Promise<QueryResult> {
    const result = await executeQuery(
        "INSERT INTO UserInterests (renter_id, listing_id, status, created_at) VALUES (?, ?, 'Pending', ?)",
        [renterId, listingId, Date.now()],
        false
    );
    invalidateCache('UserInterests');
    return result;
}

export async function getListingPhoto(listingId: string): Promise<string | null> {
    const result = await executeQuery('SELECT data FROM ListingPhotos WHERE listing_id = ?', [listingId]);
    if (result.success && result.data && result.data.length > 0) {
        return result.data[0][0];
    }
    return null;
}

export async function getUserListings(userId: string): Promise<QueryResult<Listing[]>> {
    const result = await executeQuery(
        'SELECT * FROM Listings WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
    );
    if (result.success && result.data) {
        return { success: true, data: result.data.map(arrayToListing) };
    }
    return result;
}

export async function getInterestsForListing(listingId: string): Promise<QueryResult<UserInterest[]>> {
    const result = await executeQuery(
        'SELECT * FROM UserInterests WHERE listing_id = ? ORDER BY created_at DESC',
        [listingId]
    );
    if (result.success && result.data) {
        return { success: true, data: result.data.map(arrayToUserInterest) };
    }
    return result;
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
    const result = await executeQuery(
        "SELECT COUNT(*) FROM Messages WHERE receiver_id = ? AND read = 'False'",
        [userId]
    );
    if (result.success && result.data && result.data.length > 0) {
        return Number(result.data[0][0]) || 0;
    }
    return 0;
}

export async function getUserSentInterests(userId: string): Promise<QueryResult<UserInterest[]>> {
    const result = await executeQuery(
        'SELECT * FROM UserInterests WHERE renter_id = ? ORDER BY created_at DESC',
        [userId]
    );
    if (result.success && result.data) {
        return { success: true, data: result.data.map(arrayToUserInterest) };
    }
    return result;
}