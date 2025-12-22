import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePayrollComponentComponent } from './manage-payroll-component.component';

describe('ManagePayrollComponentComponent', () => {
  let component: ManagePayrollComponentComponent;
  let fixture: ComponentFixture<ManagePayrollComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagePayrollComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagePayrollComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

