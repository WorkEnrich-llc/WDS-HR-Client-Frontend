import { TestBed } from '@angular/core/testing';

import { SalaryPortionsService } from './salary-portions.service';

describe('SalaryPortionsService', () => {
  let service: SalaryPortionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalaryPortionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
