import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDepartmentChecklistsComponent } from './edit-department-checklists.component';

describe('EditDepartmentChecklistsComponent', () => {
  let component: EditDepartmentChecklistsComponent;
  let fixture: ComponentFixture<EditDepartmentChecklistsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDepartmentChecklistsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditDepartmentChecklistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
