import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSalaryPortionsComponent } from './edit-salary-portions.component';

describe('EditSalaryPortionsComponent', () => {
  let component: EditSalaryPortionsComponent;
  let fixture: ComponentFixture<EditSalaryPortionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSalaryPortionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSalaryPortionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
