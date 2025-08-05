import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRestrictedDaysComponent } from './view-restricted-days.component';

describe('ViewRestrictedDaysComponent', () => {
  let component: ViewRestrictedDaysComponent;
  let fixture: ComponentFixture<ViewRestrictedDaysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRestrictedDaysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewRestrictedDaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
