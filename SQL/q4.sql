-- Query 4 - Get Number of Unread Messages Per Sender for a User
SELECT Users.name, COUNT(*) AS unread_messages
FROM Messages
INNER JOIN Users ON Users.user_id = Messages.sender_id
WHERE Messages.receiver_id = '<user_id>'
AND read = "False"
GROUP BY Messages.sender_id, Users.name

-- Description
-- This query takes in a user id as input and returns the number of messages received by each sender, using the Count aggregate and grouping by the sender_id, only where the message’s read status is false. We can use the return relation to send specific notifications or display them in the messages page in the app.
