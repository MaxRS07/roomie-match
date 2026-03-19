import {
    rowToUser, rowToListing, rowToUserInterest, rowToUserPreferences, rowToMessage,
    type Message, type User, type Listing, type UserInterest
} from '../types/entities.js';
import type { QueryResult } from '../types/query.js';
import mongodb from 'mongodb';
import { UUID } from 'mongodb';

type MongoDoc = Record<string, any>;

const userIdentifier = (doc: MongoDoc): string => String(doc.user_id ?? doc._id ?? '');

const listingIdentifier = (ownerId: string, listing: MongoDoc, index: number): string =>
    String(listing.listing_id ?? `${ownerId}:${index}`);

const isUnreadValue = (value: unknown): boolean => {
    if (typeof value === 'boolean') return value === false;
    if (typeof value === 'string') return value.toLowerCase() === 'false';
    return false;
};

const parseSyntheticListingId = (listingId: string): { ownerId: string; index: number } | null => {
    const parts = listingId.split(':');
    if (parts.length !== 2) return null;
    const index = Number(parts[1]);
    if (!Number.isInteger(index) || index < 0) return null;
    return { ownerId: parts[0]!, index };
};

const normalizePreferenceRow = (user: MongoDoc): MongoDoc => {
    const prefs = user.preferences ?? {};
    return {
        preference_id: prefs.preference_id ?? user.preference_id ?? userIdentifier(user),
        user_id: userIdentifier(user),
        cleanliness_level: prefs.cleanliness_level ?? user.cleanliness_level ?? '',
        sleep_schedule: prefs.sleep_schedule ?? user.sleep_schedule ?? '',
        pet_friendly: prefs.pet_friendly ?? user.pet_friendly ?? '',
        smoking_allowed: prefs.smoking_allowed ?? user.smoking_allowed ?? '',
        noise_tolerance: prefs.noise_tolerance ?? user.noise_tolerance ?? '',
        guests_allowed: prefs.guests_allowed ?? user.guests_allowed ?? '',
        work_schedule: prefs.work_schedule ?? user.work_schedule ?? ''
    };
};

const normalizeListingRow = (owner: MongoDoc, listing: MongoDoc, index: number): MongoDoc => {
    const ownerId = userIdentifier(owner);
    return {
        listing_id: listingIdentifier(ownerId, listing, index),
        user_id: ownerId,
        title: listing.title ?? '',
        description: listing.description ?? '',
        rent_price: String(listing.rent_price ?? ''),
        location: listing.location ?? '',
        city: listing.city ?? '',
        state: listing.state ?? '',
        zip_code: listing.zip_code ?? '',
        available_date: listing.available_date ?? '',
        num_rooms: String(listing.num_rooms ?? ''),
        num_bathrooms: String(listing.num_bathrooms ?? ''),
        is_active: listing.is_active ?? 'FALSE',
        created_at: listing.created_at ?? owner.created_at ?? Date.now()
    };
};

const normalizeInterestRow = (owner: MongoDoc, listing: MongoDoc, interest: MongoDoc, index: number): MongoDoc => {
    const ownerId = userIdentifier(owner);
    const listingId = listingIdentifier(ownerId, listing, index);
    return {
        interest_id: interest.interest_id ?? new UUID().toString(),
        renter_id: interest.renter_id ?? '',
        listing_id: interest.listing_id ?? listingId,
        status: interest.status ?? 'Pending',
        created_at: interest.created_at ?? Date.now()
    };
};

const normalizeMessageRow = (sender: MongoDoc, message: MongoDoc, index: number): MongoDoc => {
    const senderId = userIdentifier(sender);
    return {
        message_id: message.message_id ?? `${senderId}:${index}:${message.sent_at ?? Date.now()}`,
        sender_id: senderId,
        receiver_id: message.receiver_id ?? '',
        content: message.content ?? '',
        sent_at: message.sent_at ?? new Date().toISOString(),
        read: typeof message.read === 'boolean' ? (message.read ? 'True' : 'False') : (message.read ?? 'False')
    };
};
// ─── Users ────────────────────────────────────────────────────────────────────

const usersCollection = async (): Promise<mongodb.Collection | null> => {
    const client = await new mongodb.MongoClient('mongodb://localhost:27017').connect();
    if (!client) {
        console.error('Failed to connect to MongoDB, ensure MongoDB is running and accessible at mongodb://localhost:27017');
        return null;
    }
    const collection = client.db('roomie-match').collection('users');
    return collection;
}

