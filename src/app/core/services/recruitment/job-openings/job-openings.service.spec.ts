import { TestBed } from '@angular/core/testing';

import { JobOpeningsService } from './job-openings.service';

describe('JobOpeningsService', () => {
    let service: JobOpeningsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(JobOpeningsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});

