-- Query 1 - Users Who Have a Listing Posted

SELECT Users.name, Listings.description 
FROM Users LEFT JOIN Listings 
ON Users.user_id = Listings.user_id

-- Description
-- This query returns a list of all User’s names left-joined with the Listings description where the user_id of the listing matches the User’s ID. If the condition is not met for a specific user, the description will be null, so we can easily see who has posts.
