import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayFilterBoxComponent } from './overlay-filter-box.component';

describe('OverlayFilterBoxComponent', () => {
  let component: OverlayFilterBoxComponent;
  let fixture: ComponentFixture<OverlayFilterBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayFilterBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverlayFilterBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
