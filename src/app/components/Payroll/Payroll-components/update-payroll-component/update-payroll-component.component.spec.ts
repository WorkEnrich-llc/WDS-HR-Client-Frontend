import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePayrollComponentComponent } from './update-payroll-component.component';

describe('UpdatePayrollComponentComponent', () => {
  let component: UpdatePayrollComponentComponent;
  let fixture: ComponentFixture<UpdatePayrollComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePayrollComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePayrollComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
