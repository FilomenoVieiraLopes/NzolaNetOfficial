export interface User {
  id: number;
  name: string;
  email?: string | null;
  avatar_url: string | null;
  cover_url?: string | null;
  bio: string | null;
  privacy: 'public' | 'private' | string;
  role?: 'user' | 'admin' | string;
  created_at?: string;
  follow_status?: 'pending' | 'accepted' | string | null;
  can_view_private_content?: boolean;
  followers_count?: number;
  following_count?: number;
}
