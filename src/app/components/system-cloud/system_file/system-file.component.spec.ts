import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemFileComponent } from './system-file.component';

describe('SystemFileComponent', () => {
  let component: SystemFileComponent;
  let fixture: ComponentFixture<SystemFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemFileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
