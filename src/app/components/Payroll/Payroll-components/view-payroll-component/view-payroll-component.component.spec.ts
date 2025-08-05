import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPayrollComponentComponent } from './view-payroll-component.component';

describe('ViewPayrollComponentComponent', () => {
  let component: ViewPayrollComponentComponent;
  let fixture: ComponentFixture<ViewPayrollComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewPayrollComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewPayrollComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
