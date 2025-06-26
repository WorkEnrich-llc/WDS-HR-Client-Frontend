import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllWorkflowComponent } from './all-workflow.component';

describe('AllWorkflowComponent', () => {
  let component: AllWorkflowComponent;
  let fixture: ComponentFixture<AllWorkflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllWorkflowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
