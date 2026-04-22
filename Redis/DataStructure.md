# Redis Data Structures

## Overview

RoomieMatch uses four Redis data structures as a caching layer on top of MongoDB. Each structure was chosen based on the access pattern it serves:

| Structure | Key pattern | Use case | TTL |
|---|---|---|---|
| **String** | `session:{userId}` | Authenticated user object | 7 days |
| **String** | `active_listings` | Active listing feed | 60 s |
| **String** | `user_chats:{userId}` | Chat inbox with unread counts | 30 s |
| **String** | `listings:meta:{listingId}` | Listing metadata companion | 5 min |
| **List** | `chat:{userA}:{userB}` | Full message thread | 10 min |
| **Set** | `listing_interested_users:{listingId}` | Renter IDs interested in a listing | 5 min |
| **Sorted Set** | `listings:leaderboard` | Listings ranked by interest count | 5 min |

---

## 1. Sorted Set — Top Listings Leaderboard

**Why:** The "top listings" query runs a 5-stage MongoDB aggregation pipeline (`$match` → `$addFields` → `$lookup` → `$unwind` → `$sort`). Under any real load this is expensive to repeat on every page load. A Redis Sorted Set stores listing IDs as members and their interest count as the score, giving O(log N) reads.

**Key:** `listings:leaderboard`
**Member:** `listing_id`
**Score:** total interest count

### Initialize
```redis
FLUSHALL
```

### Create — populate leaderboard after Mongo aggregation
```redis
ZADD listings:leaderboard 5 "listingId_A"
ZADD listings:leaderboard 3 "listingId_B"
ZADD listings:leaderboard 1 "listingId_C"
EXPIRE listings:leaderboard 300
```

### Read — get top 10 listings, highest interest first
```redis
ZRANGE listings:leaderboard 0 9 REV
```

### Update — increment score when a user expresses interest
```redis
ZINCRBY listings:leaderboard 1 "listingId_A"
```

### Delete — remove a single listing (e.g. listing deactivated)
```redis
ZREM listings:leaderboard "listingId_A"
```
Delete the entire leaderboard to force a fresh rebuild:
```redis
DEL listings:leaderboard
```

**TypeScript (node-redis) — `topListingsCache.ts`:**
```ts
// Create / rebuild
await redis.zAdd('listings:leaderboard', listings.map(l => ({
    score: l.interestCount,
    value: l.listing_id,
})));
await redis.expire('listings:leaderboard', 300);

// Read top N
const topIds = await redis.zRange('listings:leaderboard', 0, limit - 1, { REV: true });

// Update
await redis.zIncrBy('listings:leaderboard', 1, listingId);

// Delete
await redis.del('listings:leaderboard');
```

---

## 2. String — JSON Cache (Sessions, Listings, Chats)

**Why:** Redis Strings store any binary-safe value up to 512 MB. We JSON-encode objects and store them under a predictable key with a TTL, trading a small amount of staleness for a large reduction in database reads on the three most frequent queries in the app.

### 2a. User Session — `session:{userId}`

After login, the full User object is cached so the server never hits MongoDB to verify a session cookie.

**TTL:** 7 days (604800 s)

#### Initialize
```redis
FLUSHALL
```

#### Create — on successful login
```redis
SET session:abc123 "{\"name\":\"Zain\",\"email\":\"z@example.com\"}" EX 604800
```

#### Read — on every authenticated request
```redis
GET session:abc123
```

#### Update — after profile edit (overwrites and resets TTL)
```redis
SET session:abc123 "{\"name\":\"Zain Rizvi\",\"email\":\"z@example.com\"}" EX 604800
```

#### Delete — on logout
```redis
DEL session:abc123
```

**TypeScript — `sessionCache.ts`:**
```ts
// Create / Update
await redis.set(`session:${userId}`, JSON.stringify(user), { EX: 604800 });
// Read
const raw = await redis.get(`session:${userId}`);
// Delete
await redis.del(`session:${userId}`);
```

---

### 2b. Active Listings Cache — `active_listings`

The listings feed is the most-read endpoint; re-running the full collection scan on every visitor is wasteful. A 60-second TTL keeps results fresh while absorbing burst traffic.

**TTL:** 60 s

#### Create
```redis
SET active_listings "[{\"listing_id\":\"1\",\"title\":\"Sunny Room\"}]" EX 60
```

#### Read
```redis
GET active_listings
```

#### Update (replace with fresh data)
```redis
SET active_listings "[{\"listing_id\":\"1\",\"title\":\"Updated Room\"}]" EX 60
```

