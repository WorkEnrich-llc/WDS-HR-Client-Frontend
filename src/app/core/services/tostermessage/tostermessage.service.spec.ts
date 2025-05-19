import { TestBed } from '@angular/core/testing';

import { TostermessageService } from './tostermessage.service';

describe('TostermessageService', () => {
  let service: TostermessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TostermessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
