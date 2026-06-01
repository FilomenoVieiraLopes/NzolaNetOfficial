export interface Notification {
  id: number;
  user_id: number;
  type: string;
  related_id: number | null;
  actor_id?: number | null;
  actor_name?: string | null;
  actor_avatar?: string | null;
  post_id?: number | null;
  post_excerpt?: string | null;
  read: boolean;
  created_at: string;
}
