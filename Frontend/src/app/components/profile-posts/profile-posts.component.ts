import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile-posts',
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './profile-posts.component.html'
})
export class ProfilePostsComponent {
  @Input() posts: Post[] = [];
  @Input() currentUser: User | null = null;
  @Input() isAdmin = false;
  @Input() isLoadingMore = false;

  @Output() open = new EventEmitter<Post>();
  @Output() save = new EventEmitter<{ post: Post; content: string }>();
  @Output() delete = new EventEmitter<Post>();

  editingPostId: number | null = null;
  editPostContent = '';

  canEditPost(post: Post): boolean {
    return !!post.can_edit || Number(post.user_id) === Number(this.currentUser?.id);
  }

  canDeletePost(post: Post): boolean {
    return !!post.can_delete || Number(post.user_id) === Number(this.currentUser?.id) || this.isAdmin;
  }

  startEdit(post: Post, event: Event): void {
    event.stopPropagation();
    this.editingPostId = post.id;
    this.editPostContent = post.content;
  }

  cancelEdit(event: Event): void {
    event.stopPropagation();
    this.editingPostId = null;
    this.editPostContent = '';
  }

  saveEdit(post: Post, event: Event): void {
    event.stopPropagation();
    const content = this.editPostContent.trim();
    if (!content) return;

    this.save.emit({ post, content });
  }

  finishEdit(): void {
    this.editingPostId = null;
    this.editPostContent = '';
  }

  requestDelete(post: Post, event: Event): void {
    event.stopPropagation();
    this.delete.emit(post);
  }
}
