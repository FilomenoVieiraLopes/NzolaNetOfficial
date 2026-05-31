import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostsGridComponent } from './posts-grid.component';

describe('PostsGridComponent', () => {
  let component: PostsGridComponent;
  let fixture: ComponentFixture<PostsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostsGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
