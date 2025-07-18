import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFullTimeComponent } from './edit-full-time.component';

describe('EditFullTimeComponent', () => {
  let component: EditFullTimeComponent;
  let fixture: ComponentFixture<EditFullTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditFullTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditFullTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
