import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewArchivedOpeningsComponent } from './view-archived-openings.component';

describe('ViewArchivedOpeningsComponent', () => {
  let component: ViewArchivedOpeningsComponent;
  let fixture: ComponentFixture<ViewArchivedOpeningsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewArchivedOpeningsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewArchivedOpeningsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
