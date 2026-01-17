import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, SlicePipe, NgClass } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { JobOpeningsService } from 'app/core/services/recruitment/job-openings/job-openings.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-view-assignment',
    imports: [
        SlicePipe,
        NgClass,
        PageHeaderComponent,
        PopupComponent,
        RouterLink
    ],
    providers: [DatePipe],
    templateUrl: './view-assignment.component.html',
    styleUrl: './view-assignment.component.css'
})
export class ViewAssignmentComponent implements OnInit, OnDestroy {
    private jobOpeningsService = inject(JobOpeningsService);
    private activatedRoute = inject(ActivatedRoute);
    private toasterMessageService = inject(ToasterMessageService);
    private datePipe = inject(DatePipe);
    private destroy$ = new Subject<void>();

    isLoading: boolean = false;
    assignmentId: number | null = null;
    assignment: any = null;
    objectInfo: any = null;
    breadcrumbs: any[] = [];
    formattedCreatedAt: string = '';
    formattedUpdatedAt: string = '';

    deactivateOpen = false;
    activateOpen = false;
    isActivating: boolean = false;
    isDeactivating: boolean = false;

    ngOnInit(): void {
        this.assignmentId = this.activatedRoute.snapshot.paramMap.get('id') as unknown as number;
        if (this.assignmentId) {
            this.fetchAssignmentDetails();
        }
    }

    fetchAssignmentDetails(): void {
        if (!this.assignmentId) return;

        this.isLoading = true;
        this.jobOpeningsService.getAssignmentDetails(this.assignmentId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.assignment = res?.data?.object_info ?? res?.object_info;
                    this.objectInfo = this.assignment;
                    this.updateBreadcrumbs();
                    this.formatDates();
                    this.isLoading = false;
                },
                error: () => {
                    this.isLoading = false;
                }
            });
    }

    updateBreadcrumbs(): void {
        this.breadcrumbs = [
            { label: 'Recruitment', link: '/calendar' },
            { label: 'Assignments', link: '/assignments' },
            { label: this.assignment?.name || 'Assignment Details' }
        ];
    }

    formatDates(): void {
        const created = this.assignment?.created_at;
        const updated = this.assignment?.updated_at;
        if (created) {
            this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy') || '';
        }
        if (updated) {
            this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy') || '';
        }
    }

    openDeactivate(): void {
        this.deactivateOpen = true;
    }

    closeDeactivate(): void {
        this.deactivateOpen = false;
    }

    confirmDeactivate(): void {
        if (this.isDeactivating || this.isActivating) return; // Prevent duplicate requests
        this.deactivateOpen = false;
        const statusData = {
            request_data: {
                status: false
            }
        };
        this.updateAssignmentStatus(statusData, false);
    }

    openActivate(): void {
        this.activateOpen = true;
    }

    closeActivate(): void {
        this.activateOpen = false;
    }

    confirmActivate(): void {
        if (this.isActivating || this.isDeactivating) return; // Prevent duplicate requests
        this.activateOpen = false;
        const statusData = {
            request_data: {
                status: true
            }
        };
        this.updateAssignmentStatus(statusData, true);
    }

    private updateAssignmentStatus(statusData: any, isActivating: boolean): void {
        if (!this.assignment?.id) return;
        
        // Set loading state based on operation
        if (isActivating) {
            this.isActivating = true;
        } else {
            this.isDeactivating = true;
        }
        
        this.jobOpeningsService.updateAssignmentStatus(this.assignment.id, statusData)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    this.assignment = res?.data?.object_info ?? res?.object_info;
                    this.toasterMessageService.showSuccess('Assignment Status Updated', 'Updated Successfully');
                    this.formatDates();
                    // Reset loading states
                    this.isActivating = false;
                    this.isDeactivating = false;
                },
                error: () => {
                    this.toasterMessageService.showError('Failed to update assignment status', 'Error');
                    // Reset loading states on error
                    this.isActivating = false;
                    this.isDeactivating = false;
                }
            });
    }

    getTotalScore(): number {
        return this.assignment?.questions?.reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 0;
    }

    getAnswerLetter(index: number): string {
        return String.fromCharCode(65 + index);
    }

    isCorrectAnswer(answer: any): boolean {
        return answer?.is_correct === true;
    }

    getAnswerText(answer: any): string {
        return answer?.text || '';
    }

    getAnswerId(answer: any): any {
        return answer?.id;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
