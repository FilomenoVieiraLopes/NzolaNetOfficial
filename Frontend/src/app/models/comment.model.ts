export interface Comment {
    id: number;
    post_id: number;
    user_id: number;
    author_name: string;
    author_avatar: string | null;
    body: string;
    can_edit: boolean;
    can_delete: boolean;
    created_at: string;
}
