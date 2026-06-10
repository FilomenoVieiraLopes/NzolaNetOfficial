export interface ApiResponse<T> {
    status: 'success' | 'error';
    data: T;
    message?: string;
    meta?: PaginationMeta;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}
