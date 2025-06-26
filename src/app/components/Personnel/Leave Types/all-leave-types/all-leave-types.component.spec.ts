import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllLeaveTypesComponent } from './all-leave-types.component';

describe('AllLeaveTypesComponent', () => {
  let component: AllLeaveTypesComponent;
  let fixture: ComponentFixture<AllLeaveTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllLeaveTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllLeaveTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
