import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { JobOpeningsService } from '../../../../core/services/recruitment/job-openings/job-openings.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { PopupComponent } from '../../../shared/popup/popup.component';

type Applicant = {
  id: number; // table row id display (application or applicant code)
  applicantId: number; // actual applicant id to be used in routing/API
  name: string;
  phoneNumber: string;
  email: string;
  status: string;
  statusAt: string;
};

type DynamicField = {
  name: string;
  required: boolean;
  type: string;
};

type DynamicFieldSection = {
  name: string;
  fields: DynamicField[];
};
@Component({
  selector: 'app-view-jop-open',
  standalone: true,
  imports: [PageHeaderComponent, TableComponent, RouterLink, CommonModule, FormsModule, PopupComponent],
  templateUrl: './view-jop-open.component.html',
  styleUrl: './view-jop-open.component.css'
})
export class ViewJopOpenComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private jobOpeningsService = inject(JobOpeningsService);
  private toastr = inject(ToastrService);

  // Job opening data
  jobOpening: any = null;

  // Separate loading states for different sections
  jobDetailsLoading: boolean = true;
  mainInfoLoading: boolean = true;
  jobDetailsInfoLoading: boolean = true;
  dynamicFieldsLoading: boolean = true;

  // show more text
  isExpanded = false;

  // Tab functionality
  activeTab: 'all' | 'candidates' | 'interviewing' | 'qualified' | 'rejected' = 'all';

  // Applicants data and pagination
  applicantsLoading: boolean = true;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  // Search functionality
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  // Status change confirmation modals
  isPauseModalOpen: boolean = false;
  isMakeLiveModalOpen: boolean = false;

  ngOnInit(): void {
    this.loadJobOpeningFromRoute();

    // Setup debounced search
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage = 1; // Reset to first page on search
      this.loadApplicants();
    });
  }

  private loadJobOpeningFromRoute(): void {
    this.route.params.subscribe(params => {
      const jobId = params['id'];
      if (jobId) {
        this.getJobOpeningDetails(jobId);
      }
    });
  }

  getJobOpeningDetails(jobId: number): void {
    // Set all loading states to true
    this.jobDetailsLoading = true;
    this.mainInfoLoading = true;
    this.jobDetailsInfoLoading = true;
    this.dynamicFieldsLoading = true;
    this.applicantsLoading = true; // Set applicants loading to true while job details are loading

    this.jobOpeningsService.showJobOpening(jobId).subscribe({
      next: (response) => {
        // Use object_info from the response as it contains the actual job opening data
        this.jobOpening = response.data.object_info;

        // Set all loading states to false when data is loaded
        this.jobDetailsLoading = false;
        this.mainInfoLoading = false;
        this.jobDetailsInfoLoading = false;
        this.dynamicFieldsLoading = false;

        // Load applicants for the current tab
        this.loadApplicants();
      },
      error: (error) => {
        // Set all loading states to false on error
        this.jobDetailsLoading = false;
        this.mainInfoLoading = false;
        this.jobDetailsInfoLoading = false;
        this.dynamicFieldsLoading = false;
        console.error('Error fetching job opening details:', error);
      }
    });
  }

  /**
   * Load applicants based on current tab and pagination
   */
  loadApplicants(): void {
    if (!this.jobOpening?.id) {
      return;
    }

    this.applicantsLoading = true;
    const status = this.getStatusFromTab(this.activeTab);

    this.jobOpeningsService.getApplicantsByJobId(
      this.jobOpening.id,
      this.currentPage,
      this.itemsPerPage,
      status,
      this.searchTerm
    ).subscribe({
      next: (response) => {
        if (response.data) {
          // Transform API response to match table format
          this.applicant = response.data.list_items.map((item: any) => ({
            id: item.application?.id ?? item.id ?? 0,
            applicantId: item.applicant?.id ?? 0,
            name: item.applicant?.name || 'N/A',
            phoneNumber: item.applicant?.phone || 'N/A',
            email: item.applicant?.email || 'N/A',
            status: item.application?.status || 'N/A',
            statusAt: item.application?.created_at || 'N/A'
          }));
          this.totalItems = response.data.total_items || 0;
        }
        this.applicantsLoading = false;
      },
      error: (error) => {
        this.applicantsLoading = false;
        console.error('Error fetching applicants:', error);
        this.toastr.error('Failed to load applicants', '', { timeOut: 3000 });
      }
    });
  }

  /**
   * Handle search input change
   */
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Get status code from tab name
   * Status mapping: 1 - Applicant, 2 - Candidate, 3 - Interviewee, 4 - Job Offer Sent, 5 - New Joiner, 6 - Rejected, 7 - Qualified
   */
  getStatusFromTab(tab: string): number | undefined {
    const statusMap: { [key: string]: number | undefined } = {
      'all': undefined,          // No filter - show all
      'candidates': 2,           // Candidate
      'interviewing': 3,         // Interviewee
      'qualified': 7,            // Qualified
      'rejected': 6              // Rejected
    };
    return statusMap[tab];
  }

  toggleText() {
    this.isExpanded = !this.isExpanded;
  }

  setActiveTab(tab: 'all' | 'candidates' | 'interviewing' | 'qualified' | 'rejected') {
    this.activeTab = tab;
    this.currentPage = 1; // Reset to first page when changing tabs
    this.loadApplicants();
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplicants();
  }

  /**
   * Handle items per page change
   */
  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.loadApplicants();
  }

  getDynamicFieldsSections(): DynamicFieldSection[] {
    if (!this.jobOpening?.recruiter_dynamic_fields) {
      return [];
    }

    const sections: DynamicFieldSection[] = [];
    const dynamicFields = this.jobOpening.recruiter_dynamic_fields;

    // Process each section in the dynamic fields
    Object.keys(dynamicFields).forEach(sectionKey => {
      const section = dynamicFields[sectionKey];

      if (section.files || section.links) {
        // Handle Attachments section
        const fields: DynamicField[] = [];
        if (section.files) {
          section.files.forEach((file: any) => {
            fields.push({
              name: file.name,
              required: file.required,
              type: 'File'
            });
          });
        }
        if (section.links) {
          section.links.forEach((link: any) => {
            fields.push({
              name: link.name,
              required: link.required,
              type: 'Link'
            });
          });
        }

        sections.push({
          name: sectionKey,
          fields: fields
        });
      } else if (typeof section === 'object') {
        // Handle nested sections like "Personal Details"
        Object.keys(section).forEach(subSectionKey => {
          const subSection = section[subSectionKey];
          if (Array.isArray(subSection)) {
            const fields: DynamicField[] = subSection.map((field: any) => ({
              name: field.name,
              required: field.required,
              type: field.type
            }));

            sections.push({
              name: `${sectionKey} - ${subSectionKey}`,
              fields: fields
            });
          }
        });
      }
    });

    return sections;
  }
  applicant: Applicant[] = [];
  sortDirection: string = 'asc';
  currentSortColumn: keyof Applicant | '' = '';
  sortBy(column: keyof Applicant) {
    if (this.currentSortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.applicant && Array.isArray(this.applicant)) {
      this.applicant = [...this.applicant].sort((a, b) => {
        const aVal = a[column]?.toString().toLowerCase();
        const bVal = b[column]?.toString().toLowerCase();

        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  /**
   * Change job opening status
   * Status values:
   * 1: Live - The job is currently active and visible to applicants
   * 2: Completed - The job has been successfully completed
   * 3: Archived - The job is no longer active and has been archived
   * 4: Pause - The job is temporarily paused and not visible to applicants
   */
  changeJobStatus(newStatus: number): void {
    if (!this.jobOpening?.id) {
      return;
    }

    const requestBody = {
      request_data: {
        status: newStatus
      }
    };

    this.jobOpeningsService.updateJobOpeningStatus(this.jobOpening.id, requestBody).subscribe({
      next: (response) => {
        // Reload job opening details to get updated status
        this.getJobOpeningDetails(this.jobOpening.id);
      },
      error: (error) => {
        console.error('Error updating job status:', error);
        this.toastr.error('Failed to update job status', '', { timeOut: 3000 });
      }
    });
  }

  /**
   * Open pause confirmation modal
   */
  openPauseModal(): void {
    this.isPauseModalOpen = true;
  }

  /**
   * Close pause confirmation modal
   */
  closePauseModal(): void {
    this.isPauseModalOpen = false;
  }

  /**
   * Open make live confirmation modal
   */
  openMakeLiveModal(): void {
    this.isMakeLiveModalOpen = true;
  }

  /**
   * Close make live confirmation modal
   */
  closeMakeLiveModal(): void {
    this.isMakeLiveModalOpen = false;
  }

  /**
   * Confirm pause job (change status to 4)
   */
  confirmPause(): void {
    if (!this.jobOpening?.id) {
      return;
    }

    const requestBody = {
      request_data: {
        status: 4 // Pause status
      }
    };

    this.jobOpeningsService.updateJobOpeningStatus(this.jobOpening.id, requestBody).subscribe({
      next: (response) => {
        this.toastr.success('Job opening paused successfully');
        this.closePauseModal();
        // Reload job opening details to get updated status
        this.getJobOpeningDetails(this.jobOpening.id);
      },
      error: (error) => {
        console.error('Error pausing job:', error);
        this.toastr.error('Failed to pause job opening');
        this.closePauseModal();
      }
    });
  }

  /**
   * Confirm make live (change status to 1)
   */
  confirmMakeLive(): void {
    if (!this.jobOpening?.id) {
      return;
    }

    const requestBody = {
      request_data: {
        status: 1 // Live status
      }
    };

    this.jobOpeningsService.updateJobOpeningStatus(this.jobOpening.id, requestBody).subscribe({
      next: (response) => {
        this.toastr.success('Job opening is now live');
        this.closeMakeLiveModal();
        // Reload job opening details to get updated status
        this.getJobOpeningDetails(this.jobOpening.id);
      },
      error: (error) => {
        console.error('Error making job live:', error);
        this.toastr.error('Failed to make job opening live');
        this.closeMakeLiveModal();
      }
    });
  }

  /**
   * Check if job is currently live
   */
  isJobLive(): boolean {
    return this.jobOpening?.status === 'Live';
  }

  /**
   * Check if job is currently paused
   */
  isJobPaused(): boolean {
    return this.jobOpening?.status === 'Pause';
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
}