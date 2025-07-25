import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllPayrollComponentsComponent } from './all-payroll-components.component';

describe('AllPayrollComponentsComponent', () => {
  let component: AllPayrollComponentsComponent;
  let fixture: ComponentFixture<AllPayrollComponentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPayrollComponentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllPayrollComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
