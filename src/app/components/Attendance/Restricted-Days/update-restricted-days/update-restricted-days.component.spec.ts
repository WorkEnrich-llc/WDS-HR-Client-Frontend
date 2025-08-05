import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateRestrictedDaysComponent } from './update-restricted-days.component';

describe('UpdateRestrictedDaysComponent', () => {
  let component: UpdateRestrictedDaysComponent;
  let fixture: ComponentFixture<UpdateRestrictedDaysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateRestrictedDaysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateRestrictedDaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
