import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewRejectedComponent } from './interview-rejected.component';

describe('InterviewRejectedComponent', () => {
  let component: InterviewRejectedComponent;
  let fixture: ComponentFixture<InterviewRejectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewRejectedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewRejectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
