import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRestrictedDaysComponent } from './create-restricted-days.component';

describe('CreateRestrictedDaysComponent', () => {
  let component: CreateRestrictedDaysComponent;
  let fixture: ComponentFixture<CreateRestrictedDaysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateRestrictedDaysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateRestrictedDaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
