import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttachmentAndInfoComponent } from './attachment-and-info.component';

describe('AttachmentAndInfoComponent', () => {
  let component: AttachmentAndInfoComponent;
  let fixture: ComponentFixture<AttachmentAndInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttachmentAndInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttachmentAndInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
