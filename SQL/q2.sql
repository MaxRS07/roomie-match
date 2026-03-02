-- Query 2 - Filtering Listing Reports
SELECT 
    Report.reason, 
    Listings.listing_id, 
    Users.name AS user_name,
    Users.user_id AS user_id,
    COUNT(*) OVER(PARTITION BY Listings.listing_id) AS total_reports_on_listing
FROM Report 
INNER JOIN Listings ON Report.reported_listing_id = Listings.listing_id
INNER JOIN Users ON Users.user_id = Listings.user_id
ORDER BY total_reports_on_listing DESC, Listings.listing_id;


-- Description
-- To start the query, we decide three crucial datapoints; the reason for the report, the data from the reported listing, and the number of times that listing has been reported for any reason. This number can be calculated by counting the length of each group partitioned by the report’s listing_id. For convenience, the reported user id is also selected, though it is contained in the listing information. The selection table is created joining reports to listings where the id matches, and joining that to Users on the reported user_id.
