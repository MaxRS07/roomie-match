Unread Messages by Sender
```ts
db.collection('messages').aggregate([
  {
    // All messages involving this user (sent or received)
    $match: {
      $or: [
        { receiver_id: new ObjectId(currentUserId) },
        { sender_id: new ObjectId(currentUserId) }
      ]
    }
  },
  {
    // Normalize: identify the "other person" in each message
    $addFields: {
      partnerId: {
        $cond: {
          if: { $eq: ['$receiver_id', new ObjectId(currentUserId)] },
          then: '$sender_id',
          else: '$receiver_id'
        }
      },
      isUnread: {
        $and: [
          { $eq: ['$receiver_id', new ObjectId(currentUserId)] },
          { $eq: ['$read', 'False'] }
        ]
      }
    }
  },
  {
    $group: {
      _id: '$partnerId',
      unreadCount: { $sum: { $cond: ['$isUnread', 1, 0] } },
      lastMessageAt: { $max: '$sent_at' }
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'partner'
    }
  },
  { $unwind: '$partner' },
  {
    $project: {
      partnerId: '$_id',
      unreadCount: 1,
      lastMessageAt: 1,
      'partner.name': 1,
      'partner.profile_photo': 1
    }
  },
  { $sort: { lastMessageAt: -1 } }
])
```

Counts the number of unread messages per sender, and puts them in ascending order. The pipeline returns the messages with the sender’s name and profile photo, so this could be used in a message preview or notification display.
