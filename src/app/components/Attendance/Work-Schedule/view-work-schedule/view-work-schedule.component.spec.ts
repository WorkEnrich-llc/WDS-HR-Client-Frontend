import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewWorkScheduleComponent } from './view-work-schedule.component';

describe('ViewWorkScheduleComponent', () => {
  let component: ViewWorkScheduleComponent;
  let fixture: ComponentFixture<ViewWorkScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewWorkScheduleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewWorkScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
