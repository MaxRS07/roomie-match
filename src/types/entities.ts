// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface User {
    user_id: string;
    name: string;
    email: string;
    password_hash: string;
    age: string;
    gender: string;
    occupation: string;
    bio: string;
    profile_photo?: string;
    created_at: number;
}

export interface UserPreferences {
    preference_id: string;
    user_id: string;
    cleanliness_level: string;
    sleep_schedule: string;
    pet_friendly: string;
    smoking_allowed: string;
    noise_tolerance: string;
    guests_allowed: string;
    work_schedule: string;
}

export interface ProfilePhoto {
    photo_id: string;
    user_id: string;
    data: string;
}

export interface Listing {
    listing_id: string;
    user_id: string;
    title: string;
    description: string;
    rent_price: string;
    location: string;
    city: string;
    state: string;
    zip_code: string;
    available_date: string;
    num_rooms: string;
    num_bathrooms: string;
    is_active: 'TRUE' | 'FALSE';
    created_at: number;
}

export interface ListingPhoto {
    photo_id: string;
    listing_id: string;
    data: string;
}

export type InterestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface UserInterest {
    interest_id: string;
    renter_id: string;
    listing_id: string;
    status: InterestStatus;
    created_at: number;
}

export interface Report {
    report_id: string;
    reporter_id: string;
    reported_user_id?: string;
    reported_listing_id?: string;
    reason: string;
    created_at: string;
}

export interface Message {
    message_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    sent_at: string;
    read: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateUserDTO {
    name: string; email: string; password: string;
    age: string; gender: string; occupation: string; bio: string;
}
export interface UpdateUserDTO {
    name?: string; email?: string; age?: string;
    gender?: string; occupation?: string; bio?: string;
}
export interface CreateListingDTO {
    title: string; description: string; rent_price: string; location: string;
    city: string; state: string; zip_code: string; available_date: string;
    num_rooms: string; num_bathrooms: string;
}
export interface UpdateListingDTO {
    title?: string; description?: string; rent_price?: string; location?: string;
    city?: string; state?: string; zip_code?: string; available_date?: string;
    num_rooms?: string; num_bathrooms?: string; is_active?: 'TRUE' | 'FALSE';
}
export interface CreateUserInterestDTO { listing_id: string; }
export interface CreateMessageDTO { receiver_id: string; content: string; }
export interface CreateReportDTO {
    reported_user_id?: string; reported_listing_id?: string; reason: string;
}

// ─── Row mappers (Supabase returns plain objects) ─────────────────────────────

export function rowToUser(row: any): User {
    return {
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        password_hash: row.password_hash,
        age: row.age,
        gender: row.gender,
        occupation: row.occupation,
        bio: row.bio,
        profile_photo: row.profile_photo,
        created_at: row.created_at,
    };
}

export function rowToUserPreferences(row: any): UserPreferences {
    return {
        preference_id: row.preference_id,
        user_id: row.user_id,
        cleanliness_level: row.cleanliness_level,
        sleep_schedule: row.sleep_schedule,
        pet_friendly: row.pet_friendly,
        smoking_allowed: row.smoking_allowed,
        noise_tolerance: row.noise_tolerance,
        guests_allowed: row.guests_allowed,
        work_schedule: row.work_schedule,
    };
}

export function rowToListing(row: any): Listing {
    return {
        listing_id: row.listing_id,
        user_id: row.user_id,
        title: row.title,
        description: row.description,
        rent_price: row.rent_price,
        location: row.location,
        city: row.city,
        state: row.state,
        zip_code: row.zip_code,
        available_date: row.available_date,
        num_rooms: row.num_rooms,
        num_bathrooms: row.num_bathrooms,
        is_active: row.is_active,
        created_at: row.created_at,
    };
}

export function rowToUserInterest(row: any): UserInterest {
    return {
        interest_id: row.interest_id,
        renter_id: row.renter_id,
        listing_id: row.listing_id,
        status: row.status,
        created_at: row.created_at,
    };
}

export function rowToReport(row: any): Report {
    return {
        report_id: row.report_id,
        reporter_id: row.reporter_id,
        reported_user_id: row.reported_user_id,
        reported_listing_id: row.reported_listing_id,
        reason: row.reason,
        created_at: row.created_at,
    };
}

export function rowToMessage(row: any): Message {
    return {
        message_id: row.message_id,
        sender_id: row.sender_id,
        receiver_id: row.receiver_id,
        content: row.content,
        sent_at: row.sent_at,
        read: row.read,
    };
}

export function rowToListingPhoto(row: any): ListingPhoto {
    return {
        photo_id: row.photo_id,
        listing_id: row.listing_id,
        data: row.data,
    };
}

export function rowToProfilePhoto(row: any): ProfilePhoto {
    return {
        photo_id: row.photo_id,
        user_id: row.user_id,
        data: row.data,
    };
}
// ─── Legacy aliases so existing page imports don't break ─────────────────────
// Pages call arrayToUser(resp.data[0]) — since data[0] is now already a mapped
// User object (not a raw array), these just return the object as-is.

export const arrayToUser = (row: any): User => row as User;
export const arrayToUserPreferences = (row: any): UserPreferences => row as UserPreferences;
export const arrayToListing = (row: any): Listing => row as Listing;
export const arrayToUserInterest = (row: any): UserInterest => row as UserInterest;
export const arrayToReport = (row: any): Report => row as Report;
export const arrayToMessage = (row: any): Message => row as Message;
