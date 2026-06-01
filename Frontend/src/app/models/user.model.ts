export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  cover_url?: string | null;
  bio: string | null;
  privacy: 'public' | 'private' | string;
  role?: 'user' | 'admin' | string;
  created_at?: string;
}
