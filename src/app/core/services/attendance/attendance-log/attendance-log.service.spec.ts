import { TestBed } from '@angular/core/testing';

import { AttendanceLogService } from './attendance-log.service';

describe('AttendanceLogService', () => {
  let service: AttendanceLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttendanceLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
