# Editing an Existing Document

```ts
export async function updateListing(listingId: string, data: Partial<{
   title: string; description: string; rent_price: string; location: string;
   city: string; state: string; zip_code: string; available_date: string;
   num_rooms: string; num_bathrooms: string; is_active: string;
}>): Promise<QueryResult> {
   const col = await listingsCollection();
   if (!col) return { success: false, error: 'Failed to connect to database' };
   try {
       const oid = toObjectId(listingId);
       if (!oid) return { success: false, error: 'Invalid listing id' };
       const result = await col.updateOne({ _id: oid }, { $set: data });
       if (result.matchedCount === 0) return { success: false, error: 'Listing not found' };
       return { success: true, data: { affected: result.modifiedCount } };
   } catch (e) {
       return { success: false, error: (e as Error).message };
   }
}
```
Updates a listing document by finding the listing document with a matching _id. Since the database is JSON on the application side, you can conveniently pass in a partial listing and update based on the non-null values.