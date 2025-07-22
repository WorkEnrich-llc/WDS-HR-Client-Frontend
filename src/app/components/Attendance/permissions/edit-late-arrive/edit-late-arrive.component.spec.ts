import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLateArriveComponent } from './edit-late-arrive.component';

describe('EditLateArriveComponent', () => {
  let component: EditLateArriveComponent;
  let fixture: ComponentFixture<EditLateArriveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditLateArriveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditLateArriveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
