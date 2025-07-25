import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceLayoutComponent } from './attendance-layout.component';

describe('AttendanceLayoutComponent', () => {
  let component: AttendanceLayoutComponent;
  let fixture: ComponentFixture<AttendanceLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
