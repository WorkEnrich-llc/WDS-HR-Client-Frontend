import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ArchivedOpeningsService } from '../../../../core/services/recruitment/archived-openings/archived-openings.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';

type EvaluationData = {
  label: string;
  score: number;
  maxScore: number;
  description: string;
};

type Applicant = {
  id: number; // table row id display (application or applicant code)
  applicantId: number; // actual applicant id
  applicationId: number; // application id to be used in routing/API
  name: string;
  phoneNumber: string;
  email: string;
  status: string;
  statusAt: string;
  evaluation?: {
    overallFit: EvaluationData;
    roleFit: EvaluationData;
    marketFit: EvaluationData;
    appliedAt: string;
  };
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
  imports: [PageHeaderComponent, TableComponent, RouterLink, FormsModule, PopupComponent, DatePipe, DecimalPipe, OverlayFilterBoxComponent],
  providers: [DatePipe],
  templateUrl: './view-archived-opening.component.html',
  styleUrl: './view-archived-opening.component.css'
})
export class ViewArchivedOpeningComponent implements OnInit, OnDestroy {
  @ViewChild('jobBox') jobBox!: OverlayFilterBoxComponent;

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
  activeTab: 'new' | 'candidate' | 'interviewee' | 'qualified' | 'jobOfferSent' | 'accepted' | 'offerSent' | 'offerAccepted' | 'offerRejected' = 'new';

  // Applicants data and pagination
  applicantsLoading: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  // Applicant counts from job opening details
  applicantCounts: any = {
    newApplicants: 0,
    candidates: 0,
    interviewsUpcoming: 0,
    interviewsPrevious: 0,
    qualifiers: 0,
    jobOffersSent: 0,
    offersAccepted: 0,
    offersRejected: 0,
    accepted: 0,
    rejected: 0
  };

  // Search functionality
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private currentJobId: number | null = null;
  private isLoadingRequest: boolean = false;

  // Duplicate confirmation modal
  isDuplicateModalOpen: boolean = false;

  // Unarchive confirmation modal
  isUnarchiveModalOpen: boolean = false;

  // Copy to clipboard feedback
  copiedSectionId: string | null = null;

  // Job Offer form properties
  jobOfferApplicant: any = null;
  overlayTitle: string = '';
  offerSalary: number | null = null;
  offerJoinDate: string = '';
  offerDetails: string = '';
  withEndDate: boolean = false;
  contractEndDate: string = '';
  noticePeriod: number | null = null;
  includeProbation: boolean = false;
  minSalary: number = 0;
  maxSalary: number = 0;
  submitting: boolean = false;
  jobOfferValidationErrors: any = {};
  jobOfferDetailsLoading = false;
  jobOfferFormSubmitted = false;
  currentJobOfferApplicant: any = null;
  currentJobOfferApplicationId: number | undefined = undefined;

  // Store selected applicant for confirmation
  selectedApplicant: Applicant | null = null;

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

        // Extract applicant counts from the response
        if (response.data.object_info.applicants_counts) {
          const counts = response.data.object_info.applicants_counts;
          this.applicantCounts = {
            newApplicants: counts['New Applicants'] || 0,
            candidates: counts['Candidates'] || 0,
            interviewsUpcoming: counts['Interviews']?.upcoming || 0,
            interviewsPrevious: counts['Interviews']?.previous || 0,
            qualifiers: counts['Qualifiers'] || 0,
            jobOffersSent: counts['Job Offers']?.['offer sent'] || 0,
            offersAccepted: counts['Job Offers']?.['accepted'] || 0,
            offersRejected: counts['Job Offers']?.['rejected'] || 0,
            accepted: counts['Accepted'] || 0,
            rejected: counts['Rejected'] || 0
          };
        }

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
    const offerStatus = this.getOfferStatusFromTab(this.activeTab);

