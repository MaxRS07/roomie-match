// Caches getUserChats() per user — this query fetches every message the user
// sent or received and counts unread in JS, making it O(n) on message volume.
// 30 s TTL keeps unread badges reasonably accurate without hammering Mongo.

import { getUserChats } from '../src/lib/db.server.ts';
import { cacheGet, cacheSet, cacheDel } from './redis.ts';
import type { QueryResult } from '../src/types/query.ts';

const key = (userId: string) => `user_chats:${userId}`;
const TTL = 30; // seconds

export async function getCachedUserChats(userId: string): Promise<QueryResult<[string, number][]>> {
    const cached = await cacheGet<[string, number][]>(key(userId));
    if (cached) return { success: true, data: cached };

    const result = await getUserChats(userId);
    if (result.success && result.data) {
        await cacheSet(key(userId), result.data, TTL);
    }
    return result;
}

// Invalidate both participants' chat caches whenever a message is sent or read
export async function invalidateUserChats(...userIds: string[]): Promise<void> {
    await cacheDel(...userIds.map(key));
}
