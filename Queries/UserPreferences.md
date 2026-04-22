# Fetching User Preferences

```ts
export async function getUserPreferences(userId: string): Promise<QueryResult> {
   const col = await usersCollection();
   if (!col) return { success: false, error: 'Failed to connect to database' };
   try {
       const oid = toObjectId(userId);
       if (!oid) return { success: false, error: 'Invalid user id' };
       const data = await col.findOne({ _id: oid }, { projection: { _id: 1, preferences: 1 } });
       if (!data) return { success: false, error: 'User not found' };
       return { success: true, data: [rowToUserPreferences(normalizePreferenceRow(data))] };
   } catch (e) {
       return { success: false, error: (e as Error).message };
   }
}
```
This function gets the nested UserPreference object inside a user document, using an _id based ‘find()’ on the collection.
