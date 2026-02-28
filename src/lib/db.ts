import type { User } from '../types/entities.js';
import type { QueryResult } from '../types/query.js';

const DATABASE_URL = 'http://localhost:8000';

// Convert database array row to User object
// Expected order: [user_id, name, email, password_hash, age, gender, occupation, bio, profile_photo, created_at]
function arrayToUser(row: any[]): User {
    return {
        user_id: row[0],
        name: row[1],
        email: row[2],
        password_hash: row[3],
        age: row[4],
        gender: row[5],
        occupation: row[6],
        bio: row[7],
        profile_photo: row[8],
        created_at: row[9]
    };
}

async function executeQuery<T = any>(
    query: string,
    params: any[] = []
): Promise<QueryResult<T>> {
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
        // Unwrap the API response - it returns {data: ...} 
        return { success: true, data: response_data.data };
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
    return executeQuery(
        'INSERT INTO Users (name, email, preferences) VALUES (?, ?, ?)',
        [name, email, JSON.stringify(preferences || {})]
    );
}

export async function updateUser(userId: string, userData: Partial<{ name: string; email: string; preferences: any }>) {
    const { name, email, preferences } = userData;
    return executeQuery(
        'UPDATE Users SET name = ?, email = ?, preferences = ? WHERE id = ?',
        [name, email, JSON.stringify(preferences || {}), userId]
    );
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
    return executeQuery('DELETE FROM Users WHERE id = ?', [userId]);
}

export async function getUserPreferences(userId: string) {
    return executeQuery('SELECT * FROM UserPreferences WHERE user_id = ?', [userId]);
}

export async function getProfilePhoto(userId: string): Promise<string | null> {
    const result = await executeQuery('SELECT * FROM ProfilePhoto WHERE user_id = ?', [userId]);
    if (result.success && result.data && result.data.length > 0) {
        return result.data[0][1];
    }
    return null;
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