import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewLeaveTypeComponent } from './view-leave-type.component';

describe('ViewLeaveTypeComponent', () => {
  let component: ViewLeaveTypeComponent;
  let fixture: ComponentFixture<ViewLeaveTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewLeaveTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewLeaveTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
