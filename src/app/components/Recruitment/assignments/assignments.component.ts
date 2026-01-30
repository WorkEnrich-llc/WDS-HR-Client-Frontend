import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { TableComponent } from '../../shared/table/table.component';
import { JobOpeningsService } from 'app/core/services/recruitment/job-openings/job-openings.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-assignments',
    imports: [
        FormsModule,
        RouterModule,
        PageHeaderComponent,
        DatePipe,
        TableComponent
    ],
    templateUrl: './assignments.component.html',
    styleUrl: './assignments.component.css'
})
export class AssignmentsComponent implements OnInit, OnDestroy {
    private jobOpeningsService = inject(JobOpeningsService);
    private router = inject(Router);
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    isLoading: boolean = false;
    assignments: any[] = [];
    currentPage: number = 1;
    pageSize: number = 10;
    totalCount: number = 0;
    searchQuery: string = '';

    ngOnInit(): void {
        this.setupSearch();
        this.fetchAssignments();
    }

    setupSearch(): void {
        this.searchSubject
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                filter((query: string) => {
                    const trimmedQuery = query.trim();
                    return trimmedQuery !== '' || query === '';
                }),
                switchMap((query: string) => {
                    this.currentPage = 1;
                    const trimmedQuery = query.trim();
                    this.isLoading = true;
                    return this.jobOpeningsService.getAllAssignments(
                        this.currentPage,
                        this.pageSize,
                        trimmedQuery
                    );
                }),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (res) => {
                    const list = res?.data?.list_items ?? res?.list_items ?? [];
                    this.assignments = Array.isArray(list) ? list : [];
                    this.totalCount = res?.data?.pagination?.total ?? 0;
                    this.isLoading = false;
                },
                error: () => {
                    this.assignments = [];
                    this.isLoading = false;
                }
            });
    }

    fetchAssignments(search: string = ''): void {
        this.isLoading = true;
        this.jobOpeningsService.getAllAssignments(this.currentPage, this.pageSize, search).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (res) => {
                const list = res?.data?.list_items ?? res?.list_items ?? [];
                this.assignments = Array.isArray(list) ? list : [];
                this.totalCount = res?.data?.pagination?.total ?? 0;
                this.isLoading = false;
            },
            error: () => {
                this.assignments = [];
                this.isLoading = false;
            }
        });
    }

    onPageChange(newPage: number): void {
        this.currentPage = newPage;
        this.fetchAssignments(this.searchQuery.trim());
    }

    onItemsPerPageChange(newPageSize: number): void {
        this.pageSize = newPageSize;
        this.currentPage = 1;
        this.fetchAssignments(this.searchQuery.trim());
    }

    onSearchChange(): void {
        this.searchSubject.next(this.searchQuery);
    }

    navigateToView(assignmentId: number): void {
        this.router.navigate(['/assignments', assignmentId]);
    }

    navigateToEdit(assignmentId: number): void {
        this.router.navigate(['/assignments/edit', assignmentId]);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
