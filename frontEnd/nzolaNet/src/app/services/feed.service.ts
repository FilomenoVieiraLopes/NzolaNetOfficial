import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  // Current Logged In User Mock
  private currentUser: User = {
    id: 1,
    name: 'Marcus Oliveira',
    username: 'marcus_nzola',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdzPi0vCSni9Es6YD6Y_Z0oUy59_QqDDDTuBKl0NImYvsxiJ1NIFKjnsOyQY8VpqzTVLPBNE8xtzlZOUJ79lPvHaEubQR-xKIzIDtkyNUnqcZlBm10U2DaRLZALKwDuaVCkBu8NJTzj6zbiA9yGidzCkv-wGPZLX5BXiLlotnyrj5XhRq-co9vDzWpnzNVIsG2wVMtZfn7lv95eSMmWjac7UQx2wqEfNS2i7gViPTm60h7ORwkgd4p2FiK2bmlCGfrwALv0_j0coU',
    is_verified: true
  };

  // Mock Users
  private mockUsers: User[] = [
    this.currentUser,
    {
      id: 2,
      name: 'Marcus Thorne',
      username: 'mthorne_design',
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIHVh1HTWx9LElpPQBOe5qPZ9VzkjuMIGKS-toOS2lKV7uSSvPG-_5NMlaIujU9n7VpCDOTFvfkkmEkIhZ6dXnDtcfYxOd2kYtgRuX1pMIjBuc2c1b1h7lzMVSLpaDDo-ryWkg_JQE5hHIujH4pPJ6I2vGsfeALmTw9YBbqR5PStzviE9OwEM3lDXtoc2eSlrqMLeCU8AojuVFyJT6Exv8khmTYKYpaVhwgDAOl71AVOEpgQN2mmakWYCst_PbrcOXBU0qiIVqUr8',
      is_verified: true
    },
    {
      id: 3,
      name: 'Soraia Mendes',
      username: 'soraiamendes',
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZ0OV3c5BeDlQGvmGrQChKuY4Y1sN4sBz_CPWemC4J3va2Co-nU4Mha0CdkKCn1BwdpzEEbsfYrXgDABUT0_BNnyeaujuo3KOZHgq_V8p9kZPvcb9SJH-UeW2ZPl_3jXH1cmB40bDWuDSwHSaY5DLiA0r1kDihcsW8QO9b5P8KJFcAlrREaW76XwqdonfWFDOd6VssjCKqYdeCZ0j34JZ0FDiKsdcApsnPSYs8kR2wyheNsJbly8MtooepXWtk92KQV2KSTZ5l304',
      is_verified: false
    }
  ];

  // Mock Data Memory Store
  private posts: Post[] = [
    {
      id: 1,
      user_id: 2,
      user: this.mockUsers[1],
      content: 'Just finished the latest conceptual layout for the NzolaNet interface. We\'re leaning heavily into white space and high-contrast typography to create a truly premium experience. What do you guys think about this "Gallery-first" approach? 🎨✨',
      media_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAz6Ddy5gS3XrmhmyiadExGszOZ1_RKa2oWjwfbnL9GpJ4f34eEGl99J4xL_Zlz6-PhUDmr6dQshzKxoa86cAi5XcvSxi37FlyMsbNLd5pPSj5OSClQyQ29Zh5YvWQcMVf4tdy-CB-CGXYamO3s3Lk-kKe4n0W4aAR3vnuEFkDoAL9aLBWYNdoSBNotJpLxN0luGosUD66gKwA_SWIzF3QGWN6WE0esmcxoiDHMRgoarJglhwmy1Z07GzFFKvOEN4y52B1Lc4XpV7E',
      media_type: 'image',
      likes_count: 1200,
      comments_count: 84,
      is_public: true,
      location: 'Lisboa, Portugal',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      comments: [
        {
          id: 101,
          post_id: 1,
          user_id: 3,
          user: this.mockUsers[2],
          content: 'The fluid spacing is a game changer. It feels much more organic on mobile than fixed stack units. Can\'t wait to see the documentation!',
          likes_count: 24,
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 2,
      user_id: 3,
      user: this.mockUsers[2],
      content: 'The secret to a successful digital product isn\'t adding more features. It\'s about perfecting the three things your users actually do every day. Radical simplicity is the ultimate sophistication. 💎',
      media_url: null,
      media_type: null,
      likes_count: 432,
      comments_count: 12,
      is_public: true,
      location: null,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      comments: []
    }
  ];

  constructor() { }

  getCurrentUser(): User {
    return this.currentUser;
  }

  // GET /api/posts
  getPosts(): Observable<ApiResponse<Post[]>> {
    return of({
      status: 'success' as const,
      data: [...this.posts],
      message: 'Posts retrieved successfully'
    }).pipe(delay(600)); // Simulate 600ms network latency
  }

  // GET /api/posts/{id}
  getPost(id: number): Observable<ApiResponse<Post>> {
    const post = this.posts.find(p => p.id === id);
    if (post) {
      return of({
        status: 'success' as const,
        data: post,
        message: 'Post retrieved successfully'
      }).pipe(delay(300));
    } else {
      throw new Error('Post not found');
    }
  }

  // POST /api/posts
  createPost(data: Partial<Post>): Observable<ApiResponse<Post>> {
    const newPost: Post = {
      id: this.posts.length + 1,
      user_id: this.currentUser.id,
      user: this.currentUser,
      content: data.content || '',
      media_url: data.media_url || null,
      media_type: data.media_type || null,
      likes_count: 0,
      comments_count: 0,
      is_public: data.is_public ?? true,
      location: data.location || null,
      created_at: new Date().toISOString(),
      comments: []
    };

    // Add to top of feed
    this.posts.unshift(newPost);

    return of({
      status: 'success' as const,
      data: newPost,
      message: 'Post created successfully'
    }).pipe(delay(800));
  }

  // POST /api/posts/{id}/comments
  addComment(postId: number, content: string): Observable<ApiResponse<Comment>> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    const newComment: Comment = {
      id: Math.floor(Math.random() * 1000) + 200,
      post_id: postId,
      user_id: this.currentUser.id,
      user: this.currentUser,
      content: content,
      likes_count: 0,
      created_at: new Date().toISOString()
    };

    post.comments = post.comments || [];
    post.comments.push(newComment);
    post.comments_count++;

    return of({
      status: 'success' as const,
      data: newComment,
      message: 'Comment added successfully'
    }).pipe(delay(400));
  }
}
