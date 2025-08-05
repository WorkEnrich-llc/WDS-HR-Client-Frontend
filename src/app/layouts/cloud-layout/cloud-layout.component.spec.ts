import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudLayoutComponent } from './cloud-layout.component';

describe('CloudLayoutComponent', () => {
  let component: CloudLayoutComponent;
  let fixture: ComponentFixture<CloudLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloudLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
