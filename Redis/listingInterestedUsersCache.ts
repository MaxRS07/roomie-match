// Redis Set: the collection of renter IDs who have expressed interest in a
// listing. Sets give O(1) membership checks (e.g. "has this user already
// applied?") and automatic deduplication with no extra logic needed.
// 5-minute TTL — invalidated immediately on new interest or status change.

import mongodb, { ObjectId } from 'mongodb';
import { getClient, cacheDel } from './redis.ts';

const key = (listingId: string) => `listing_interested_users:${listingId}`;
const TTL = 300; // seconds

let _client: mongodb.MongoClient | null = null;

const getCollection = async () => {
    if (!_client) {
        _client = await new mongodb.MongoClient('mongodb://localhost:27017').connect();
    }
    return _client.db('roomie-match').collection('listings');
};

export async function getCachedInterestedUsers(listingId: string): Promise<string[]> {
    const redis = await getClient();
    const cacheKey = key(listingId);

    // SMEMBERS returns all members of the set (unordered)
    const members = await redis.sMembers(cacheKey).catch(() => [] as string[]);
    if (members.length > 0) return members;

    const oid = ObjectId.isValid(listingId) ? new ObjectId(listingId) : null;
    if (!oid) return [];

    const col = await getCollection();
    const doc = await col.findOne({ _id: oid }, { projection: { interests: 1 } });
    const renterIds: string[] = (doc?.interests ?? []).map((i: any) => String(i.renter_id));

    if (renterIds.length > 0) {
        // SADD adds all members at once; duplicates are silently ignored
        await redis.sAdd(cacheKey, renterIds);
        await redis.expire(cacheKey, TTL);
    }

    return renterIds;
}

// Check in O(1) whether a specific user has already applied
export async function isUserInterested(listingId: string, userId: string): Promise<boolean> {
    try {
        const redis = await getClient();
        return await redis.sIsMember(key(listingId), userId);
    } catch {
        return false;
    }
}

// Call after createUserInterest to keep the set in sync without a cache miss
export async function addInterestedUser(listingId: string, userId: string): Promise<void> {
    try {
        const redis = await getClient();
        const cacheKey = key(listingId);
        const exists = await redis.exists(cacheKey);
        if (exists) {
            await redis.sAdd(cacheKey, userId);
            await redis.expire(cacheKey, TTL);
        }
    } catch {}
}

export async function invalidateInterestedUsers(listingId: string): Promise<void> {
    await cacheDel(key(listingId));
}
