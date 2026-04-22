# Fetching a Text Exchange
```ts
export async function getConversationWithProfiles(userAId: string, userBId: string) {
   const messages = await messagesCollection();
   const users = await usersCollection();
   if (!messages || !users) throw new Error('Failed to connect to database');

   const aOid = new ObjectId(userAId);
   const bOid = new ObjectId(userBId);

   const profiles = await users.find(
       { _id: { $in: [aOid, bOid] } },
       { projection: { _id: 1, name: 1, profile_photo: 1 } }
   ).toArray();

   const profileMap = new Map(
       profiles.map(p => [p._id.toString(), p])
   );

   const thread = await messages.find(
       {
           $or: [
               { sender_id: aOid, receiver_id: bOid },
               { sender_id: bOid, receiver_id: aOid }
           ]
       },
       {
           projection: { content: 1, sent_at: 1, read: 1, sender_id: 1, receiver_id: 1 },
           sort: { sent_at: 1 }
       }
   ).toArray();

   return thread.map(msg => ({
       ...msg,
       sender: profileMap.get(msg.sender_id.toString()) ?? null,
       receiver: profileMap.get(msg.receiver_id.toString()) ?? null
   }));
}
```
Gets all messages sent and received between two users, by performing a multi-collection find between users and messages. Each message is joined by its sender’s name and profile photo, for easy identification and display.
