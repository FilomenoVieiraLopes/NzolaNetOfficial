import { User } from './user.model';

export interface Comment {
    id: number;
    post_id: number;
    user_id: number;
    user?: User;
    content: string;
    likes_count: number;
    created_at: string;
}
