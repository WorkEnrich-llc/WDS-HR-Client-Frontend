import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllJobTitlesComponent } from './all-job-titles.component';

describe('AllJobTitlesComponent', () => {
  let component: AllJobTitlesComponent;
  let fixture: ComponentFixture<AllJobTitlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllJobTitlesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllJobTitlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
