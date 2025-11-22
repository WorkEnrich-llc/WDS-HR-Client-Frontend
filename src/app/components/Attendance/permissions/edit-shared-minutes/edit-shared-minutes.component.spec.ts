import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSharedMinutesComponent } from './edit-shared-minutes.component';

describe('EditSharedMinutesComponent', () => {
  let component: EditSharedMinutesComponent;
  let fixture: ComponentFixture<EditSharedMinutesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSharedMinutesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSharedMinutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
