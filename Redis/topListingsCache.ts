// Redis Sorted Set: listings ranked by interest count.
// Each member is the listing_id; the score is the interest count.
// ZADD writes scores; ZRANGE with REV + LIMIT returns the top N in one call.
// Full listing metadata is stored in a companion hash keyed by listing_id.
// 5-minute TTL on both the sorted set and each hash.

import mongodb from 'mongodb';
import { getClient, cacheDel } from './redis.ts';

const LEADERBOARD_KEY = 'listings:leaderboard';
const metaKey = (id: string) => `listings:meta:${id}`;
const TTL = 300; // seconds

let _client: mongodb.MongoClient | null = null;

const getCollection = async () => {
    if (!_client) {
        _client = await new mongodb.MongoClient('mongodb://localhost:27017').connect();
    }
    return _client.db('roomie-match').collection('listings');
};

export type TopListing = {
    listing_id: string;
    title: string;
    city: string;
    state: string;
    rent_price: string;
    interestCount: number;
    owner: { name: string; profile_photo: string | null } | null;
};

export async function getCachedTopListings(limit = 10): Promise<TopListing[]> {
    const redis = await getClient();

    // ZRANGE with REV returns members highest-score-first; LIMIT offsets within that
    const ids = await redis
        .zRange(LEADERBOARD_KEY, 0, limit - 1, { REV: true })
        .catch(() => [] as string[]);

    if (ids.length > 0) {
        const results: TopListing[] = [];
        for (const id of ids) {
            const raw = await redis.get(metaKey(id)).catch(() => null);
            if (raw) results.push(JSON.parse(raw) as TopListing);
        }
        if (results.length === ids.length) return results;
    }

    // Cache miss — run the aggregation pipeline and rebuild
    const col = await getCollection();
    const docs = await col.aggregate([
        { $match: { $or: [{ is_active: 'TRUE' }, { is_active: true }, { is_active: '1' }, { is_active: 1 }] } },
        { $addFields: { interestCount: { $size: { $ifNull: ['$interests', []] } } } },
        { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'owner' } },
        { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
        { $project: { title: 1, city: 1, state: 1, rent_price: 1, interestCount: 1, 'owner.name': 1, 'owner.profile_photo': 1 } },
        { $sort: { interestCount: -1 } },
        { $limit: limit },
    ]).toArray();

    const listings: TopListing[] = docs.map(d => ({
        listing_id: String(d._id),
        title: d.title ?? '',
        city: d.city ?? '',
        state: d.state ?? '',
        rent_price: String(d.rent_price ?? ''),
        interestCount: d.interestCount ?? 0,
        owner: d.owner ? { name: d.owner.name ?? '', profile_photo: d.owner.profile_photo ?? null } : null,
    }));

    if (listings.length > 0) {
        // ZADD writes { score, value } pairs into the sorted set
        await redis.zAdd(LEADERBOARD_KEY, listings.map(l => ({
            score: l.interestCount,
            value: l.listing_id,
        })));
        await redis.expire(LEADERBOARD_KEY, TTL);

        // Store full metadata in a plain string key per listing
        for (const listing of listings) {
            await redis.set(metaKey(listing.listing_id), JSON.stringify(listing), { EX: TTL });
        }
    }

    return listings;
}

// Call after createUserInterest so rankings reflect new interest activity
export async function invalidateTopListings(): Promise<void> {
    const redis = await getClient();
    const ids = await redis.zRange(LEADERBOARD_KEY, 0, -1).catch(() => [] as string[]);
    await cacheDel(LEADERBOARD_KEY, ...ids.map(metaKey));
}
