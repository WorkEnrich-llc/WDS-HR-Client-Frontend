import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllRestrictedDaysComponent } from './all-restricted-days.component';

describe('AllRestrictedDaysComponent', () => {
  let component: AllRestrictedDaysComponent;
  let fixture: ComponentFixture<AllRestrictedDaysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllRestrictedDaysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllRestrictedDaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
