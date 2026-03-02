// User entity
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

// User preferences
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

// Profile photo
export interface ProfilePhoto {
    photo_id: string;
    user_id: string;
    data: Buffer;
}

// Listing
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

// Listing photo
export interface ListingPhoto {
    photo_id: string;
    listing_id: string;
    data: Buffer;
}

// User interest in listing
export type InterestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface UserInterest {
    interest_id: string;
    renter_id: string;
    listing_id: string;
    status: InterestStatus;
    created_at: number;
}

// Report
export interface Report {
    report_id: string;
    reporter_id: string;
    reported_user_id?: string;
    reported_listing_id?: string;
    reason: string;
    created_at: number;
}

// Message
export interface Message {
    message_id: string;
    sender_id: string;
    receiver_id: string;
    content: Buffer;
    sent_at: number;
    read: string; // Could be 'true' or 'false'
}

// DTOs for API requests/responses
export interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    age: string;
    gender: string;
    occupation: string;
    bio: string;
}

export interface UpdateUserDTO {
    name?: string;
    email?: string;
    age?: string;
    gender?: string;
    occupation?: string;
    bio?: string;
}

export interface CreateListingDTO {
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
}

export interface UpdateListingDTO {
    title?: string;
    description?: string;
    rent_price?: string;
    location?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    available_date?: string;
    num_rooms?: string;
    num_bathrooms?: string;
    is_active?: 'TRUE' | 'FALSE';
}

export interface CreateUserInterestDTO {
    listing_id: string;
}

export interface CreateMessageDTO {
    receiver_id: string;
    content: string;
}

export interface CreateReportDTO {
    reported_user_id?: string;
    reported_listing_id?: string;
    reason: string;
}

// Convert database array row to User object
// Expected order: [user_id, name, email, password_hash, age, gender, occupation, bio, profile_photo, created_at]
export function arrayToUser(row: any[]): User {
    return {
        user_id: row[0],
        name: row[1],
        email: row[2],
        password_hash: row[3],
        age: row[4],
        gender: row[5],
        occupation: row[6],
        bio: row[7],
        profile_photo: row[8],
        created_at: row[9]
    };
}

export function arrayToUserPreferences(row: any[]): UserPreferences {
    return {
        preference_id: row[0],
        user_id: row[1],
        cleanliness_level: row[2],
        sleep_schedule: row[3],
        pet_friendly: row[4],
        smoking_allowed: row[5],
        noise_tolerance: row[6],
        guests_allowed: row[7],
        work_schedule: row[8]
    };
}

export function arrayToListing(row: any[]): Listing {
    return {
        listing_id: row[0],
        user_id: row[1],
        title: row[2],
        description: row[3],
        rent_price: row[4],
        location: row[5],
        city: row[6],
        state: row[7],
        zip_code: row[8],
        available_date: row[9],
        num_rooms: row[10],
        num_bathrooms: row[11],
        is_active: row[12],
        created_at: row[13]
    };
}

export function arrayToUserInterest(row: any[]): UserInterest {
    return {
        interest_id: row[0],
        renter_id: row[1],
        listing_id: row[2],
        status: row[3],
        created_at: row[4]
    };
}

export function arrayToReport(row: any[]): Report {
    return {
        report_id: row[0],
        reporter_id: row[1],
        reported_user_id: row[2],
        reported_listing_id: row[3],
        reason: row[4],
        created_at: row[5]
    };
}

export function arrayToMessage(row: any[]): Message {
    return {
        message_id: row[0],
        sender_id: row[1],
        receiver_id: row[2],
        content: row[3],
        sent_at: row[4],
        read: row[5]
    };
}