    this.archivedOpeningsService.getApplicantsByJobId(
      this.jobOpening.id,
      this.currentPage,
      this.itemsPerPage,
      status,
      this.searchTerm,
      offerStatus
    ).subscribe({
      next: (response) => {
        if (response.data) {
          // Transform API response to match table format
          this.applicant = response.data.list_items.map((item: any) => ({
            id: item.application_id ?? item.id ?? 0, // For display in table
            applicantId: item.id ?? 0, // Actual applicant id
            applicationId: item.application_id ?? 0, // Application id for navigation
            name: item.name || 'N/A',
            phoneNumber: item.phone ? item.phone.toString() : 'N/A',
            email: item.email || 'N/A',
            status: item.status || 'N/A',
            statusAt: item.created_at || item.updated_at || 'N/A',
            // Map evaluation data from API response
            evaluation: item.evaluation ? {
              overallFit: {
                label: 'Overall Fit',
                score: item.evaluation.average_score || 0,
                maxScore: 100,
                description: item.evaluation.average_description || ''
              },
              roleFit: {
                label: 'Role Fit',
                score: item.evaluation.requirements_match_score || 0,
                maxScore: 100,
                description: item.evaluation.requirements_match_reason || ''
              },
              marketFit: {
                label: 'Market Fit',
                score: item.evaluation.job_match_score || 0,
                maxScore: 100,
                description: item.evaluation.job_match_reason || ''
              },
              appliedAt: item.created_at || new Date().toISOString()
            } : undefined
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
      'new': 1,              // New Applicants
      'candidate': 2,        // Candidate
      'interviewee': 3,      // Interviewee
      'qualified': 4,        // Qualified
      'jobOfferSent': 5,     // Job Offer Sent
      'accepted': 6          // Accepted
    };
    return statusMap[tab];
  }

  /**
   * Get offer status from tab name
   * Offer status mapping: 1 - Offer Accepted, 2 - Offer Rejected
   */
  getOfferStatusFromTab(tab: string): number | undefined {
    const offerStatusMap: { [key: string]: number | undefined } = {
      'offerAccepted': 1,    // Offer Accepted
      'offerRejected': 2     // Offer Rejected
    };
    return offerStatusMap[tab];
  }

  toggleText() {
    this.isExpanded = !this.isExpanded;
  }

  setActiveTab(tab: 'new' | 'candidate' | 'interviewee' | 'qualified' | 'jobOfferSent' | 'accepted' | 'offerSent' | 'offerAccepted' | 'offerRejected') {
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

        if (aVal && bVal) {
          if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
          if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        }
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

  /**
   * Copy text to clipboard with visual feedback
   */
  copyToClipboard(text: string, sectionId: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Show copied feedback
      this.copiedSectionId = sectionId;
      // Auto hide after 2 seconds
      setTimeout(() => {
        this.copiedSectionId = null;
      }, 2000);
    }).catch(() => {
      console.error('Failed to copy to clipboard');
    });
  }

  /**
   * Check if applicant has job offer sent status
   */
  isJobOfferSent(status: string): boolean {
    const normalizedStatus = status?.toLowerCase().trim() || '';
    return normalizedStatus === 'job offer sent' || normalizedStatus.includes('offer sent');
  }

  /**
   * Check if applicant has offer rejected status
   */
  isOfferRejected(status: string): boolean {
    const normalizedStatus = status?.toLowerCase().trim() || '';
    return normalizedStatus === 'offer rejected' || normalizedStatus.includes('rejected');
  }

  /**
   * Open job offer modal directly (no confirmation modal)
   */
  openJobOfferModal(applicant: Applicant): void {
    if (!applicant?.applicationId) return;

    // Reset job offer form
    this.resetJobOfferForm();
    this.overlayTitle = 'Job Offer';

    // Set applicant data
    this.currentJobOfferApplicationId = applicant.applicationId;
    this.jobOfferApplicant = applicant;

    // Open the overlay
    if (this.jobBox) {
      this.jobBox.openOverlay();
    }
  }

  /**
   * Reset job offer form
   */
  resetJobOfferForm(): void {
    this.offerSalary = null;
    this.offerJoinDate = '';
    this.offerDetails = '';
    this.withEndDate = false;
    this.contractEndDate = '';
    this.noticePeriod = null;
    this.includeProbation = false;
    this.jobOfferValidationErrors = {};
    this.jobOfferFormSubmitted = false;
  }

  /**
   * Submit job offer
   */
  submitJobOffer(): void {
    // Mark form as touched/submitted
    this.jobOfferFormSubmitted = true;

    // Reset validation errors
    this.jobOfferValidationErrors = {};

    // Validate required fields
    let hasErrors = false;

    if (!this.currentJobOfferApplicationId) {
      return;
    }

    if (
      this.offerSalary == null ||
      this.offerSalary === undefined ||
      String(this.offerSalary).trim() === '' ||
      isNaN(Number(this.offerSalary))
    ) {
      this.jobOfferValidationErrors.salary = 'Salary is required';
      hasErrors = true;
    } else if (Number(this.offerSalary) <= 0) {
      this.jobOfferValidationErrors.salary = 'Salary must be greater than 0';
      hasErrors = true;
    }

    // Notice period required
    if (
      this.noticePeriod == null ||
      this.noticePeriod === undefined ||
      String(this.noticePeriod).trim() === '' ||
      isNaN(Number(this.noticePeriod))
    ) {
      this.jobOfferValidationErrors.noticePeriod = 'Notice period is required';
      hasErrors = true;
    } else if (Number(this.noticePeriod) <= 0) {
      this.jobOfferValidationErrors.noticePeriod = 'Notice period must be greater than 0';
      hasErrors = true;
    }

    // Validate join date is present
    if (!this.offerJoinDate || !this.offerJoinDate.trim()) {
      this.jobOfferValidationErrors.joinDate = 'Please select a join date';
      hasErrors = true;
    } else {
      // Validate join date is today or in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const joinDate = new Date(this.offerJoinDate);
      joinDate.setHours(0, 0, 0, 0);
      if (joinDate < today) {
        this.jobOfferValidationErrors.joinDate = 'Join date must be today or in the future';
        hasErrors = true;
      }
    }

    // Validate offer details
    if (!this.offerDetails || !this.offerDetails.trim()) {
      this.jobOfferValidationErrors.offerDetails = 'Offer details is required';
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    this.submitting = true;

    // Create new job offer with full payload
    const payload: any = {
      application_id: this.currentJobOfferApplicationId,
      join_date: this.offerJoinDate,
      salary: typeof this.offerSalary === 'string' ? Number(this.offerSalary) : this.offerSalary,
      offer_details: this.offerDetails,
    };
    if (this.withEndDate && this.contractEndDate) {
      payload.end_contract = this.contractEndDate;
    }
    if (this.noticePeriod) {
      payload.notice_period = this.noticePeriod;
    }
    this.archivedOpeningsService.sendJobOfferFull(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.closeAllOverlays();
        this.resetJobOfferForm();
        this.loadApplicants();
        this.getJobOpeningDetails(this.jobOpening.id);
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  /**
   * Validate join date field
   */
  validateJoinDateField(): void {
    // Clear previous error
    delete this.jobOfferValidationErrors.joinDate;
    if (!this.offerJoinDate || !this.offerJoinDate.trim()) {
      this.jobOfferValidationErrors.joinDate = 'Please select a join date';
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const joinDate = new Date(this.offerJoinDate);
    joinDate.setHours(0, 0, 0, 0);
    if (joinDate < today) {
      this.jobOfferValidationErrors.joinDate = 'Join date must be today or in the future';
    }
  }

  /**
   * Validate notice period field
   */
  validateNoticePeriodField(): void {
    // Show error if invalid, clear if valid
    if (
      this.noticePeriod == null ||
      this.noticePeriod === undefined ||
      String(this.noticePeriod).trim() === '' ||
      isNaN(Number(this.noticePeriod))
    ) {
      this.jobOfferValidationErrors.noticePeriod = 'Notice period is required';
    } else if (Number(this.noticePeriod) <= 0) {
      this.jobOfferValidationErrors.noticePeriod = 'Notice period must be greater than 0';
    } else {
      if (this.jobOfferValidationErrors.noticePeriod) {
        delete this.jobOfferValidationErrors.noticePeriod;
      }
    }
  }

  /**
   * Validate salary field
   */
  validateSalaryField(): void {
    // Show error if invalid, clear if valid
    if (
      this.offerSalary == null ||
      this.offerSalary === undefined ||
      String(this.offerSalary).trim() === '' ||
      isNaN(Number(this.offerSalary))
    ) {
      this.jobOfferValidationErrors.salary = 'Salary is required';
    } else if (Number(this.offerSalary) <= 0) {
      this.jobOfferValidationErrors.salary = 'Salary must be greater than 0';
    } else {
      if (this.jobOfferValidationErrors.salary) {
        delete this.jobOfferValidationErrors.salary;
      }
    }
  }

  /**
   * On salary focus
   */
  onSalaryFocus(): void {
    // Clear error on focus
    if (this.jobOfferValidationErrors.salary) {
      delete this.jobOfferValidationErrors.salary;
    }
  }

  /**
   * On offer details focus
   */
  onOfferDetailsFocus(): void {
    // Clear error on focus
    if (this.jobOfferValidationErrors.offerDetails) {
      delete this.jobOfferValidationErrors.offerDetails;
    }
  }

  /**
   * On notice period focus
   */
  onNoticePeriodFocus(): void {
    // Clear error on focus
    if (this.jobOfferValidationErrors.noticePeriod) {
      delete this.jobOfferValidationErrors.noticePeriod;
    }
  }

  /**
   * Validate offer details field
   */
  validateOfferDetailsField(): void {
    // Show error if invalid for new job offers
    if (!this.offerDetails || !this.offerDetails.trim()) {
      this.jobOfferValidationErrors.offerDetails = 'Offer details is required';
    } else {
      if (this.jobOfferValidationErrors.offerDetails) {
        delete this.jobOfferValidationErrors.offerDetails;
      }
    }
  }

  /**
   * Close all overlays
   */
  closeAllOverlays(): void {
    if (this.jobBox) {
      this.jobBox.closeOverlay();
    }
  }

  /**
   * Navigate to create employee with application and applicant IDs
   */
  navigateToCreateEmployee(applicant: any): void {
    if (!applicant?.applicationId) {
      console.error('Application ID not found');
      return;
    }
    if (!applicant?.applicantId) {
      console.error('Applicant ID not found');
      return;
    }
    this.router.navigate(['/employees/create-employee'], {
      queryParams: {
        application_id: applicant.applicationId,
        applicant_id: applicant.applicantId
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
}
