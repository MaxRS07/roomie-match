-- Query 3 - Simple Login Functionality
SELECT * 
FROM Users 
WHERE 
	Users.email = "<email>" AND 
	Users.password_hash = "<password_hash>"

-- Description
-- This query returns all user data where the email and password match. Once the user is authenticated, the app can use the returned relation to send an auth email and fetch data from other tables. If no data is returned, the app knows the email or password is incorrect.
