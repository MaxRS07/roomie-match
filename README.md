# Roomie Match

**RoomieMatch** is a centralized roommate-finder platform that connects people looking for housing and roommates. It uses **Redis** as a caching and session layer on top of MongoDB to reduce database load and improve response times for the most frequently accessed data.

## Team

- Max Siebengartner
- Zain Rizvi

## Project Overview

RoomieMatch manages users, listings, preferences, and match activity. Redis sits between the Express API and MongoDB, caching expensive or high-frequency queries so they don't hit the database on every request.

## Redis Caching Layer

All cache logic lives in the `/Redis` directory. Four Redis data structures are used — see [Redis/DataStructure.md](Redis/DataStructure.md) for the full breakdown with code samples.

| File | Structure | What it caches | TTL |
|---|---|---|---|
| `sessionCache.ts` | String | Authenticated user object, keyed by user ID | 7 days |
| `activeListingsCache.ts` | String | All active listings (global, shared across users) | 60s |
| `userChatsCache.ts` | String | Per-user unread message counts | 30s |
| `chatMessagesCache.ts` | List | Full message thread between two users | 10 min |
| `listingInterestedUsersCache.ts` | Set | Renter IDs who have applied to a listing | 5 min |
| `topListingsCache.ts` | Sorted Set | Listing leaderboard ranked by interest count | 5 min |

### Session Management

Authentication is handled entirely through Redis — no `localStorage`. On login, the server stores the user object in Redis and sets an `httpOnly` cookie (`sessionId`). Every subsequent request reads that cookie and resolves the session from Redis via `GET /api/session/me`. Logout calls `DELETE /api/session`, which clears both the cookie and the Redis key.

### Cache Invalidation

Each cache file exports an `invalidate*` function. These should be called after the relevant write operation:

- `invalidateActiveListings()` — after creating or updating a listing
- `invalidateUserChats(...userIds)` — after sending a message or marking messages read
- `invalidateChatMessages(fromId, toId)` — after sending a message
- `invalidateInterestedUsers(listingId)` — after a new interest is submitted
- `invalidateTopListings()` — after a new interest is submitted

## Installation

### Prerequisites

- Node.js
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`

### Setup

1. Restore the database:
```bash
mongorestore --uri="mongodb://localhost:27017/" --db roomie-match /path/to/MongoDump
```

2. Install dependencies:
```bash
npm install
```

3. Start the app (Vite frontend + Express API server):
```bash
npm run dev:all
```

The Vite dev server runs on `http://localhost:5173` and proxies all `/api/*` requests to the Express server on port `3000`.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(none)_ | Redis password if auth is enabled |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

## Project Structure

```
Redis/           cache files and data structure documentation
Queries/         MongoDB query references as markdown
Schemas/         document schemas for each collection
MongoDump/       database collections as BSON for mongorestore
src/
  lib/
    db.server.ts   direct MongoDB queries (server-side)
    db.ts          API client (browser-side)
  pages/           frontend page components
  server.ts        Express API server
```

## Links

- [Video Demo (YouTube)](https://www.youtube.com/watch?v=vMWrUBoS8yA)
- [ERD & UML (LucidChart)](https://lucid.app/lucidchart/4a6c9e78-f4b4-46f5-9289-72106dd7cd9b/edit?invitationId=inv_93d4c3f4-1932-4f11-a77c-26275a2647cf)
