import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewNewJoinerComponent } from './view-new-joiner.component';

describe('ViewNewJoinerComponent', () => {
  let component: ViewNewJoinerComponent;
  let fixture: ComponentFixture<ViewNewJoinerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewNewJoinerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewNewJoinerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
