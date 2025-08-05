import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequiredDetailsComponent } from './required-details.component';

describe('RequiredDetailsComponent', () => {
  let component: RequiredDetailsComponent;
  let fixture: ComponentFixture<RequiredDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequiredDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequiredDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
