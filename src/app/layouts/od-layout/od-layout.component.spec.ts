import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdLayoutComponent } from './od-layout.component';

describe('OdLayoutComponent', () => {
  let component: OdLayoutComponent;
  let fixture: ComponentFixture<OdLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OdLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
