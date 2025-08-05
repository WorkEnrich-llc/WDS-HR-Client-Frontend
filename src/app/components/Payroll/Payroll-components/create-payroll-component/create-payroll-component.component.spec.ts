import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePayrollComponentComponent } from './create-payroll-component.component';

describe('CreatePayrollComponentComponent', () => {
  let component: CreatePayrollComponentComponent;
  let fixture: ComponentFixture<CreatePayrollComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePayrollComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePayrollComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
