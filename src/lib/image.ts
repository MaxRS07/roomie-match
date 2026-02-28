
export async function fetchImage(imageUrl: string): Promise<Blob> {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        return await response.blob();
    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
}