import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllBranchesComponent } from './all-branches.component';

describe('AllBranchesComponent', () => {
  let component: AllBranchesComponent;
  let fixture: ComponentFixture<AllBranchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllBranchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllBranchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
