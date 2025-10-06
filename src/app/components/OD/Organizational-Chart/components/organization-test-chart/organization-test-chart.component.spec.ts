import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationTestChartComponent } from './organization-test-chart.component';

describe('OrganizationTestChartComponent', () => {
  let component: OrganizationTestChartComponent;
  let fixture: ComponentFixture<OrganizationTestChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationTestChartComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OrganizationTestChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
