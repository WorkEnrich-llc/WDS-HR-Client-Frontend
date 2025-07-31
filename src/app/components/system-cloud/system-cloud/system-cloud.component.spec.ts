import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemCloudComponent } from './system-cloud.component';

describe('SystemCloudComponent', () => {
  let component: SystemCloudComponent;
  let fixture: ComponentFixture<SystemCloudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemCloudComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemCloudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
