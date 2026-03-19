import mongodb from 'mongodb';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    rowToUser, rowToListing, rowToUserInterest, rowToUserPreferences, rowToMessage,
    type Message, type User, type Listing, type UserInterest,
    type UserPreferences
} from '../types/entities.ts';

const SUPABASE_URL = 'https://njkmhwmxlqxjtoikodgr.supabase.co';
const SUPABASE_ANON_KEY = "sb_publishable_BBneOiwuHde2l2Ofa_04Qw_rLWhCsT1";

export const portData = async () => {
    const mongoClient = await new mongodb.MongoClient('mongodb://localhost:27017').connect();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        if (!mongoClient) {
            throw new Error('Failed to connect to MongoDB');
        }
        if (!supabase) {
            throw new Error('Failed to connect to Supabase');
        }
        console.log('Connected to MongoDB and Supabase successfully.');
        const [users, listings, user_interests, user_preferences, messages] = await getSqliteData(supabase);
        console.log(`Fetched data from Supabase: ${users.length} users, ${listings.length} listings, ${user_interests.length} interests, ${user_preferences.length} preferences, ${messages.length} messages.`);
        const docUsers = users.map(user => {
            process.stdout.write(`Processing user: ${user.user_id} ...`);

            const userData: any = {
                name: user.name,
                email: user.email,
                password_hash: user.password_hash,
                age: user.age,
                gender: user.gender,
                occupation: user.occupation,
                bio: user.bio,
                profile_photo: user.profile_photo,
                created_at: user.created_at
            }

            const prefs = user_preferences.filter(p => p.user_id === user.user_id);
            const list = listings.filter(l => l.user_id === user.user_id);
            const sentMessages = messages.filter(m => m.sender_id === user.user_id);

            if (prefs[0]) {
                const pref = prefs[0];
                userData.preferences = {
                    cleanliness_level: pref.cleanliness_level,
                    sleep_schedule: pref.sleep_schedule,
                    pet_friendly: pref.pet_friendly,
                    smoking_allowed: pref.smoking_allowed,
                    noise_tolerance: pref.noise_tolerance,
                    guests_allowed: pref.guests_allowed,
                    work_schedule: pref.work_schedule
                };
            }
            if (list.length > 0) {
                const interests = user_interests.filter(i => i.renter_id === user.user_id);
                userData.listings = list.map(l => ({
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
                    interests: interests.filter(i => i.listing_id === l.listing_id).map(i => ({
                        status: i.status,
                        created_at: i.created_at
                    }))
                }));
            }
            if (sentMessages.length > 0) {
                userData.sent_messages = sentMessages.map(m => ({
                    receiver_id: m.receiver_id,
                    content: m.content,
                    sent_at: m.sent_at,
                    read: m.read
                }));
            }

            console.log(' done.');

            return userData;
        });

        const collection = mongoClient.db('roomie-match').collection('users');
        const insertResult = await collection.insertMany(docUsers);

        console.log(`Data inserted into MongoDB successfully. Inserted ${insertResult.insertedCount} documents.`);
    } finally {
        await mongoClient.close();
    }
}

const getSqliteData = async (sbc: SupabaseClient): Promise<[User[], Listing[], UserInterest[], UserPreferences[], Message[]]> => {
    const [usersResult, listingsResult, interestsResult, preferencesResult, messagesResult] = await Promise.all([
        sbc.from('Users').select('*'),
        sbc.from('Listings').select('*'),
        sbc.from('UserInterests').select('*'),
        sbc.from('UserPreferences').select('*'),
        sbc.from('Messages').select('*')
    ]).catch(error => {
        console.error('Error fetching data from Supabase:', error);
        throw error;
    });

    if (usersResult.error) {
        console.error('Error fetching users from Supabase:', usersResult.error);
        throw usersResult.error;
    }
    if (listingsResult.error) {
        console.error('Error fetching listings from Supabase:', listingsResult.error);
        throw listingsResult.error;
    }
    if (interestsResult.error) {
        console.error('Error fetching user interests from Supabase:', interestsResult.error);
        throw interestsResult.error;
    }
    if (preferencesResult.error) {
        console.error('Error fetching user preferences from Supabase:', preferencesResult.error);
        throw preferencesResult.error;
    }
    if (messagesResult.error) {
        console.error('Error fetching messages from Supabase:', messagesResult.error);
        throw messagesResult.error;
    }

    const users: User[] = (usersResult.data ?? []).map(rowToUser);
    const listings: Listing[] = (listingsResult.data ?? []).map(rowToListing);
    const interests: UserInterest[] = (interestsResult.data ?? []).map(rowToUserInterest);
    const preferences: any[] = (preferencesResult.data ?? []).map(rowToUserPreferences);
    const messages: Message[] = (messagesResult.data ?? []).map(rowToMessage);

    return [users, listings, interests, preferences, messages];
}

portData()
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.error('Error porting data:', error);
        process.exit(1);
    });