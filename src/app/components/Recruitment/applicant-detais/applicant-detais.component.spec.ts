import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantDetaisComponent } from './applicant-detais.component';

describe('ApplicantDetaisComponent', () => {
  let component: ApplicantDetaisComponent;
  let fixture: ComponentFixture<ApplicantDetaisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicantDetaisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicantDetaisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
