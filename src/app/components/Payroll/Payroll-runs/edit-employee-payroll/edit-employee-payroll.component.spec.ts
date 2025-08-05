import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditEmployeePayrollComponent } from './edit-employee-payroll.component';

describe('EditEmployeePayrollComponent', () => {
  let component: EditEmployeePayrollComponent;
  let fixture: ComponentFixture<EditEmployeePayrollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEmployeePayrollComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditEmployeePayrollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
