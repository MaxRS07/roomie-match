import { createClient } from 'redis';

const client = createClient({
    url: `redis://${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? 6379}`,
    ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
});

client.on('error', (err) => {
    console.error('[Redis] connection error:', err.message);
});

let _connected = false;

const getClient = async () => {
    if (!_connected) {
        await client.connect();
        _connected = true;
    }
    return client;
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
    try {
        const raw = await (await getClient()).get(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
    try {
        await (await getClient()).set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch {
        // cache is best-effort — never block the request
    }
};

export const cacheDel = async (...keys: string[]): Promise<void> => {
    try {
        if (keys.length) await (await getClient()).del(keys);
    } catch { }
};
