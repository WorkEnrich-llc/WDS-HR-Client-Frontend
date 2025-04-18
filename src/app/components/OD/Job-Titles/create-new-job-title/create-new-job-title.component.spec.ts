import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewJobTitleComponent } from './create-new-job-title.component';

describe('CreateNewJobTitleComponent', () => {
  let component: CreateNewJobTitleComponent;
  let fixture: ComponentFixture<CreateNewJobTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewJobTitleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewJobTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
