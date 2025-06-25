import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWorkScheduleComponent } from './create-work-schedule.component';

describe('CreateWorkScheduleComponent', () => {
  let component: CreateWorkScheduleComponent;
  let fixture: ComponentFixture<CreateWorkScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWorkScheduleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateWorkScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
