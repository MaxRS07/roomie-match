export interface QueryParams {
    query: string;
    params?: any[];
}

export interface QueryResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}
