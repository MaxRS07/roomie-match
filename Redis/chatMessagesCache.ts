// Redis List: recent messages for a conversation, ordered oldest→newest.
// RPUSH appends each message to the tail; LRANGE 0 -1 returns the full list.
// Keyed on the sorted pair of user IDs so both participants share one list.
// 10-minute TTL — conversations are re-fetched from Mongo on cache miss.

import mongodb, { ObjectId } from 'mongodb';
import { getClient, cacheDel } from './redis.ts';

const key = (a: string, b: string) => `chat:${[a, b].sort().join(':')}`;
const TTL = 600; // seconds

let _client: mongodb.MongoClient | null = null;

const getCollection = async () => {
    if (!_client) {
        _client = await new mongodb.MongoClient('mongodb://localhost:27017').connect();
    }
    return _client.db('roomie-match').collection('messages');
};

export type CachedMessage = {
    message_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    sent_at: string;
    read: string;
};

export async function getCachedChatMessages(fromId: string, toId: string): Promise<CachedMessage[]> {
    const redis = await getClient();
    const cacheKey = key(fromId, toId);

    // LRANGE returns all elements in the list, preserving insertion order
    const raw = await redis.lRange(cacheKey, 0, -1).catch(() => [] as string[]);
    if (raw.length > 0) return raw.map(s => JSON.parse(s) as CachedMessage);

    const fromOid = ObjectId.isValid(fromId) ? new ObjectId(fromId) : null;
    const toOid = ObjectId.isValid(toId) ? new ObjectId(toId) : null;
    const senderVals = [fromId, ...(fromOid ? [fromOid] : [])];
    const receiverVals = [toId, ...(toOid ? [toOid] : [])];

    const col = await getCollection();
    const docs = await col.find({
        $or: [
            { sender_id: { $in: senderVals }, receiver_id: { $in: receiverVals } },
            { sender_id: { $in: receiverVals }, receiver_id: { $in: senderVals } },
        ],
    }).sort({ sent_at: 1 }).toArray();

    const messages: CachedMessage[] = docs.map(d => ({
        message_id: String(d._id),
        sender_id: String(d.sender_id),
        receiver_id: String(d.receiver_id),
        content: d.content ?? '',
        sent_at: d.sent_at ?? '',
        read: String(d.read ?? 'False'),
    }));

    if (messages.length > 0) {
        // RPUSH appends to the tail — preserves chronological order
        await redis.rPush(cacheKey, messages.map(m => JSON.stringify(m)));
        await redis.expire(cacheKey, TTL);
    }

    return messages;
}

// Append a single new message without invalidating the whole list
export async function appendCachedMessage(fromId: string, toId: string, message: CachedMessage): Promise<void> {
    try {
        const redis = await getClient();
        const cacheKey = key(fromId, toId);
        const exists = await redis.exists(cacheKey);
        if (exists) {
            await redis.rPush(cacheKey, JSON.stringify(message));
            await redis.expire(cacheKey, TTL);
        }
    } catch {}
}

export async function invalidateChatMessages(fromId: string, toId: string): Promise<void> {
    await cacheDel(key(fromId, toId));
}
