// User entity
export interface User {
    user_id: string;
    name: string;
    email: string;
    password_hash: Buffer;
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
