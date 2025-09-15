import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyTestChartComponent } from './company-test-chart.component';

describe('CompanyTestChartComponent', () => {
  let component: CompanyTestChartComponent;
  let fixture: ComponentFixture<CompanyTestChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyTestChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyTestChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
