import { TestBed } from '@angular/core/testing';

import { WorkSchaualeService } from './work-schauale.service';

describe('WorkSchaualeService', () => {
  let service: WorkSchaualeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkSchaualeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
