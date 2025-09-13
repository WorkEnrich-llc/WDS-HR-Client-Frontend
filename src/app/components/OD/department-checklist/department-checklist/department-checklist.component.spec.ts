import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentChecklistComponent } from './department-checklist.component';

describe('DepartmentChecklistComponent', () => {
  let component: DepartmentChecklistComponent;
  let fixture: ComponentFixture<DepartmentChecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentChecklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
