
export class Cache {
    static instance: Cache | null = null;
    private cache: Map<string, any>;

    private constructor() {
        this.cache = new Map();
    }

    static getInstance(): Cache {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }
        return Cache.instance;
    }

    set(key: string, value: any) {
        this.cache.set(key, value);
    }

    get(key: string): any | undefined {
        return this.cache.get(key);
    }

    has(key: string): boolean {
        return this.cache.has(key);
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}