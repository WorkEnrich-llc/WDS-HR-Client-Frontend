import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGoalComponent } from './edit-goal.component';

describe('EditGoalComponent', () => {
  let component: EditGoalComponent;
  let fixture: ComponentFixture<EditGoalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditGoalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditGoalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
