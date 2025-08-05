import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllPayrollRunsComponent } from './all-payroll-runs.component';

describe('AllPayrollRunsComponent', () => {
  let component: AllPayrollRunsComponent;
  let fixture: ComponentFixture<AllPayrollRunsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPayrollRunsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllPayrollRunsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
