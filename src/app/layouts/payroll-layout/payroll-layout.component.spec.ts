import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollLayoutComponent } from './payroll-layout.component';

describe('PayrollLayoutComponent', () => {
  let component: PayrollLayoutComponent;
  let fixture: ComponentFixture<PayrollLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrollLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrollLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
