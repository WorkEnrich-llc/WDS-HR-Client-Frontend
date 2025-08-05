import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllArchivedOpeningsComponent } from './all-archived-openings.component';

describe('AllArchivedOpeningsComponent', () => {
  let component: AllArchivedOpeningsComponent;
  let fixture: ComponentFixture<AllArchivedOpeningsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllArchivedOpeningsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllArchivedOpeningsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
