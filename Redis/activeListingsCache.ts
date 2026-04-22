// Caches getActiveListings() — the most-read query in the app.
// Full-collection scans with a 4-way $or on is_active make this expensive
// under any real load; 60 s TTL keeps the listing grid fresh enough.

import { getActiveListings } from '../src/lib/db.server.ts';
import { cacheGet, cacheSet, cacheDel } from './redis.ts';
import type { Listing } from '../src/types/entities.ts';
import type { QueryResult } from '../src/types/query.ts';

const KEY = 'active_listings';
const TTL = 60; // seconds

export async function getCachedActiveListings(): Promise<QueryResult<Listing[]>> {
    const cached = await cacheGet<Listing[]>(KEY);
    if (cached) return { success: true, data: cached };

    const result = await getActiveListings();
    if (result.success && result.data) {
        await cacheSet(KEY, result.data, TTL);
    }
    return result;
}

// Call after createListing / updateListing so the cache doesn't serve stale data
export async function invalidateActiveListings(): Promise<void> {
    await cacheDel(KEY);
}
