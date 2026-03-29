Top Listings by Interest Count

```ts
db['listings'].aggregate([
  {
    $match: {
      $or: [
        { is_active: '1' },
        { is_active: 1 }
      ]
    }
  },
  {
    $addFields: {
      interestCount: { $size: { $ifNull: ['$interests', []] } }
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'user_id',
      foreignField: '_id',
      as: 'owner'
    }
  },
  {
    $unwind: {
      path: '$owner',
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $project: {
      title: 1,
      city: 1,
      state: 1,
      rent_price: 1,
      interestCount: 1,
      'owner.name': 1,
      'owner.profile_photo': 1
    }
  },
  { $sort: { interestCount: -1 } },
  { $limit: 10 }
])
```

Get listings by popularity, based on the number of interest objects they contain. It also filters active listings only, where { is_active: 1 }. The returned documents contain the listing information along with the owner's name and profile photo. This is useful for collecting housing metrics.
