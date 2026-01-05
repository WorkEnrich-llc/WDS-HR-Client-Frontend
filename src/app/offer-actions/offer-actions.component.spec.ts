import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfferActionsComponent } from './offer-actions.component';

describe('OfferActionsComponent', () => {
  let component: OfferActionsComponent;
  let fixture: ComponentFixture<OfferActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfferActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
