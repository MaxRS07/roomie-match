-- Query 5 - Get Listings for Similar User Preferences 
SELECT Listings.*
FROM Listings
INNER JOIN UserPreferences 
ON UserPreferences.user_id = Listings.user_id
CROSS JOIN (
    SELECT * FROM UserPreferences WHERE user_id = '<user_id>'
) AS rp
WHERE rp.pet_friendly = UserPreferences.pet_friendly
AND rp.smoking_allowed = UserPreferences.smoking_allowed
AND rp.sleep_schedule = UserPreferences.sleep_schedule
-- Other preferences for matching users
-----------------------------------------
-- AND rp.cleanliness_level = UserPreferences.cleanliness_level
-- AND rp.guests_allowed = UserPreferences.guests_allowed
-- AND rp.work_schedule = UserPreferences.work_schedule
-- AND rp.noise_tolerance = UserPreferences.noise_tolerance



-- Description
-- The query joins the user preferences of the listing owner with the listing itself to a table, and then joins each tuple with the selected users preferences, saving the selected user’s preference reference as “rp” for renter preference. Then it filters for matches and returns only the listing properties for the remaining tuples. The preference matching statement is configurable and you can string more checks together to get a better match. This will be used for the preference search function, and an ordering variant can be used to order all listings by preference match.
