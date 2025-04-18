import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewBranchComponent } from './create-new-branch.component';

describe('CreateNewBranchComponent', () => {
  let component: CreateNewBranchComponent;
  let fixture: ComponentFixture<CreateNewBranchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewBranchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewBranchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
