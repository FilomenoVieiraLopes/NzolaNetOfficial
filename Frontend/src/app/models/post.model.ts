import { User } from './user.model';
import { Comment } from './comment.model';

export interface Post {
    id: number;
    user_id: number;
    user?: User;
    content: string;
    media_url: string | null;
    media_type: 'image' | 'video' | null;
    likes_count: number;
    comments_count: number;
    is_public: boolean;
    location: string | null;
    created_at: string;
    comments?: Comment[];
}
