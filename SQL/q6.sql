-- Query 6 - Get Listings With More Than One Interested Renter
SELECT 
	Listings.title, 
	Listings.rent_price, 
	Listings.city, 
	COUNT(*) AS total_interest 
FROM UserInterest 
INNER JOIN Listings 
ON UserInterest.listing_id = Listings.listing_id 
GROUP BY UserInterest.listing_id 
HAVING COUNT(*) > 1 
ORDER BY total_interest DESC

-- Description
-- This query returns all listings that have received interest from more than one renter. It joins UserInterest to Listing on the listing_id, groups by listing, and uses a HAVING clause to filter out listings with only one or zero interested renters. This is useful for listers to see which of their postings are most popular.
