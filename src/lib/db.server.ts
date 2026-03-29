import {
    rowToUser, rowToListing, rowToUserInterest, rowToUserPreferences, rowToMessage,
    type Message, type User, type Listing, type UserInterest
} from '../types/entities.ts';
import type { QueryResult } from '../types/query.ts';
import mongodb, { ObjectId } from 'mongodb';
import { UUID } from 'mongodb';

type MongoDoc = Record<string, any>;

// ─── Connection Pool ──────────────────────────────────────────────────────────

let _client: mongodb.MongoClient | null = null;

const getClient = async (): Promise<mongodb.MongoClient | null> => {
    if (_client) return _client;
    try {
        _client = await new mongodb.MongoClient('mongodb://localhost:27017').connect();
        return _client;
    } catch {
        console.error('Failed to connect to MongoDB at mongodb://localhost:27017');
        return null;
    }
};

const getDb = async (): Promise<mongodb.Db | null> => {
    const client = await getClient();
    return client ? client.db('roomie-match') : null;
};

const usersCollection = async (): Promise<mongodb.Collection | null> => {
    const db = await getDb();
    return db ? db.collection('users') : null;
};

const listingsCollection = async (): Promise<mongodb.Collection | null> => {
    const db = await getDb();
    return db ? db.collection('listings') : null;
};

