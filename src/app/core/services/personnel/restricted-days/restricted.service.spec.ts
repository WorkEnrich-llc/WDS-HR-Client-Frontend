import { TestBed } from '@angular/core/testing';

import { RestrictedService } from './restricted.service';

describe('RestrictedService', () => {
  let service: RestrictedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RestrictedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
