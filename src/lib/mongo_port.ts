import mongodb from 'mongodb';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    rowToUser, rowToListing, rowToUserInterest, rowToUserPreferences, rowToMessage,
    type Message, type User, type Listing, type UserInterest,
    type UserPreferences,
    type ListingPhoto,
    type ProfilePhoto,
    rowToProfilePhoto,
    rowToListingPhoto
} from '../types/entities.ts';

const SUPABASE_URL = 'https://njkmhwmxlqxjtoikodgr.supabase.co';
const SUPABASE_ANON_KEY = "sb_publishable_BBneOiwuHde2l2Ofa_04Qw_rLWhCsT1";

export const portData = async () => {
    const mongoClient = await new mongodb.MongoClient('mongodb://localhost:27017').connect();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        if (!mongoClient) throw new Error('Failed to connect to MongoDB');
        if (!supabase) throw new Error('Failed to connect to Supabase');

        console.log('Connected to MongoDB and Supabase successfully.');

        const [users, listings, user_interests, user_preferences, messages, profilePhotos, listingPhotos] = await getSqliteData(supabase);
        console.log(`Fetched data from Supabase: ${users.length} users, ${listings.length} listings, ${user_interests.length} interests, ${user_preferences.length} preferences, ${messages.length} messages.`);

        const db = mongoClient.db('roomie-match');

        // --- Users ---
        const docUsers = users.map(user => {
            process.stdout.write(`Processing user: ${user.user_id} ...`);

            const prefs = user_preferences.find(p => p.user_id === user.user_id);

            const userData: any = {
                _supabase_id: user.user_id,
                name: user.name,
                email: user.email,
                password_hash: user.password_hash,
                age: user.age,
                gender: user.gender,
                occupation: user.occupation,
                bio: user.bio,
                profile_photo: profilePhotos.find(p => p.user_id === user.user_id)?.data || user.profile_photo,
                created_at: user.created_at,
                preferences: prefs ? {
                    cleanliness_level: prefs.cleanliness_level,
                    sleep_schedule: prefs.sleep_schedule,
                    pet_friendly: prefs.pet_friendly,
                    smoking_allowed: prefs.smoking_allowed,
                    noise_tolerance: prefs.noise_tolerance,
                    guests_allowed: prefs.guests_allowed,
                    work_schedule: prefs.work_schedule
                } : null
            };

            console.log(' done.');
            return userData;
        });

        const usersCollection = db.collection('users');
        const insertedUsers = await usersCollection.insertMany(docUsers);
        console.log(`Inserted ${insertedUsers.insertedCount} users.`);

        // Build a map from supabase user_id -> mongo _id for referencing
        const userIdMap = new Map<string, mongodb.ObjectId>();
        const insertedDocs = await usersCollection.find({ _supabase_id: { $in: users.map(u => u.user_id) } }).toArray();
        insertedDocs.forEach(doc => userIdMap.set(doc._supabase_id, doc._id));

        // --- Listings ---
        const docListings = listings.map(l => {
            const photos = listingPhotos.filter(p => p.listing_id === l.listing_id).map(p => p.data);
            const interests = user_interests
                .filter(i => i.listing_id === l.listing_id)
                .map(i => ({
                    renter_id: userIdMap.get(i.renter_id) ?? i.renter_id,
                    status: i.status,
                    created_at: i.created_at
                }));

            return {
                _supabase_id: l.listing_id,
                user_id: userIdMap.get(l.user_id) ?? l.user_id,
                title: l.title,
                description: l.description,
                rent_price: l.rent_price,
                location: l.location,
                city: l.city,
                state: l.state,
                zip_code: l.zip_code,
                available_date: l.available_date,
                num_rooms: l.num_rooms,
                num_bathrooms: l.num_bathrooms,
                is_active: l.is_active,
                photos,
                interests  // small, bounded array — fine to embed
            };
        });

        if (docListings.length > 0) {
            const listingsResult = await db.collection('listings').insertMany(docListings);
            console.log(`Inserted ${listingsResult.insertedCount} listings.`);
        }

        // --- Messages ---
        const docMessages = messages.map(m => ({
            sender_id: userIdMap.get(m.sender_id) ?? m.sender_id,
            receiver_id: userIdMap.get(m.receiver_id) ?? m.receiver_id,
            content: m.content,
            sent_at: m.sent_at,
            read: m.read
        }));

        if (docMessages.length > 0) {
            const messagesResult = await db.collection('messages').insertMany(docMessages);
            console.log(`Inserted ${messagesResult.insertedCount} messages.`);
        }

    } finally {
        await mongoClient.close();
    }
};

const getSqliteData = async (sbc: SupabaseClient): Promise<[User[], Listing[], UserInterest[], UserPreferences[], Message[], ProfilePhoto[], ListingPhoto[]]> => {
    const [usersResult, listingsResult, interestsResult, preferencesResult, messagesResult, profilePhotosResult, listingPhotosResult] = await Promise.all([
        sbc.from('Users').select('*'),
        sbc.from('Listings').select('*'),
        sbc.from('UserInterests').select('*'),
        sbc.from('UserPreferences').select('*'),
        sbc.from('Messages').select('*'),
        sbc.from('ProfilePhoto').select('*'),
        sbc.from('ListingPhotos').select('*')
    ]).catch(error => {
        console.error('Error fetching data from Supabase:', error);
        throw error;
    });

    if (usersResult.error) throw usersResult.error;
    if (listingsResult.error) throw listingsResult.error;
    if (interestsResult.error) throw interestsResult.error;
    if (preferencesResult.error) throw preferencesResult.error;
    if (messagesResult.error) throw messagesResult.error;
    if (profilePhotosResult.error) throw profilePhotosResult.error;
    if (listingPhotosResult.error) throw listingPhotosResult.error;

    return [
        (usersResult.data ?? []).map(rowToUser),
        (listingsResult.data ?? []).map(rowToListing),
        (interestsResult.data ?? []).map(rowToUserInterest),
        (preferencesResult.data ?? []).map(rowToUserPreferences),
        (messagesResult.data ?? []).map(rowToMessage),
        (profilePhotosResult.data ?? []).map(rowToProfilePhoto),
        (listingPhotosResult.data ?? []).map(rowToListingPhoto)
    ];
};

portData()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Error porting data:', error);
        process.exit(1);
    });