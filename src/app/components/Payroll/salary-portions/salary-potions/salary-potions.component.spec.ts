import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryPotionsComponent } from './salary-potions.component';

describe('SalaryPotionsComponent', () => {
  let component: SalaryPotionsComponent;
  let fixture: ComponentFixture<SalaryPotionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryPotionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalaryPotionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
