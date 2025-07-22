import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewJopOpenComponent } from './view-jop-open.component';

describe('ViewJopOpenComponent', () => {
  let component: ViewJopOpenComponent;
  let fixture: ComponentFixture<ViewJopOpenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewJopOpenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewJopOpenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
