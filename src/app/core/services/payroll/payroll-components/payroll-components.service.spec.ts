import { TestBed } from '@angular/core/testing';

import { PayrollComponentsService } from './payroll-components.service';

describe('PayrollComponentsService', () => {
  let service: PayrollComponentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PayrollComponentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
