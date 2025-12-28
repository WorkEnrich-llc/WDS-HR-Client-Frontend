import { Component, inject, ViewChild, OnDestroy } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { debounceTime, filter, Subject, Subscription, finalize } from 'rxjs';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';

import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';
import { JobOpeningsService } from 'app/core/services/recruitment/job-openings/job-openings.service';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-all-job-openings',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, RouterLink, ReactiveFormsModule, FormsModule, PopupComponent],
  templateUrl: './all-job-openings.component.html',
  styleUrl: './all-job-openings.component.css'
})
export class AllJobOpeningsComponent implements OnDestroy {

  private paginationState = inject(PaginationStateService);
  private router = inject(Router);
  private jobOpeningsService = inject(JobOpeningsService);

  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  loadData: boolean = true;
  filterForm!: FormGroup;
  approvalRequests: any[] = [];
  currentFilters: any = {};


  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;
  private listSubscription?: Subscription;

  // Archive confirmation modal
  isArchiveModalOpen: boolean = false;
  selectedJobIdToArchive: number | null = null;


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('job-openings/all-job-openings') || 1;
      this.currentPage = pageFromUrl;
      this.getAllJobOpenings(pageFromUrl);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.currentPage = 1;
      this.getAllJobOpenings(this.currentPage);
    });

    this.filterForm = this.fb.group({
      createdFrom: [''],
      createdTo: [''],
      status: ['']
    });
  }


  getAllJobOpenings(pageNumber: number, searchTerm: string = '', filters?: any): void {
    // cancel any in-flight request to avoid race conditions that keep loader on
    if (this.listSubscription) {
      this.listSubscription.unsubscribe();
    }
    this.loadData = true;
    this.listSubscription = this.jobOpeningsService.getAllJobOpenings(pageNumber, this.itemsPerPage, {
      search: searchTerm || this.searchTerm || undefined,
      ...filters
    }).pipe(finalize(() => { this.loadData = false; })).subscribe({
      next: (response) => {
        if (response.data) {
          // Transform API response to match table format
          this.approvalRequests = response.data.list_items.map((job: any) => ({
            jobId: job?.id ?? 0,
            jobName: job?.job_title?.name ?? 'N/A',
            branchId: job?.branch?.id ?? null,
            branchName: job?.branch?.name ?? '—',
            empType: job?.employment_type?.name ?? 'N/A',
            numApplicant: job?.applicants ?? 0,
            numApply: job?.candidates ?? 0,
            numSchadule: job?.interviewees ?? 0,
            numRejected: job?.rejected ?? 0,
            numAccepted: job?.new_joiners ?? 0,
            status: job?.status ?? 'N/A',
            created_at: job?.created_at ?? '',
            updated_at: job?.updated_at ?? ''
          }));
          this.totalItems = response.data.total_items || 0;
        }
      },
      error: (error) => {
        console.error('Error fetching job openings:', error);
      }
    });
  }

  resetFilterForm(): void {
    this.filterForm.reset({
      createdFrom: '',
      createdTo: '',
      status: ''
    });
    this.currentFilters = {};
    this.filterBox.closeOverlay();
    this.getAllJobOpenings(this.currentPage);
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        created_from: rawFilters.createdFrom || undefined,
        created_to: rawFilters.createdTo || undefined,
        status: rawFilters.status || undefined,
      };

      this.currentFilters = filters;

      this.currentPage = 1;
      this.filterBox.closeOverlay();
      this.getAllJobOpenings(this.currentPage, this.searchTerm, this.currentFilters);
    }
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllJobOpenings(this.currentPage, this.searchTerm, this.currentFilters);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationState.setPage('job-openings/all-job-openings', page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
    // Remove direct API call - queryParams subscription will handle it
  }

  navigateToView(jobId: number): void {
    this.paginationState.setPage('job-openings/all-job-openings', this.currentPage);
    this.router.navigate(['/job-openings/view-job-openings', jobId]);
  }

  /**
   * Change job opening status
   * Status values:
   * 1: Live - The job is currently active and visible to applicants
   * 2: Completed - The job has been successfully completed
   * 3: Archived - The job is no longer active and has been archived
   * 4: Pause - The job is temporarily paused and not visible to applicants
   */
  changeJobStatus(jobId: number, newStatus: number): void {
    const requestBody = {
      request_data: {
        status: newStatus
      }
    };

    this.jobOpeningsService.updateJobOpeningStatus(jobId, requestBody).subscribe({
      next: (response) => {
        // Reload the current page to reflect the changes
        this.getAllJobOpenings(this.currentPage, this.searchTerm, this.currentFilters);
      },
      error: (error) => {
        console.error('Error updating job status:', error);
        this.toastr.error('Failed to update job status', '', { timeOut: 3000 });
      }
    });
  }

  /**
   * Open archive confirmation modal
   */
  openArchiveModal(jobId: number): void {
    this.selectedJobIdToArchive = jobId;
    this.isArchiveModalOpen = true;
  }

  /**
   * Close archive confirmation modal
   */
  closeArchiveModal(): void {
    this.isArchiveModalOpen = false;
    this.selectedJobIdToArchive = null;
  }

  /**
   * Confirm and archive a job opening (set status to 3)
   */
  confirmArchive(): void {
    if (this.selectedJobIdToArchive) {
      this.changeJobStatus(this.selectedJobIdToArchive, 3);
      this.closeArchiveModal();
    }
  }

  /**
   * Toggle job status between Live (1) and Pause (4)
   */
  toggleJobStatus(job: any): void {
    // If status is "Live", change to "Pause" (4)
    // If status is "Pause" or anything else, change to "Live" (1)
    const newStatus = job.status === 'Live' ? 4 : 1;
    this.changeJobStatus(job.jobId, newStatus);
  }

  /**
   * Check if job is currently paused
   */
  isJobPaused(status: string): boolean {
    return status === 'Pause';
  }

  /**
   * Check if job is currently live
   */
  isJobLive(status: string): boolean {
    return status === 'Live';
  }

  ngOnDestroy(): void {
    this.toasterSubscription?.unsubscribe();
    this.searchSubject.complete();
    this.listSubscription?.unsubscribe();
  }

}
