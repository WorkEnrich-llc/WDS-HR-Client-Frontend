import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAssignedRequestComponent } from './view-assigned-request.component';

describe('ViewAssignedRequestComponent', () => {
  let component: ViewAssignedRequestComponent;
  let fixture: ComponentFixture<ViewAssignedRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAssignedRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAssignedRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
