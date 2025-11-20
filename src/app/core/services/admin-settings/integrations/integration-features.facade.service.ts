import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BranchesService } from '../../od/branches/branches.service';
import { JobsService } from '../../od/jobs/jobs.service';
import { DepartmentsService } from '../../od/departments/departments.service';
import { EmployeeService } from '../../personnel/employees/employee.service';
import { WorkSchaualeService } from '../../attendance/work-schaduale/work-schauale.service';

export interface FeatureItem {
    id: number;
    name: string;
    code?: string;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class IntegrationFeaturesFacadeService {
    private branchesService = inject(BranchesService);
    private jobsService = inject(JobsService);
    private departmentsService = inject(DepartmentsService);
    private employeeService = inject(EmployeeService);
    private workScheduleService = inject(WorkSchaualeService);

    /**
     * Load items for a specific feature
     */
    loadFeatureItems(featureName: string, searchTerm?: string): Observable<FeatureItem[]> {
        switch (featureName) {
            case 'Branches':
                return this.loadBranches(searchTerm);
            case 'JobTitles':
                return this.loadJobTitles(searchTerm);
            case 'Departments':
                return this.loadDepartments(searchTerm);
            case 'Sections':
                return this.loadDepartments(searchTerm); // For sections, first load departments
            case 'Employees':
                return this.loadEmployees(searchTerm);
            case 'WorkSchedules':
                return this.loadWorkSchedules(searchTerm);
            default:
                return new Observable(observer => {
                    observer.next([]);
                    observer.complete();
                });
        }
    }

    /**
     * Load sections for a specific department
     */
    loadSectionsForDepartment(departmentId: number): Observable<FeatureItem[]> {
        return this.departmentsService.showDepartment(departmentId).pipe(
            map((response: any) => {
                const sections = response?.data?.object_info?.sections || [];
                return sections.map((section: any) => ({
                    id: section.id,
                    name: section.name,
                    code: section.code,
                    department_id: departmentId
                }));
            })
        );
    }

    /**
     * Load branches
     */
    private loadBranches(searchTerm?: string): Observable<FeatureItem[]> {
        return this.branchesService.getAllBranches(1, 10000, {
            search: searchTerm || undefined
        }).pipe(
            map((response: any) => {
                const items = response?.data?.list_items || [];
                return items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    code: item.code,
                    location: item.location
                }));
            })
        );
    }

    /**
     * Load job titles
     */
    private loadJobTitles(searchTerm?: string): Observable<FeatureItem[]> {
        return this.jobsService.getAllJobTitles(1, 10000, {
            search: searchTerm || undefined
        }).pipe(
            map((response: any) => {
                const items = response?.data?.list_items || [];
                return items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    code: item.code
                }));
            })
        );
    }

    /**
     * Load departments
     */
    private loadDepartments(searchTerm?: string): Observable<FeatureItem[]> {
        return this.departmentsService.getAllDepartment(1, 10000, {
            search: searchTerm || undefined
        }).pipe(
            map((response: any) => {
                const items = response?.data?.list_items || [];
                return items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    code: item.code
                }));
            })
        );
    }

    /**
     * Load employees
     */
    private loadEmployees(searchTerm?: string): Observable<FeatureItem[]> {
        return this.employeeService.getAllEmployees().pipe(
            map((response: any) => {
                const items = response?.data?.list_items || [];
                let filtered = items;
                if (searchTerm) {
                    const search = searchTerm.toLowerCase();
                    filtered = items.filter((item: any) =>
                        item.contact_info?.name?.toLowerCase().includes(search) ||
                        item.code?.toLowerCase().includes(search) ||
                        item.contact_info?.email?.toLowerCase().includes(search)
                    );
                }
                return filtered.map((item: any) => ({
                    id: item.id,
                    name: item.contact_info?.name || 'Unknown',
                    code: item.code,
                    email: item.contact_info?.email
                }));
            })
        );
    }

    /**
     * Load work schedules
     */
    private loadWorkSchedules(searchTerm?: string): Observable<FeatureItem[]> {
        return this.workScheduleService.getAllWorkSchadule(1, 10000, {
            search: searchTerm || undefined
        }).pipe(
            map((response: any) => {
                const items = response?.data?.list_items || [];
                return items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    code: item.code
                }));
            })
        );
    }
}

