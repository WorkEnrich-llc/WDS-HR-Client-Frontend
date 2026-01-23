import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface JobCreationData {
    main_information: {
        job_title_id?: number;
        employment_type?: number;
        work_mode?: number;
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

    // Subject to trigger create/update from header button
    private triggerCreateUpdateSubject = new Subject<void>();
    public triggerCreateUpdate$ = this.triggerCreateUpdateSubject.asObservable();

    // Cached data for dropdowns
    private cachedJobTitles: any[] = [];
    private cachedBranches: any[] = [];
    private cachedWorkSchedules: any[] = [];

    triggerCreateUpdate(): void {
        this.triggerCreateUpdateSubject.next();
    }

    // Job Titles cache
    getCachedJobTitles(): any[] {
        return this.cachedJobTitles;
    }

    setCachedJobTitles(jobTitles: any[]): void {
        this.cachedJobTitles = jobTitles;
    }

    // Branches cache
    getCachedBranches(): any[] {
        return this.cachedBranches;
    }

    setCachedBranches(branches: any[]): void {
        this.cachedBranches = branches;
    }

    // Work Schedules cache
    getCachedWorkSchedules(): any[] {
        return this.cachedWorkSchedules;
    }

    setCachedWorkSchedules(workSchedules: any[]): void {
        this.cachedWorkSchedules = workSchedules;
    }

    // Clear all cached data
    clearCache(): void {
        this.cachedJobTitles = [];
        this.cachedBranches = [];
        this.cachedWorkSchedules = [];
    }

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
        // Merge with existing recruiter_dynamic_fields instead of replacing
        const existingFields = currentData.recruiter_dynamic_fields || {};
        const mergedFields = {
            ...existingFields,
            ...fields
        };
        this.jobDataSubject.next({
            ...currentData,
            recruiter_dynamic_fields: mergedFields
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
