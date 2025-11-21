import { TestBed } from '@angular/core/testing';

import { EventSharedService } from './event-shared.service';

describe('EventSharedService', () => {
  let service: EventSharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventSharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
