import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientJobBoardComponent } from './client-job-board.component';

describe('ClientJobBoardComponent', () => {
  let component: ClientJobBoardComponent;
  let fixture: ComponentFixture<ClientJobBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientJobBoardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientJobBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});




