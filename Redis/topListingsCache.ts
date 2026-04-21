// Caches the "top listings by interest count" aggregation from
// Queries/AggregationListingsByInterest.md — a multi-stage pipeline with a
// $lookup join against users. Expensive to run repeatedly; 5 min TTL is fine
// since rankings shift slowly.

import mongodb from 'mongodb';
import { cacheGet, cacheSet, cacheDel } from './redis.ts';

const KEY = 'top_listings_by_interest';
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
    const cacheKey = `${KEY}:${limit}`;
    const cached = await cacheGet<TopListing[]>(cacheKey);
    if (cached) return cached;

    const col = await getCollection();
    const docs = await col.aggregate([
        { $match: { $or: [{ is_active: 'TRUE' }, { is_active: true }, { is_active: '1' }, { is_active: 1 }] } },
        { $addFields: { interestCount: { $size: { $ifNull: ['$interests', []] } } } },
        { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'owner' } },
        { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
        { $project: { title: 1, city: 1, state: 1, rent_price: 1, interestCount: 1, 'owner.name': 1, 'owner.profile_photo': 1 } },
        { $sort: { interestCount: -1 } },
        { $limit: limit }
    ]).toArray();

    const results: TopListing[] = docs.map(d => ({
        listing_id: String(d._id),
        title: d.title ?? '',
        city: d.city ?? '',
        state: d.state ?? '',
        rent_price: String(d.rent_price ?? ''),
        interestCount: d.interestCount ?? 0,
        owner: d.owner ? { name: d.owner.name ?? '', profile_photo: d.owner.profile_photo ?? null } : null
    }));

    await cacheSet(cacheKey, results, TTL);
    return results;
}

// Call after createUserInterest so rankings reflect new interest activity
export async function invalidateTopListings(): Promise<void> {
    await cacheDel(KEY + ':10', KEY + ':25', KEY + ':50');
}