const messagesCollection = async (): Promise<mongodb.Collection | null> => {
    const db = await getDb();
    return db ? db.collection('messages') : null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toObjectId = (id: string): mongodb.ObjectId | null => (
    mongodb.ObjectId.isValid(id) ? new mongodb.ObjectId(id) : null
);

const docId = (doc: MongoDoc): string => String(doc._id ?? '');

const normalizePreferenceRow = (user: MongoDoc): MongoDoc => {
    const prefs = user.preferences ?? {};
    return {
        preference_id: prefs.preference_id ?? docId(user),
        user_id: docId(user),
        cleanliness_level: prefs.cleanliness_level ?? '',
        sleep_schedule: prefs.sleep_schedule ?? '',
        pet_friendly: prefs.pet_friendly ?? '',
        smoking_allowed: prefs.smoking_allowed ?? '',
        noise_tolerance: prefs.noise_tolerance ?? '',
        guests_allowed: prefs.guests_allowed ?? '',
        work_schedule: prefs.work_schedule ?? ''
    };
};

const normalizeListing = (doc: MongoDoc): MongoDoc => ({
    listing_id: docId(doc),
    user_id: String(doc.user_id ?? ''),
    title: doc.title ?? '',
    description: doc.description ?? '',
    rent_price: String(doc.rent_price ?? ''),
    location: doc.location ?? '',
    city: doc.city ?? '',
    state: doc.state ?? '',
    zip_code: doc.zip_code ?? '',
    available_date: doc.available_date ?? '',
    num_rooms: String(doc.num_rooms ?? ''),
    num_bathrooms: String(doc.num_bathrooms ?? ''),
    is_active: doc.is_active ?? 'FALSE',
    created_at: doc.created_at ?? Date.now()
});

const normalizeInterest = (doc: MongoDoc, listingId: string): MongoDoc => ({
    interest_id: docId(doc) || doc.interest_id || new UUID().toString(),
    renter_id: String(doc.renter_id ?? ''),
    listing_id: listingId,
    status: doc.status ?? 'Pending',
    created_at: doc.created_at ?? Date.now()
});

const normalizeMessage = (doc: MongoDoc): MongoDoc => ({
    message_id: docId(doc),
    sender_id: String(doc.sender_id ?? ''),
    receiver_id: String(doc.receiver_id ?? ''),
    content: doc.content ?? '',
    sent_at: doc.sent_at ?? new Date().toISOString(),
    read: typeof doc.read === 'boolean' ? (doc.read ? 'True' : 'False') : (doc.read ?? 'False')
});

const isUnread = (value: unknown): boolean => {
    if (typeof value === 'boolean') return value === false;
    if (typeof value === 'string') return value.toLowerCase() === 'false';
    return false;
};

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<QueryResult<User[]>> {
    const col = await usersCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const data = await col.find().toArray();
        return { success: true, data: data.map(d => rowToUser({ ...d, user_id: docId(d) })) };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getUserById(userId: string): Promise<QueryResult<User[]>> {
    const col = await usersCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(userId);
        if (!oid) return { success: false, error: 'Invalid user id' };
        const data = await col.findOne({ _id: oid });
        if (!data) return { success: false, error: 'User not found' };
        return { success: true, data: [rowToUser({ ...data, user_id: docId(data) })] };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function createUser(userData: {
    name: string; email: string; password_hash: string;
    age?: string; gender?: string; occupation?: string; bio?: string;
}): Promise<QueryResult> {
    const col = await usersCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const doc = { ...userData, created_at: Date.now(), preferences: {} };
        const result = await col.insertOne(doc);
        return { success: true, data: [rowToUser({ ...doc, _id: result.insertedId, user_id: String(result.insertedId) })] };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function updateUser(userId: string, userData: Partial<{ name: string; email: string; preferences: any }>): Promise<QueryResult> {
    const col = await usersCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(userId);
        if (!oid) return { success: false, error: 'Invalid user id' };
        const result = await col.findOneAndUpdate({ _id: oid }, { $set: userData }, { returnDocument: 'after' });
        if (!result) return { success: false, error: 'User not found' };
        return { success: true, data: [rowToUser({ ...result, user_id: docId(result) })] };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function updateUserProfile(userId: string, data: {
    name?: string; email?: string; age?: string; gender?: string; occupation?: string; bio?: string;
}): Promise<QueryResult> {
    const col = await usersCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(userId);
        if (!oid) return { success: false, error: 'Invalid user id' };
        const result = await col.updateOne({ _id: oid }, { $set: data });
        if (result.matchedCount === 0) return { success: false, error: 'User not found' };
        return { success: true, data: { affected: result.modifiedCount } };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function deleteUser(userId: string): Promise<QueryResult> {
    const col = await usersCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(userId);
        if (!oid) return { success: false, error: 'Invalid user id' };
        const result = await col.deleteOne({ _id: oid });
        if (result.deletedCount === 0) return { success: false, error: 'User not found' };
        return { success: true, data: { affected: result.deletedCount } };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function authenticateUser(email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const col = await usersCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const data = await col.findOne({ email });
        if (!data) return { success: false, error: 'User not found' };
        if (password !== data.password_hash) return { success: false, error: 'Invalid password' };
        return { success: true, data: rowToUser({ ...data, user_id: docId(data) }) };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

// ─── User Preferences ─────────────────────────────────────────────────────────

export async function getUserPreferences(userId: string): Promise<QueryResult> {
    const col = await usersCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(userId);
        if (!oid) return { success: false, error: 'Invalid user id' };
        const data = await col.findOne({ _id: oid }, { projection: { _id: 1, preferences: 1 } });
        if (!data) return { success: false, error: 'User not found' };
        return { success: true, data: [rowToUserPreferences(normalizePreferenceRow(data))] };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function updateUserPreferences(userId: string, prefs: {
    cleanliness_level?: string; sleep_schedule?: string; pet_friendly?: string;
    smoking_allowed?: string; noise_tolerance?: string; guests_allowed?: string; work_schedule?: string;
}): Promise<QueryResult> {
    const col = await usersCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(userId);
        if (!oid) return { success: false, error: 'Invalid user id' };
        const result = await col.updateOne({ _id: oid }, { $set: { preferences: prefs } });
        if (result.matchedCount === 0) return { success: false, error: 'User not found' };
        return { success: true, data: { affected: result.modifiedCount } };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function getProfilePhoto(userId: string): Promise<string | null> {
    const col = await usersCollection();
    if (!col) return null;
    try {
        const oid = toObjectId(userId);
        if (!oid) return null;
        const data = await col.findOne({ _id: oid }, { projection: { profile_photo: 1 } });
        return data?.profile_photo ?? null;
    } catch {
        return null;
    }
}

export async function updateProfilePhoto(userId: string, dataUrl: string): Promise<QueryResult> {
    const col = await usersCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(userId);
        if (!oid) return { success: false, error: 'Invalid user id' };
        const result = await col.updateOne({ _id: oid }, { $set: { profile_photo: dataUrl } });
        if (result.matchedCount === 0) return { success: false, error: 'User not found' };
        return { success: true, data: { affected: result.modifiedCount } };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getListingPhoto(listingId: string): Promise<string | null> {
    const col = await listingsCollection();
    if (!col) return null;
    try {
        const oid = toObjectId(listingId);
        if (!oid) return null;
        const doc = await col.findOne({ _id: oid }, { projection: { photos: 1, photo_data: 1 } });
        if (!doc) return null;
        // photos is an array of base64 strings from the port script
        if (Array.isArray(doc.photos) && doc.photos.length > 0) return doc.photos[0];
        return doc.photo_data ?? null;
    } catch {
        return null;
    }
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function getActiveListings(): Promise<QueryResult<Listing[]>> {
    const col = await listingsCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        // is_active may be stored as 'TRUE'/'FALSE' string or boolean
        const docs = await col.find({
            $or: [
                { is_active: 'TRUE' },
                { is_active: true },
                { is_active: '1' },
                { is_active: 1 }
            ]
        }).sort({ created_at: -1 }).toArray();
        return { success: true, data: docs.map(d => rowToListing(normalizeListing(d))) };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getUserListings(userId: string): Promise<QueryResult<Listing[]>> {
    const col = await listingsCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(userId);
        // user_id in listings may be stored as ObjectId or string (_supabase_id era)
        const query = oid
            ? { $or: [{ user_id: oid }, { user_id: userId }] }
            : { user_id: userId };
        const docs = await col.find(query).sort({ created_at: -1 }).toArray();
        return { success: true, data: docs.map(d => rowToListing(normalizeListing(d))) };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function createListing(userId: string, listingData: {
    title: string; description: string; rent_price: string; location: string;
    city: string; state: string; zip_code: string; available_date: string;
    num_rooms: string; num_bathrooms: string;
}): Promise<QueryResult<Listing[]>> {
    const col = await listingsCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(userId);
        const doc = {
            ...listingData,
            user_id: oid ?? userId,
            is_active: 'TRUE',
            interests: [],
            photos: [],
            created_at: Date.now()
        };
        const result = await col.insertOne(doc);
        return { success: true, data: [rowToListing(normalizeListing({ ...doc, _id: result.insertedId }))] };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function updateListing(listingId: string, data: Partial<{
    title: string; description: string; rent_price: string; location: string;
    city: string; state: string; zip_code: string; available_date: string;
    num_rooms: string; num_bathrooms: string; is_active: string;
}>): Promise<QueryResult> {
    const col = await listingsCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(listingId);
        if (!oid) return { success: false, error: 'Invalid listing id' };
        const result = await col.updateOne({ _id: oid }, { $set: data });
        if (result.matchedCount === 0) return { success: false, error: 'Listing not found' };
        return { success: true, data: { affected: result.modifiedCount } };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

// ─── User Interests ───────────────────────────────────────────────────────────
// Interests are stored as an embedded array inside each listing document.

export async function createUserInterest(renterId: string, listingId: string): Promise<QueryResult> {
    const col = await listingsCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(listingId);
        if (!oid) return { success: false, error: 'Invalid listing id' };
        const payload = {
            _id: new mongodb.ObjectId(),
            renter_id: renterId,
            status: 'Pending',
            created_at: Date.now()
        };
        const result = await col.updateOne({ _id: oid }, { $push: { interests: payload } as any });
        if (result.matchedCount === 0) return { success: false, error: 'Listing not found' };
        return { success: true, data: { affected: result.modifiedCount } };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getInterestsForListing(listingId: string): Promise<QueryResult<UserInterest[]>> {
    const col = await listingsCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(listingId);
        if (!oid) return { success: true, data: [] };
        const doc = await col.findOne({ _id: oid }, { projection: { interests: 1 } });
        if (!doc) return { success: true, data: [] };
        const interests = (doc.interests ?? []).map((i: MongoDoc) => rowToUserInterest(normalizeInterest(i, listingId)));
        interests.sort((a: UserInterest, b: UserInterest) => b.created_at - a.created_at);
        return { success: true, data: interests };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getUserSentInterests(userId: string): Promise<QueryResult<UserInterest[]>> {
    const col = await listingsCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        // renter_id may be stored as ObjectId or string
        const oid = toObjectId(userId);
        const query = oid
            ? { $or: [{ 'interests.renter_id': oid }, { 'interests.renter_id': userId }] }
            : { 'interests.renter_id': userId };

        const docs = await col.find(query, { projection: { _id: 1, interests: 1 } }).toArray();
        const sent: UserInterest[] = [];

        for (const listing of docs) {
            const listingId = docId(listing);
            for (const interest of (listing.interests ?? [])) {
                const rid = String(interest.renter_id ?? '');
                if (rid === userId || (oid && rid === String(oid))) {
                    sent.push(rowToUserInterest(normalizeInterest(interest, listingId)));
                }
            }
        }

        sent.sort((a, b) => b.created_at - a.created_at);
        return { success: true, data: sent };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

// ─── Messages ─────────────────────────────────────────────────────────────────
// Messages are stored in a separate 'messages' collection.

export async function getConversationWithProfiles(userAId: string, userBId: string) {
    const messages = await messagesCollection();
    const users = await usersCollection();
    if (!messages || !users) throw new Error('Failed to connect to database');

    const aOid = new ObjectId(userAId);
    const bOid = new ObjectId(userBId);

    // Find 1: fetch both user profiles in a single query using $in
    const profiles = await users.find(
        { _id: { $in: [aOid, bOid] } },
        { projection: { _id: 1, name: 1, profile_photo: 1 } }
    ).toArray();

    // Index by string id for O(1) lookup when annotating messages
    const profileMap = new Map(
        profiles.map(p => [p._id.toString(), p])
    );

    // Find 2: all messages between the two users in either direction
    const thread = await messages.find(
        {
            $or: [
                { sender_id: aOid, receiver_id: bOid },
                { sender_id: bOid, receiver_id: aOid }
            ]
        },
        {
            projection: { content: 1, sent_at: 1, read: 1, sender_id: 1, receiver_id: 1 },
            sort: { sent_at: 1 }
        }
    ).toArray();

    // Annotate each message with sender/receiver profile data in JS
    // -- avoids a third round trip or a $lookup
    return thread.map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id.toString()) ?? null,
        receiver: profileMap.get(msg.receiver_id.toString()) ?? null
    }));
}

export async function getUserChats(userId: string): Promise<QueryResult<[string, number][]>> {
    const col = await messagesCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const oid = toObjectId(userId);
        const idMatch = oid
            ? { $or: [{ sender_id: oid }, { sender_id: userId }, { receiver_id: oid }, { receiver_id: userId }] }
            : { $or: [{ sender_id: userId }, { receiver_id: userId }] };

        const docs = await col.find(idMatch, { projection: { sender_id: 1, receiver_id: 1, read: 1 } }).toArray();
        const counts = new Map<string, number>();

        for (const msg of docs) {
            const sid = String(msg.sender_id ?? '');
            const rid = String(msg.receiver_id ?? '');
            const isSender = sid === userId || (oid && sid === String(oid));
            const isReceiver = rid === userId || (oid && rid === String(oid));

            if (isSender) {
                if (!counts.has(rid)) counts.set(rid, 0);
            } else if (isReceiver) {
                if (!counts.has(sid)) counts.set(sid, 0);
                if (isUnread(msg.read)) counts.set(sid, counts.get(sid)! + 1);
            }
        }

        return { success: true, data: Array.from(counts.entries()).sort((a, b) => b[1] - a[1]) };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getChatMessages(from_id: string, to_id: string): Promise<QueryResult> {
    const col = await messagesCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const fromOid = toObjectId(from_id);
        const toOid = toObjectId(to_id);

        const senderValues = [from_id, ...(fromOid ? [fromOid] : [])];
        const receiverValues = [to_id, ...(toOid ? [toOid] : [])];

        const docs = await col.find({
            $or: [
                { sender_id: { $in: senderValues }, receiver_id: { $in: receiverValues } },
                { sender_id: { $in: receiverValues }, receiver_id: { $in: senderValues } }
            ]
        }).sort({ sent_at: 1 }).toArray();

        const messages = docs.map(d => rowToMessage(normalizeMessage(d)));

        // Mark messages sent to from_id as read
        await markMessagesAsRead(to_id, from_id);

        return { success: true, data: messages };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function markMessagesAsRead(senderId: string, receiverId: string): Promise<QueryResult> {
    const col = await messagesCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const senderOid = toObjectId(senderId);
        const receiverOid = toObjectId(receiverId);

        const senderValues = [senderId, ...(senderOid ? [senderOid] : [])];
        const receiverValues = [receiverId, ...(receiverOid ? [receiverOid] : [])];

        const result = await col.updateMany(
            { sender_id: { $in: senderValues }, receiver_id: { $in: receiverValues } },
            { $set: { read: 'True' } }
        );
        return { success: true, data: { affected: result.modifiedCount } };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function sendMessage(message: Message): Promise<QueryResult> {
    const col = await messagesCollection();
    if (!col) return { success: false, error: 'Failed to connect to database' };
    try {
        const senderOid = toObjectId(message.sender_id);
        const receiverOid = toObjectId(message.receiver_id);
        const doc = {
            sender_id: senderOid ?? message.sender_id,
            receiver_id: receiverOid ?? message.receiver_id,
            content: message.content,
            sent_at: message.sent_at,
            read: message.read ?? 'False'
        };
        const result = await col.insertOne(doc);
        return { success: true, data: { affected: result.acknowledged ? 1 : 0 } };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
    const col = await messagesCollection();
    if (!col) return 0;
    try {
        const oid = toObjectId(userId);
        const receiverValues = [userId, ...(oid ? [oid] : [])];
        const docs = await col.find(
            { receiver_id: { $in: receiverValues } },
            { projection: { read: 1 } }
        ).toArray();
        return docs.filter(d => isUnread(d.read)).length;
    } catch {
        return 0;
    }
}
