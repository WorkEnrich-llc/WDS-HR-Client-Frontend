import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateLeaveTypesComponent } from './update-leave-types.component';

describe('UpdateLeaveTypesComponent', () => {
  let component: UpdateLeaveTypesComponent;
  let fixture: ComponentFixture<UpdateLeaveTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateLeaveTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateLeaveTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