export async function getAllUsers(): Promise<QueryResult<User[]>> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const data = await users.find().toArray();
        const mapped = data.map((row: MongoDoc) => rowToUser({ ...row, user_id: userIdentifier(row) }));
        return { success: true, data: mapped };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUserById(userId: string): Promise<QueryResult<User[]>> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const data = await users.findOne({
            $or: [
                { user_id: userId },
                ...(mongodb.ObjectId.isValid(userId) ? [{ _id: new mongodb.ObjectId(userId) }] : [])
            ]
        });
        if (!data) return { success: false, error: 'User not found' };
        return { success: true, data: [rowToUser({ ...data, user_id: userIdentifier(data) })] };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function createUser(userData: { name: string; email: string; password_hash: string; age?: string; gender?: string; occupation?: string; bio?: string }): Promise<QueryResult> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const user_id = new UUID().toString();
        const doc = {
            ...userData,
            user_id,
            created_at: Date.now(),
            preferences: {},
            listings: [],
            sent_messages: []
        };
        await users.insertOne(doc);
        return { success: true, data: [rowToUser(doc)] };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateUser(userId: string, userData: Partial<{ name: string; email: string; preferences: any }>): Promise<QueryResult> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const result = await users.findOneAndUpdate(
            { user_id: userId },
            { $set: userData },
            { returnDocument: 'after' }
        );
        if (!result) return { success: false, error: 'User not found' };
        return { success: true, data: [rowToUser({ ...result, user_id: userIdentifier(result) })] };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateUserProfile(userId: string, data: {
    name?: string; email?: string; age?: string; gender?: string; occupation?: string; bio?: string;
}): Promise<QueryResult> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to retrieve user' };

    try {
        const result = await users.updateOne({ user_id: userId }, { $set: data });
        if (result.matchedCount === 0) return { success: false, error: 'User not found' };
        return { success: true, data: { affected: result.modifiedCount } };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteUser(userId: string): Promise<QueryResult> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const result = await users.deleteOne({ user_id: userId });
        if (result.deletedCount === 0) return { success: false, error: 'User not found' };
        return { success: true, data: { affected: result.deletedCount } };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function authenticateUser(email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to retrieve user' };

    try {
        const data = await users.findOne({ email, password_hash: password });
        if (!data) return { success: false, error: 'User not found' };
        return { success: true, data: data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ─── Current User (client-side session via localStorage) ─────────────────────

export async function getCurrentUser(): Promise<User | null> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return null;

    const cached = localStorage.getItem('user:' + authToken);
    if (cached) return JSON.parse(cached) as User;

    const result = await getUserById(authToken);
    if (result.success && result.data && result.data.length > 0) {
        const user = result.data[0]!;
        localStorage.setItem('user:' + authToken, JSON.stringify(user));
        return user;
    }
    return null;
}

// ─── User Preferences ─────────────────────────────────────────────────────────

export async function getUserPreferences(userId: string): Promise<QueryResult> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const data = await users.findOne({ user_id: userId }, { projection: { user_id: 1, preferences: 1 } });
        if (!data) return { success: false, error: 'User not found' };
        return { success: true, data: [rowToUserPreferences(normalizePreferenceRow(data))] };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateUserPreferences(userId: string, prefs: {
    cleanliness_level?: string; sleep_schedule?: string; pet_friendly?: string;
    smoking_allowed?: string; noise_tolerance?: string; guests_allowed?: string; work_schedule?: string;
}): Promise<QueryResult> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const result = await users.updateOne({ user_id: userId }, { $set: { preferences: prefs } });
        if (result.matchedCount === 0) return { success: false, error: 'User not found' };
        return { success: true, data: { affected: result.modifiedCount } };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function getProfilePhoto(userId: string): Promise<string | null> {
    const users = await usersCollection();
    if (!users) return null;

    try {
        const data = await users.findOne({ user_id: userId }, { projection: { profile_photo: 1 } });
        if (!data) return null;
        return data.profile_photo ?? null;
    } catch (error) {
        return null;
    }
}

export async function updateProfilePhoto(userId: string, dataUrl: string): Promise<QueryResult> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const result = await users.updateOne({ user_id: userId }, { $set: { profile_photo: dataUrl } });
        if (result.matchedCount === 0) return { success: false, error: 'User not found' };
        return { success: true, data: { affected: result.modifiedCount } };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getListingPhoto(listingId: string): Promise<string | null> {
    const users = await usersCollection();
    if (!users) return null;

    try {
        const withNativeId = await users.findOne(
            { 'listings.listing_id': listingId },
            { projection: { listings: 1 } }
        );

        if (withNativeId?.listings) {
            const listing = withNativeId.listings.find((row: MongoDoc) => row.listing_id === listingId);
            if (!listing) return null;
            return listing.photo_data ?? listing.photo ?? listing.image ?? null;
        }

        const synthetic = parseSyntheticListingId(listingId);
        if (!synthetic) return null;

        const owner = await users.findOne(
            { user_id: synthetic.ownerId },
            { projection: { listings: 1 } }
        );

        const listing = owner?.listings?.[synthetic.index];
        if (!listing) return null;
        return listing.photo_data ?? listing.photo ?? listing.image ?? null;
    } catch (error) {
        return null;
    }
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function getActiveListings(): Promise<QueryResult<Listing[]>> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const ownerDocs = await users.find({}, { projection: { user_id: 1, created_at: 1, listings: 1 } }).toArray();
        const allListings: Listing[] = [];

        for (const owner of ownerDocs) {
            const listings = Array.isArray(owner.listings) ? owner.listings : [];
            listings.forEach((listing: MongoDoc, index: number) => {
                const normalized = normalizeListingRow(owner, listing, index);
                const active = String(normalized.is_active).toUpperCase();
                if (active === 'TRUE' || active === '1') {
                    allListings.push(rowToListing(normalized));
                }
            });
        }

        allListings.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
        return { success: true, data: allListings };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUserListings(userId: string): Promise<QueryResult<Listing[]>> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const owner = await users.findOne(
            { user_id: userId },
            { projection: { user_id: 1, created_at: 1, listings: 1 } }
        );
        if (!owner) return { success: true, data: [] };

        const listings = (owner.listings ?? []).map((listing: MongoDoc, index: number) =>
            rowToListing(normalizeListingRow(owner, listing, index))
        );

        listings.sort((a: Listing, b: Listing) => (b.created_at ?? 0) - (a.created_at ?? 0));
        return { success: true, data: listings };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ─── User Interests ───────────────────────────────────────────────────────────

export async function createUserInterest(renterId: string, listingId: string): Promise<QueryResult> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const payload = {
            interest_id: new UUID().toString(),
            renter_id: renterId,
            listing_id: listingId,
            status: 'Pending',
            created_at: Date.now()
        };

        const byNativeListingId = await users.updateOne(
            { 'listings.listing_id': listingId },
            { $push: { 'listings.$.interests': payload } as any }
        );

        if (byNativeListingId.matchedCount > 0) {
            return { success: true, data: { affected: byNativeListingId.modifiedCount } };
        }

        const synthetic = parseSyntheticListingId(listingId);
        if (!synthetic) return { success: false, error: 'Listing not found' };

        const owner = await users.findOne(
            { user_id: synthetic.ownerId },
            { projection: { listings: 1 } }
        );
        if (!owner?.listings?.[synthetic.index]) return { success: false, error: 'Listing not found' };

        const fieldPath = `listings.${synthetic.index}.interests`;
        const fallbackUpdate = await users.updateOne(
            { user_id: synthetic.ownerId },
            { $push: { [fieldPath]: payload } as any }
        );

        return { success: true, data: { affected: fallbackUpdate.modifiedCount } };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getInterestsForListing(listingId: string): Promise<QueryResult<UserInterest[]>> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        let owner = await users.findOne(
            { 'listings.listing_id': listingId },
            { projection: { user_id: 1, listings: 1 } }
        );
        let listing: MongoDoc | undefined;
        let listingIndex = 0;

        if (owner?.listings) {
            listingIndex = owner.listings.findIndex((row: MongoDoc) => row.listing_id === listingId);
            listing = listingIndex >= 0 ? owner.listings[listingIndex] : undefined;
        }

        if (!listing) {
            const synthetic = parseSyntheticListingId(listingId);
            if (!synthetic) return { success: true, data: [] };
            owner = await users.findOne(
                { user_id: synthetic.ownerId },
                { projection: { user_id: 1, listings: 1 } }
            );
            listingIndex = synthetic.index;
            listing = owner?.listings?.[synthetic.index];
        }

        if (!owner || !listing) return { success: true, data: [] };

        const interests = (listing.interests ?? [])
            .map((interest: MongoDoc) => rowToUserInterest(normalizeInterestRow(owner as MongoDoc, listing as MongoDoc, interest, listingIndex)))
            .sort((a: UserInterest, b: UserInterest) => b.created_at - a.created_at);

        return { success: true, data: interests };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUserSentInterests(userId: string): Promise<QueryResult<UserInterest[]>> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const ownerDocs = await users.find({}, { projection: { user_id: 1, listings: 1 } }).toArray();
        const sent: UserInterest[] = [];

        for (const owner of ownerDocs) {
            const listings = owner.listings ?? [];
            listings.forEach((listing: MongoDoc, listingIndex: number) => {
                const interests = listing.interests ?? [];
                interests.forEach((interest: MongoDoc) => {
                    if ((interest.renter_id ?? '') === userId) {
                        sent.push(rowToUserInterest(normalizeInterestRow(owner as MongoDoc, listing, interest, listingIndex)));
                    }
                });
            });
        }

        sent.sort((a, b) => b.created_at - a.created_at);
        return { success: true, data: sent };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getUserChats(userId: string): Promise<QueryResult<[string, number][]>> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const docs = await users.find({}, { projection: { user_id: 1, sent_messages: 1 } }).toArray();
        const counts = new Map<string, number>();

        for (const sender of docs) {
            const senderId = userIdentifier(sender);
            const sentMessages = sender.sent_messages ?? [];
            sentMessages.forEach((message: MongoDoc) => {
                const receiverId = String(message.receiver_id ?? '');
                if (!receiverId) return;

                if (senderId === userId) {
                    if (!counts.has(receiverId)) counts.set(receiverId, 0);
                    return;
                }

                if (receiverId === userId) {
                    if (!counts.has(senderId)) counts.set(senderId, 0);
                    if (isUnreadValue(message.read)) {
                        counts.set(senderId, counts.get(senderId)! + 1);
                    }
                }
            });
        }

        const result: [string, number][] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getChatMessages(from_id: string, to_id: string): Promise<QueryResult> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const docs = await users.find(
            { user_id: { $in: [from_id, to_id] } },
            { projection: { user_id: 1, sent_messages: 1 } }
        ).toArray();

        const rows: Message[] = [];
        for (const sender of docs) {
            const senderId = userIdentifier(sender);
            const sentMessages = sender.sent_messages ?? [];
            sentMessages.forEach((message: MongoDoc, index: number) => {
                const receiverId = String(message.receiver_id ?? '');
                const isPair =
                    (senderId === from_id && receiverId === to_id) ||
                    (senderId === to_id && receiverId === from_id);

                if (!isPair) return;
                rows.push(rowToMessage(normalizeMessageRow(sender as MongoDoc, message, index)));
            });
        }

        rows.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
        return { success: true, data: rows };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function sendMessage(message: Message): Promise<QueryResult> {
    const users = await usersCollection();
    if (!users) return { success: false, error: 'Failed to connect to database' };

    try {
        const payload = {
            message_id: message.message_id || new UUID().toString(),
            receiver_id: message.receiver_id,
            content: message.content,
            sent_at: message.sent_at,
            read: message.read
        };

        const result = await users.updateOne(
            { user_id: message.sender_id },
            { $push: { sent_messages: payload } as any }
        );

        if (result.matchedCount === 0) {
            return { success: false, error: 'Sender user not found' };
        }

        return { success: true, data: { affected: result.modifiedCount } };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
    const users = await usersCollection();
    if (!users) return 0;

    try {
        const docs = await users.find({}, { projection: { sent_messages: 1 } }).toArray();
        let unreadCount = 0;

        for (const sender of docs) {
            const sentMessages = sender.sent_messages ?? [];
            sentMessages.forEach((message: MongoDoc) => {
                if (String(message.receiver_id ?? '') === userId && isUnreadValue(message.read)) {
                    unreadCount += 1;
                }
            });
        }

        return unreadCount;
    } catch (error) {
        return 0;
    }
}
