import type { User } from '../types/entities.js';
import type { QueryResult } from '../types/query.js';

const DATABASE_URL = 'http://localhost:8000';

async function executeQuery<T = any>(
    query: string,
    params: any[] = []
): Promise<QueryResult<T>> {
    try {
        console.log('Executing query:', query, 'with params:', params);

        const response = await fetch(`${DATABASE_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, params })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Query error:', errorMessage);
        return { success: false, error: errorMessage };
    }
}

export async function getAllUsers() {
    return executeQuery('SELECT * FROM Users');
}

export async function getUserById(userId: number) {
    return executeQuery('SELECT * FROM Users WHERE id = ?', [userId]);
}

export async function createUser(userData: { name: string; email: string; preferences?: any }) {
    const { name, email, preferences } = userData;
    return executeQuery(
        'INSERT INTO Users (name, email, preferences) VALUES (?, ?, ?)',
        [name, email, JSON.stringify(preferences || {})]
    );
}

export async function updateUser(userId: number, userData: Partial<{ name: string; email: string; preferences: any }>) {
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
    if (user.success && user.data.length > 0) {
        return { success: true, data: user.data[0] as User };
    } else {
        throw new Error('Authentication failed: Invalid email or password');
    }
}
export async function deleteUser(userId: number) {
    return executeQuery('DELETE FROM Users WHERE id = ?', [userId]);
}