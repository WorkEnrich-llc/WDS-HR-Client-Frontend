import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOnboardingComponent } from './edit-onboarding.component';

describe('EditOnboardingComponent', () => {
  let component: EditOnboardingComponent;
  let fixture: ComponentFixture<EditOnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditOnboardingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
