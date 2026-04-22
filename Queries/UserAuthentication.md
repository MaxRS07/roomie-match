# User Authentication
```ts
export async function authenticateUser(email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
   const users = await usersCollection();
   if (!users) return { success: false, error: 'Failed to retrieve user' };


   try {
       const data = await users.findOne({ email, password_hash: password });
       if (!data) return { success: false, error: 'User not found' };
       return { success: true, data: rowToUser({ ...data, user_id: userIdentifier(data) }) };
   } catch (error) {
       return { success: false, error: (error as Error).message };
   }
}
```
Loads the “users” Collection with the helper method. Then finds the first user document where the email and password hash match the filters. If nothing is returned, then no users match the entered credentials, and the login fails.
