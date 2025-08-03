import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartGridSheetComponent } from './smart-grid-sheet.component';

describe('SmartGridSheetComponent', () => {
  let component: SmartGridSheetComponent;
  let fixture: ComponentFixture<SmartGridSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartGridSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartGridSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
