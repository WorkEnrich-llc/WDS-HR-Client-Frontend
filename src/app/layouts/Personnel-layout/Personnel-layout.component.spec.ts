import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonnelLayoutComponent } from './Personnel-layout.component';

describe('PersonnelLayoutComponent', () => {
  let component: PersonnelLayoutComponent;
  let fixture: ComponentFixture<PersonnelLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonnelLayoutComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PersonnelLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
