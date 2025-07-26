import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPayrollRunsComponent } from './view-payroll-runs.component';

describe('ViewPayrollRunsComponent', () => {
  let component: ViewPayrollRunsComponent;
  let fixture: ComponentFixture<ViewPayrollRunsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewPayrollRunsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewPayrollRunsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
