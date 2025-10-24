import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface JobCreationData {
    main_information: {
        job_title_id?: number;
        employment_type?: number;
        work_schedule_id?: number;
        days_on_site?: number;
        branch_id?: number;
        time_limit?: number;
        cv_limit?: number;
    };
    recruiter_dynamic_fields?: any;
}

@Injectable({
    providedIn: 'root'
})
export class JobCreationDataService {
    private jobDataSubject = new BehaviorSubject<JobCreationData>({
        main_information: {}
    });

    public jobData$ = this.jobDataSubject.asObservable();

    updateMainInformation(data: Partial<JobCreationData['main_information']>): void {
        const currentData = this.jobDataSubject.value;
        this.jobDataSubject.next({
            ...currentData,
            main_information: {
                ...currentData.main_information,
                ...data
            }
        });
    }

    updateDynamicFields(fields: any): void {
        const currentData = this.jobDataSubject.value;
        this.jobDataSubject.next({
            ...currentData,
            recruiter_dynamic_fields: fields
        });
    }

    getCurrentData(): JobCreationData {
        return this.jobDataSubject.value;
    }

    clearData(): void {
        this.jobDataSubject.next({
            main_information: {}
        });
    }
}
