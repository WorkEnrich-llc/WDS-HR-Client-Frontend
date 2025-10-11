import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkelatonLoadingComponent } from './skelaton-loading.component';

describe('SkelatonLoadingComponent', () => {
  let component: SkelatonLoadingComponent;
  let fixture: ComponentFixture<SkelatonLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkelatonLoadingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkelatonLoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
