import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPartTimeComponent } from './edit-part-time.component';

describe('EditPartTimeComponent', () => {
  let component: EditPartTimeComponent;
  let fixture: ComponentFixture<EditPartTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPartTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPartTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
