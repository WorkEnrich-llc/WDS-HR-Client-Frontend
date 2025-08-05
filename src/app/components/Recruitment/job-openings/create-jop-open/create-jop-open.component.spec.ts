import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateJopOpenComponent } from './create-jop-open.component';

describe('CreateJopOpenComponent', () => {
  let component: CreateJopOpenComponent;
  let fixture: ComponentFixture<CreateJopOpenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateJopOpenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateJopOpenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
