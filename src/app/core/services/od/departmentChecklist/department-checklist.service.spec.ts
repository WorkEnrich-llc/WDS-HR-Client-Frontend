import { TestBed } from '@angular/core/testing';

import { DepartmentChecklistService } from './department-checklist.service';

describe('DepartmentChecklistService', () => {
  let service: DepartmentChecklistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DepartmentChecklistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
