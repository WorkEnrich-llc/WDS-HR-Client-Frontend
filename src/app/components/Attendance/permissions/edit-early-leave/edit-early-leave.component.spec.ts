import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditEarlyLeaveComponent } from './edit-early-leave.component';

describe('EditEarlyLeaveComponent', () => {
  let component: EditEarlyLeaveComponent;
  let fixture: ComponentFixture<EditEarlyLeaveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEarlyLeaveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditEarlyLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
