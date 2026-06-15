export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id?: number | null;
  parent_author_name?: string | null;
  author_name: string;
  author_avatar: string | null;
  body: string;
  can_edit?: boolean;
  can_delete?: boolean;
  bazes_count?: number;
  has_bazed?: boolean;
  created_at: string;
}
