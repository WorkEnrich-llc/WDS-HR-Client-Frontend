import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ArchivedOpeningsService } from '../../../../core/services/recruitment/archived-openings/archived-openings.service';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { PopupComponent } from '../../../shared/popup/popup.component';

type Applicant = {
  id: number;
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
  selector: 'app-view-archived-opening',
  standalone: true,
  imports: [PageHeaderComponent, TableComponent, RouterLink, FormsModule, PopupComponent, DatePipe],
  templateUrl: './view-archived-opening.component.html',
  styleUrl: './view-archived-opening.component.css'
})
export class ViewArchivedOpeningComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private archivedOpeningsService = inject(ArchivedOpeningsService);
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
  applicantsLoading: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  // Search functionality
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private currentJobId: number | null = null;
  private isLoadingRequest: boolean = false;

  // Duplicate confirmation modal
  isDuplicateModalOpen: boolean = false;

  // Unarchive confirmation modal
  isUnarchiveModalOpen: boolean = false;

  ngOnInit(): void {
    // Load job opening from route
    this.route.params.subscribe(params => {
      const jobId = +params['id'];
      if (jobId && jobId !== this.currentJobId) {
        this.currentJobId = jobId;
        this.getJobOpeningDetails(jobId);
      }
    });

    // Setup debounced search
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage = 1; // Reset to first page on search
      this.loadApplicants();
    });
  }

  getJobOpeningDetails(jobId: number): void {
    // Prevent duplicate calls if already making a request
    if (this.isLoadingRequest) {
      return;
    }

    // Set request flag and loading states to true
    this.isLoadingRequest = true;
    this.jobDetailsLoading = true;
    this.mainInfoLoading = true;
    this.jobDetailsInfoLoading = true;
    this.dynamicFieldsLoading = true;

    this.archivedOpeningsService.getArchivedOpeningById(jobId).subscribe({
      next: (response) => {
        // Use object_info from the response as it contains the actual job opening data
        this.jobOpening = response.data.object_info;

        // Set all loading states to false when data is loaded
        this.jobDetailsLoading = false;
        this.mainInfoLoading = false;
        this.jobDetailsInfoLoading = false;
        this.dynamicFieldsLoading = false;
        this.isLoadingRequest = false;

        // Load applicants for the current tab
        this.loadApplicants();
      },
      error: (error) => {
        // Set all loading states to false on error
        this.jobDetailsLoading = false;
        this.mainInfoLoading = false;
        this.jobDetailsInfoLoading = false;
        this.dynamicFieldsLoading = false;
        this.isLoadingRequest = false;
        console.error('Error fetching archived opening details:', error);
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

    this.archivedOpeningsService.getJobApplications(
      this.currentPage,
      this.itemsPerPage,
      this.jobOpening.id,
      status,
      this.searchTerm
    ).subscribe({
      next: (response) => {
        if (response.data) {
          // Transform API response to match table format
          this.applicant = response.data.list_items.map((app: any) => ({
            id: app.id,
            name: app.applicant?.name || 'N/A',
            phoneNumber: app.applicant?.phone || 'N/A',
            email: app.applicant?.email || 'N/A',
            status: app.status || 'N/A',
            statusAt: app.created_at || 'N/A'
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
   * Status mapping: 0 - Applicant, 1 - Candidate, 2 - Interviewee, 5 - Rejected, 6 - Qualified
   */
  getStatusFromTab(tab: string): number | undefined {
    const statusMap: { [key: string]: number | undefined } = {
      'all': undefined,          // No filter - show all
      'candidates': 1,           // Candidate
      'interviewing': 2,         // Interviewee
      'qualified': 6,            // Qualified
      'rejected': 5              // Rejected
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

  applicant: Applicant[] = [
    {
      id: 11,
      name: 'Ahmed Mohamed',
      phoneNumber: '+2 0122 233 244',
      email: 'ahmed@email.com',
      status: 'Applied at',
      statusAt: '28/12/2025 8:30 PM',
    }
  ];

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
   * Open duplicate confirmation modal
   */
  openDuplicateModal(): void {
    this.isDuplicateModalOpen = true;
  }

  /**
   * Close duplicate confirmation modal
   */
  closeDuplicateModal(): void {
    this.isDuplicateModalOpen = false;
  }

  /**
   * Confirm and duplicate archived job opening
   */
  confirmDuplicate(): void {
    if (this.jobOpening?.id) {
      this.archivedOpeningsService.duplicateJobOpening(this.jobOpening.id).subscribe({
        next: (response) => {
          this.toastr.success('Job opening duplicated successfully', "Duplicated");
          this.closeDuplicateModal();
          // Navigate to job openings list
          this.router.navigate(['/job-openings']);
        },
        error: (error) => {
          console.error('Error duplicating job opening:', error);
          this.toastr.error('Failed to duplicate job opening');
          this.closeDuplicateModal();
        }
      });
    }
  }

  /**
   * Open unarchive confirmation modal
   */
  openUnarchiveModal(): void {
    this.isUnarchiveModalOpen = true;
  }

  /**
   * Close unarchive confirmation modal
   */
  closeUnarchiveModal(): void {
    this.isUnarchiveModalOpen = false;
  }

  /**
   * Confirm and unarchive job opening
   * Changes status from 3 (Archived) to 1 (Live)
   * Uses PATCH method to /recruiter/jobs-openings/:id/ endpoint
   */
  confirmUnarchive(): void {
    if (this.jobOpening?.id) {
      this.archivedOpeningsService.unarchiveJobOpening(this.jobOpening.id).subscribe({
        next: (response) => {
          this.toastr.success('Job opening unarchived successfully', "Unarchived");
          this.closeUnarchiveModal();
          // Navigate back to archived openings list
          this.router.navigate(['/archived-openings']);
        },
        error: (error) => {
          console.error('Error unarchiving job opening:', error);
          this.toastr.error('Failed to unarchive job opening');
          this.closeUnarchiveModal();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
}
