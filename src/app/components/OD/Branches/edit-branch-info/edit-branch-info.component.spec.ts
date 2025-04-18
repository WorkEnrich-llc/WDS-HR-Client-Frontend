import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBranchInfoComponent } from './edit-branch-info.component';

describe('EditBranchInfoComponent', () => {
  let component: EditBranchInfoComponent;
  let fixture: ComponentFixture<EditBranchInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBranchInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditBranchInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
