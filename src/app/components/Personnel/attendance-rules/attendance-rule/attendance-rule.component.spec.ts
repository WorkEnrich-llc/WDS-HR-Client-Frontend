import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceRuleComponent } from './attendance-rule.component';

describe('AttendanceRuleComponent', () => {
  let component: AttendanceRuleComponent;
  let fixture: ComponentFixture<AttendanceRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceRuleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
