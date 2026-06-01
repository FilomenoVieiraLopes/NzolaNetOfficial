import { Comment } from './comment.model';

export interface Post {
  id: number;
  author_name: string;
  author_avatar: string | null;
  user_id: number;
  content: string;
  image_url: string | null;
  video_url: string | null;
  bazes_count: number;
  comments_count: number;
  has_bazed?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  created_at: string;
  comments?: Comment[];
}
