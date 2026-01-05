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
     * Load items for a specific feature with pagination
     */
    loadFeatureItems(featureName: string, searchTerm?: string, page: number = 1, perPage: number = 10): Observable<{ items: FeatureItem[]; totalItems: number; totalPages: number; currentPage: number }> {
        switch (featureName) {
            case 'Branches':
                return this.loadBranches(searchTerm, page, perPage);
            case 'JobTitles':
                return this.loadJobTitles(searchTerm, page, perPage);
            case 'Departments':
                return this.loadDepartments(searchTerm, page, perPage);
            case 'Sections':
                return this.loadDepartments(searchTerm, page, perPage); // For sections, first load departments
            case 'Employees':
                return this.loadEmployees(searchTerm, page, perPage);
            case 'WorkSchedules':
                return this.loadWorkSchedules(searchTerm, page, perPage);
            default:
                return new Observable(observer => {
                    observer.next({ items: [], totalItems: 0, totalPages: 0, currentPage: 1 });
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
     * Load branches with pagination
     */
    private loadBranches(searchTerm?: string, page: number = 1, perPage: number = 10): Observable<{ items: FeatureItem[]; totalItems: number; totalPages: number; currentPage: number }> {
        return this.branchesService.getAllBranches(page, perPage, {
            search: searchTerm || undefined
        }).pipe(
            map((response: any) => {
                const items = response?.data?.list_items || [];
                const totalItems = response?.data?.total_items || 0;
                const totalPages = response?.data?.total_pages || 1;
                const currentPage = response?.data?.page || page;
                return {
                    items: items.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        code: item.code,
                        location: item.location
                    })),
                    totalItems,
                    totalPages,
                    currentPage
                };
            })
        );
    }

    /**
     * Load job titles with pagination
     */
    private loadJobTitles(searchTerm?: string, page: number = 1, perPage: number = 10): Observable<{ items: FeatureItem[]; totalItems: number; totalPages: number; currentPage: number }> {
        return this.jobsService.getAllJobTitles(page, perPage, {
            search: searchTerm || undefined
        }).pipe(
            map((response: any) => {
                const items = response?.data?.list_items || [];
                const totalItems = response?.data?.total_items || 0;
                const totalPages = response?.data?.total_pages || 1;
                const currentPage = response?.data?.page || page;
                return {
                    items: items.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        code: item.code
                    })),
                    totalItems,
                    totalPages,
                    currentPage
                };
            })
        );
    }

    /**
     * Load departments with pagination
     */
    private loadDepartments(searchTerm?: string, page: number = 1, perPage: number = 10): Observable<{ items: FeatureItem[]; totalItems: number; totalPages: number; currentPage: number }> {
        return this.departmentsService.getAllDepartment(page, perPage, {
            search: searchTerm || undefined
        }).pipe(
            map((response: any) => {
                const items = response?.data?.list_items || [];
                const totalItems = response?.data?.total_items || 0;
                const totalPages = response?.data?.total_pages || 1;
                const currentPage = response?.data?.page || page;
                return {
                    items: items.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        code: item.code
                    })),
                    totalItems,
                    totalPages,
                    currentPage
                };
            })
        );
    }

    /**
     * Load employees with pagination
     */
    private loadEmployees(searchTerm?: string, page: number = 1, perPage: number = 10): Observable<{ items: FeatureItem[]; totalItems: number; totalPages: number; currentPage: number }> {
        return this.employeeService.getEmployees(page, perPage, searchTerm || '', {}).pipe(
            map((response: any) => {
                const items = response?.data?.list_items || [];
                const totalItems = response?.data?.total_items || 0;
                const totalPages = response?.data?.total_pages || 1;
                const currentPage = response?.data?.page || page;
                return {
                    items: items.map((item: any) => ({
                        id: item.object_info?.id,
                        name: item.object_info?.contact_info?.name || 'Unknown',
                        code: item.object_info?.code,
                        email: item.object_info?.contact_info?.email
                    })),
                    totalItems,
                    totalPages,
                    currentPage
                };
            })
        );
    }

    /**
     * Load work schedules with pagination
     */
    private loadWorkSchedules(searchTerm?: string, page: number = 1, perPage: number = 10): Observable<{ items: FeatureItem[]; totalItems: number; totalPages: number; currentPage: number }> {
        return this.workScheduleService.getAllWorkSchadule(page, perPage, {
            search: searchTerm || undefined
        }).pipe(
            map((response: any) => {
                const items = response?.data?.list_items || [];
                const totalItems = response?.data?.total_items || 0;
                const totalPages = response?.data?.total_pages || 1;
                const currentPage = response?.data?.page || page;
                return {
                    items: items.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        code: item.code
                    })),
                    totalItems,
                    totalPages,
                    currentPage
                };
            })
        );
    }
}

