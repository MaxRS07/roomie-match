// Stores authenticated user sessions. The session key is the user's ID.
// The Express server sets an httpOnly cookie containing the user ID on login;
// each request reads that cookie and looks up the full User object here.

import { cacheGet, cacheSet, cacheDel } from './redis.ts';
import type { User } from '../src/types/entities.ts';

const key = (userId: string) => `session:${userId}`;
const TTL = 7 * 24 * 60 * 60; // 7 days

export async function setSession(userId: string, user: User): Promise<void> {
    await cacheSet(key(userId), user, TTL);
}

export async function getSession(userId: string): Promise<User | null> {
    return cacheGet<User>(key(userId));
}

export async function deleteSession(userId: string): Promise<void> {
    await cacheDel(key(userId));
}
