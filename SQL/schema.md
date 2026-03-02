# Database Schema

## SQL Tables

```sql
CREATE TABLE `User` (
  `user_id` Text,
  `name` Text,
  `email` Text,
  `password_hash` Blob,
  `age` Integer,
  `gender` Text,
  `occupation` Text,
  `bio` Text,
  `profile_photo` Text,
  `created_at` Integer,
  PRIMARY KEY (`user_id`)
);

CREATE TABLE `UserPreferences` (
  `preference_id` Text,
  `user_id` Text,
  `cleanliness_level` Text,
  `sleep_schedule` Text,
  `pet_friendly` Text,
  `smoking_allowed` Text,
  `noise_tolerance` Text,
  `guests_allowed` Text,
  `work_schedule` Text,
  PRIMARY KEY (`preference_id`),
  FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`)
);

CREATE TABLE `Listing` (
  `listing_id` Text,
  `user_id` Text,
  `title` Text,
  `description` Text,
  `rent_price` Real,        
  `location` Text,
  `city` Text,
  `state` Text,
  `zip_code` Text,
  `available_date` Text,
  `num_rooms` Integer,     
  `num_bathrooms` Integer,  
  `is_active` Text,
  `created_at` Integer,
  PRIMARY KEY (`listing_id`),
  FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`)
);

CREATE TABLE `ListingPhoto` (
  `photo_id` Text,
  `listing_id` Text,
  `data` Blob,
  PRIMARY KEY (`photo_id`),
  FOREIGN KEY (`listing_id`) REFERENCES `Listing`(`listing_id`)
);

CREATE TABLE `ProfilePhoto` (
  `photo_id` Text,
  `user_id` Text,
  `data` Blob,
  PRIMARY KEY (`photo_id`),
  FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`)
);

CREATE TABLE `UserInterest` (
  `interest_id` Text,
  `renter_id` Text,
  `listing_id` Text,
  `status` Text,
  `created_at` Integer,
  PRIMARY KEY (`interest_id`),
  FOREIGN KEY (`renter_id`) REFERENCES `User`(`user_id`),
  FOREIGN KEY (`listing_id`) REFERENCES `Listing`(`listing_id`)
);

CREATE TABLE `Message` (
  `message_id` Text,
  `sender_id` Text,
  `receiver_id` Text,
  `listing_id` Text,
  `content` Blob,
  `sent_at` Integer,
  `read` Text,
  PRIMARY KEY (`message_id`),
  FOREIGN KEY (`sender_id`) REFERENCES `User`(`user_id`),
  FOREIGN KEY (`receiver_id`) REFERENCES `User`(`user_id`),
  FOREIGN KEY (`listing_id`) REFERENCES `Listing`(`listing_id`)
);

CREATE TABLE `Report` (
  `report_id` Text,
  `reporter_id` Text,
  `reported_listing_id` Text,
  `reason` Text,
  `created_at` Integer,
  PRIMARY KEY (`report_id`),
  FOREIGN KEY (`reported_user_id`) REFERENCES `User`(`user_id`),
  FOREIGN KEY (`reported_listing_id`) REFERENCES `Listing`(`listing_id`)
);
```

## BCNF Proof

A relation is in BCNF if for every functional dependency X → Y, X is a superkey. All relations in this schema have a single primary key that determines all other attributes, with no partial or transitive dependencies.

- **User**: `user_id` determines all other attributes. `user_id` is the primary key and superkey. **In BCNF.**

- **UserPreferences**: `preference_id` determines all other attributes. `user_id` is also a superkey since each user has exactly one preferences record. Both determinants are superkeys. **In BCNF.**

- **Listing**: `listing_id` determines all other attributes. `listing_id` is the primary key and superkey. **In BCNF.**

- **ListingPhoto**: `photo_id` determines all other attributes. `photo_id` is the primary key and superkey. **In BCNF.**

- **ProfilePhoto**: `photo_id` determines all other attributes. `photo_id` is the primary key and superkey. **In BCNF.**

- **UserInterest**: `interest_id` determines all other attributes. `(renter_id, listing_id)` is also a candidate key since a user can only express interest in a listing once. Both determinants are superkeys. **In BCNF.**

- **Message**: `message_id` determines all other attributes. `message_id` is the primary key and superkey. **In BCNF.**

- **Report**: `report_id` determines all other attributes. `report_id` is the primary key and superkey. **In BCNF.**
