# Roomie Match

**RoomieMatch** is a centralized roommate-finder database that connects people looking for housing and roommates in one system.

## Team

- Max Siebengartner
- Zain Rizvi

## Project Overview

RoomieMatch models how a roommate-finder platform stores:

- users
- listings
- preferences
- match activity

The system centralizes all data into one relational database so relationships are clear and easy to query. It supports preference matching, listing management, and user connection logs.

## Installation

1. Download the /MongoDump folder
2. Start MongoDB on a local port
3. Run `mongorestore --uri="mongodb://localhost:<port>/" --db roomie-match /path/to/MongoDump`
4. The 'Users', 'Listings', and 'Messages' collections will be created on your Mongo server

## Project Structure

```
MongoDump/              — MongoDB collection exports (binary BSON + JSON)
Queries/                — All MongoDB queries with titles and descriptions
Schemas/                — JSON document schemas for Users, Listings, Messages
Redis/
  redis.ts              — Redis client setup and generic cache helpers
  sessionCache.ts       — String: authenticated user session (7-day TTL)
  activeListingsCache.ts — String: active listing feed (60 s TTL)
  userChatsCache.ts     — String: chat inbox with unread counts (30 s TTL)
  chatMessagesCache.ts  — List: full message thread cache (10 min TTL)
  listingInterestedUsersCache.ts — Set: interested renter IDs per listing (5 min TTL)
  topListingsCache.ts   — Sorted Set: listings ranked by interest count (5 min TTL)
  DataStructure.md      — Redis design doc: data structures, commands, CRUD reference
src/
  server.ts             — Express API server with Redis-backed routes
  lib/db.server.ts      — MongoDB data access layer
  types/                — TypeScript entity and query types
Proposal.pdf            — Project requirements, UML, MongoDB schemas, and Redis design
```

## Redis

The `Redis/` folder contains all in-memory caching logic built on top of the MongoDB backend:

- `redis.ts` — client setup and generic `cacheGet` / `cacheSet` / `cacheDel` helpers
- `sessionCache.ts` — **String**: caches the authenticated user object on login (7-day TTL)
- `activeListingsCache.ts` — **String**: caches the active listings feed (60 s TTL)
- `userChatsCache.ts` — **String**: caches per-user chat inbox with unread counts (30 s TTL)
- `chatMessagesCache.ts` — **List**: caches full message threads in chronological order (10 min TTL)
- `listingInterestedUsersCache.ts` — **Set**: tracks unique renter IDs interested in a listing (5 min TTL)
- `topListingsCache.ts` — **Sorted Set**: ranks listings by total interest count (5 min TTL)
- `DataStructure.md` — design document describing each structure, its commands, and justification

### Redis Setup

1. Install and start Redis locally: `brew install redis && brew services start redis`
2. The server connects to `redis://localhost:6379` by default. Override with `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` env vars.

# Links
- ## [Video Demo (Youtube)](https://www.youtube.com/watch?v=vMWrUBoS8yA)
- ## [ERD & UML (LucidChart)](https://lucid.app/lucidchart/4a6c9e78-f4b4-46f5-9289-72106dd7cd9b/edit?invitationId=inv_93d4c3f4-1932-4f11-a77c-26275a2647cf)

## AI Disclosure

Parts of this project were developed with the assistance of AI tools (Claude by Anthropic). All code was reviewed, understood, and integrated by the team.
