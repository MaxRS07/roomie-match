# Redis Data Structures

## Types used in this project

- String
- List
- Set
- Sorted Set

## Why these data structures?

### Sorted Set

This is the primary data structure used for storing and managing the leaderboard. It allows us to maintain a sorted collection of players based on their scores, enabling efficient retrieval of top players and their ranks. For example, we can store the listing ids as unique members and their corresponding scores (e.g., total interest) in the sorted set. This allows us to easily retrieve the top N listings based on their scores.

**Set** — `topListingsCache.ts`
```ts
// Each listing_id is the member; its interest count is the score.
// ZADD writes all entries at once after the Mongo aggregation pipeline runs.
await redis.zAdd('listings:leaderboard', listings.map(l => ({
    score: l.interestCount,
    value: l.listing_id,
})));
await redis.expire('listings:leaderboard', 300);
```

**Get** — `topListingsCache.ts`
```ts
// REV flips to highest-score-first. Slicing 0 → limit-1 gives the top N.
const topIds = await redis.zRange('listings:leaderboard', 0, limit - 1, { REV: true });
// Full metadata is stored in a companion String key and fetched per ID.
const listing = JSON.parse(await redis.get(`listings:meta:${id}`) ?? 'null');
```

---

### String

Stores single ID values to prevent retrieval again, which costs the user time and the server resources. For example, we can use strings to store the last updated timestamp for each listing, allowing us to quickly check if the leaderboard needs to be updated without having to retrieve and compare scores.

**Set** — `sessionCache.ts`
```ts
// After login the full User object is JSON-encoded under session:{userId}
// with a 7-day expiry so the user stays logged in across browser sessions.
await redis.set(`session:${userId}`, JSON.stringify(user), { EX: 604800 });
```

**Get** — `sessionCache.ts`
```ts
// On every authenticated request the server reads the sessionId cookie,
// looks up this key, and parses the User back out.
const raw = await redis.get(`session:${userId}`);
const user = raw ? (JSON.parse(raw) as User) : null;
```

---

### List

An ordered sequence of strings, append-only from either end. Used here to cache a conversation's message thread in chronological order so repeated chat fetches skip Mongo entirely.

**Set** — `chatMessagesCache.ts`
```ts
// RPUSH appends to the tail, preserving the sort({ sent_at: 1 }) order
// from the Mongo query. All messages are written in one call.
await redis.rPush(`chat:${[fromId, toId].sort().join(':')}`, messages.map(m => JSON.stringify(m)));
await redis.expire(cacheKey, 600);
```

**Get** — `chatMessagesCache.ts`
```ts
// LRANGE 0 -1 returns every element head-to-tail (the full thread).
const raw = await redis.lRange(`chat:${[fromId, toId].sort().join(':')}`, 0, -1);
const messages = raw.map(s => JSON.parse(s));
```

---

### Set

An unordered collection of unique strings. Used here to track which renters have expressed interest in a listing — guarantees no duplicates and gives O(1) membership checks without scanning the embedded interests array.

**Set** — `listingInterestedUsersCache.ts`
```ts
// All renter IDs from the listing's embedded interests array are added at
// once. Redis silently ignores any duplicates.
await redis.sAdd(`listing_interested_users:${listingId}`, renterIds);
await redis.expire(cacheKey, 300);
```

**Get** — `listingInterestedUsersCache.ts`
```ts
// Retrieve every interested renter for display on the listing detail page.
const members = await redis.sMembers(`listing_interested_users:${listingId}`);

// Or check a single user in O(1) before allowing a duplicate submission.
const alreadyApplied = await redis.sIsMember(`listing_interested_users:${listingId}`, userId);
```