#### Delete (invalidate after a new listing or interest is created)
```redis
DEL active_listings
```

**TypeScript — `activeListingsCache.ts`:**
```ts
// Read with Mongo fallback
const cached = await redis.get('active_listings');
if (cached) return JSON.parse(cached);
// … fetch from Mongo, then:
await redis.set('active_listings', JSON.stringify(listings), { EX: 60 });
// Invalidate
await redis.del('active_listings');
```

---

### 2c. User Chats Cache — `user_chats:{userId}`

The chat inbox query fetches every message the user sent or received and counts unread in JavaScript — O(n) on message volume. A short 30-second TTL keeps the unread badge accurate.

**TTL:** 30 s

#### Create
```redis
SET user_chats:abc123 "[[\"userId2\",3],[\"userId3\",0]]" EX 30
```

#### Read
```redis
GET user_chats:abc123
```

#### Update
```redis
SET user_chats:abc123 "[[\"userId2\",4],[\"userId3\",0]]" EX 30
```

#### Delete (invalidate when a message is sent or read)
```redis
DEL user_chats:abc123
```

---

## 3. List — Chat Message Thread

**Why:** A Redis List is an ordered sequence that supports O(1) appends at either end. We use it to cache a full conversation thread in chronological order. New messages are appended with `RPUSH` without re-fetching from Mongo, and `LRANGE 0 -1` returns the full thread in a single command.

**Key:** `chat:{sorted(userA, userB)}` — sorted so both participants share one key.
**TTL:** 10 min (600 s)

### Initialize
```redis
FLUSHALL
```

### Create — populate after first Mongo fetch
```redis
RPUSH chat:abc123:xyz456 "{\"content\":\"Hey!\",\"sent_at\":\"...\"}"
RPUSH chat:abc123:xyz456 "{\"content\":\"Hi back!\",\"sent_at\":\"...\"}"
EXPIRE chat:abc123:xyz456 600
```

### Read — full thread
```redis
LRANGE chat:abc123:xyz456 0 -1
```

### Update — append a new message without a Mongo round-trip
```redis
RPUSH chat:abc123:xyz456 "{\"content\":\"New message\",\"sent_at\":\"...\"}"
EXPIRE chat:abc123:xyz456 600
```

### Delete — drop the cache to force a fresh fetch
```redis
DEL chat:abc123:xyz456
```

**TypeScript — `chatMessagesCache.ts`:**
```ts
// Create
await redis.rPush(cacheKey, messages.map(m => JSON.stringify(m)));
await redis.expire(cacheKey, 600);
// Read
const raw = await redis.lRange(cacheKey, 0, -1);
// Update (append single message)
await redis.rPush(cacheKey, JSON.stringify(newMessage));
// Delete
await redis.del(cacheKey);
```

---

## 4. Set — Interested Users per Listing

**Why:** A Redis Set is an unordered collection of unique strings. We use it to track which renters have expressed interest in a listing. `SISMEMBER` gives an O(1) duplicate check before a new interest is written to Mongo, and `SMEMBERS` returns all interested renter IDs for display.

**Key:** `listing_interested_users:{listingId}`
**Members:** renter user IDs
**TTL:** 5 min (300 s)

### Initialize
```redis
FLUSHALL
```

### Create — populate from Mongo on first request
```redis
SADD listing_interested_users:listing1 "userId_A" "userId_B" "userId_C"
EXPIRE listing_interested_users:listing1 300
```

### Read — all interested renters
```redis
SMEMBERS listing_interested_users:listing1
```
Check if a specific user has already applied (O(1)):
```redis
SISMEMBER listing_interested_users:listing1 "userId_A"
```

### Update — add a new interested renter
```redis
SADD listing_interested_users:listing1 "userId_D"
EXPIRE listing_interested_users:listing1 300
```

### Delete — remove a single renter (interest withdrawn)
```redis
SREM listing_interested_users:listing1 "userId_A"
```
Delete the entire set (full cache invalidation):
```redis
DEL listing_interested_users:listing1
```

**TypeScript — `listingInterestedUsersCache.ts`:**
```ts
// Create
await redis.sAdd(cacheKey, renterIds);
await redis.expire(cacheKey, 300);
// Read all
const members = await redis.sMembers(cacheKey);
// Read single membership check
const alreadyApplied = await redis.sIsMember(cacheKey, userId);
// Update
await redis.sAdd(cacheKey, userId);
// Delete member
await redis.sRem(cacheKey, userId);
// Delete set
await redis.del(cacheKey);
```
