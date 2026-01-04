import { Component, inject, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { JobOpeningsService } from '../../../../core/services/recruitment/job-openings/job-openings.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { DatePipe, NgClass, DecimalPipe } from '@angular/common';
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
  selector: 'app-view-jop-open',
  standalone: true,
  imports: [PageHeaderComponent, TableComponent, RouterLink, FormsModule, PopupComponent, DatePipe, NgClass, OverlayFilterBoxComponent, DecimalPipe],
  providers: [DatePipe],
  templateUrl: './view-jop-open.component.html',
  styleUrl: './view-jop-open.component.css'
})
export class ViewJopOpenComponent implements OnInit, OnDestroy {
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  @ViewChild('jobBox') jobBox!: OverlayFilterBoxComponent;
  @ViewChild('feedbackBox') feedbackBox!: OverlayFilterBoxComponent;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobOpeningsService = inject(JobOpeningsService);
  private departmentsService = inject(DepartmentsService);
  private branchesService = inject(BranchesService);
  private employeeService = inject(EmployeeService);
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
  activeTab: 'applicant' | 'candidate' | 'interviewee' | 'qualified' | 'jobOfferSent' | 'accepted' | 'rejected' | 'offerAccepted' | 'offerRejected' = 'applicant';

  // Applicants data and pagination
  applicantsLoading: boolean = true;
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

  // Status change confirmation modals
  isPauseModalOpen: boolean = false;
  isMakeLiveModalOpen: boolean = false;

  // Action confirmation modals
  isCandidateModalOpen: boolean = false;
  isQualifiedModalOpen: boolean = false;
  isAcceptOfferModalOpen: boolean = false;

  // Store current applicant data for job offer component
  currentJobOfferApplicant: any = null;
  currentJobOfferApplicationId: number | undefined = undefined;

  // Store selected applicant for confirmation
  selectedApplicant: Applicant | null = null;

  // Store current applicant data for interview component
  currentInterviewApplicant: any = null;
  currentApplicationId: number | undefined = undefined;
  currentApplicationDetails: any = null;

  // Interview form properties
  overlayTitle: string = 'Schedule Interview';
  interviewTitle: string = '';
  department: any = '';
  section: any = '';
  interviewer: any = '';
  date: string = '';
  time_from: string = '';
  time_to: string = '';
  interview_type: number = 1;
  location: any = '';
  departments: Array<{ id: number; name: string; code: string }> = [];
  sections: Array<{ id: number; name: string }> = [];
  employees: Array<{ id: number; name: string }> = [];
  branches: Array<{ id: number; name: string }> = [];
  departmentsLoading = false;
  sectionsLoading = false;
  employeesLoading = false;
  branchesLoading = false;
  interviewDetailsLoading = false;
  isRescheduleLoading = false;
  submitting = false;
  validationErrors: any = {};

  // Job Offer form properties
  jobOfferApplicant: any = null;
  includeProbation: boolean = false;
  offerJoinDate: string = '';
  withEndDate: boolean = false;
  contractEndDate: string = '';
  noticePeriod: number | null = null;
  offerSalary: string | null = null;
  offerDetails: string = '';
  jobOfferValidationErrors: any = {};
  jobOfferDetailsLoading = false;
  jobOfferFormSubmitted = false;
  minSalary: number = 0;
  maxSalary: number = 0;

  // Feedback form properties
  feedbackRating: number | null = null;
  feedbackComment: string = '';
  feedbackSubmitting = false;
  feedbackValidationErrors: { [key: string]: string } = {};

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
    const offerStatus = this.getOfferStatusFromTab(this.activeTab);

    this.jobOpeningsService.getApplicantsByJobId(
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
   * Status mapping: 1 - Applicant, 2 - Candidate, 3 - Interviewee, 4 - Qualified, 5 - Job Offer Sent, 6 - Accepted, 7 - Rejected
   * Offer status mapping: 1 - Offer Accepted, 2 - Offer Rejected
   */
  getStatusFromTab(tab: string): number | undefined {
    const statusMap: { [key: string]: number | undefined } = {
      'applicant': 1,         // New Applicants
      'candidate': 2,         // Candidate
      'interviewee': 3,       // Interviewee
      'qualified': 4,         // Qualified
      'jobOfferSent': 5,      // Job Offer Sent
      'accepted': 6,          // Accepted
      'rejected': 7           // Rejected
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

  setActiveTab(tab: 'applicant' | 'candidate' | 'interviewee' | 'qualified' | 'jobOfferSent' | 'accepted' | 'rejected' | 'offerAccepted' | 'offerRejected') {
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
  hoveredApplicantId: number | null = null;
  tooltipPosition: { left: number; top: number } | null = null;
  tooltipWidth: number = 560;
  copiedSectionId: string | null = null;

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

  sortBy(column: keyof Applicant) {
    if (this.currentSortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.applicant && Array.isArray(this.applicant)) {
      this.applicant = [...this.applicant].sort((a, b) => {
        const aVal = a[column]?.toString().toLowerCase() || '';
        const bVal = b[column]?.toString().toLowerCase() || '';

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
        this.toastr.success('Job opening paused successfully', 'Updated Successfully');
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
        this.toastr.success('Job opening is now live', 'Updated Successfully');
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
   * Handle click on applicant badge to show evaluation tooltip
   */
  onApplicantClick(applicantId: number): void {
    // If clicking the same applicant, close the tooltip
    if (this.hoveredApplicantId === applicantId) {
      this.closeTooltip();
      return;
    }

    this.hoveredApplicantId = applicantId;

    const badgeElement = document.querySelector(`[data-badge-id="${applicantId}"]`) as HTMLElement;
    if (!badgeElement) return;

    const badgeRect = badgeElement.getBoundingClientRect();
    const gap = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate available space above and below
    const spaceAbove = badgeRect.top;
    const spaceBelow = viewportHeight - badgeRect.bottom;

    // Determine tooltip dimensions based on available space
    let tooltipWidth = 560;
    const maxTooltipHeight = Math.min(500, Math.max(spaceAbove, spaceBelow) - gap - 40);

    // If height is constrained, increase width for better readability
    if (maxTooltipHeight < 400) {
      tooltipWidth = Math.min(700, viewportWidth - 32);
    }

    this.tooltipWidth = tooltipWidth;

    let left: number;
    let top: number;

    // Priority: Bottom first, then top
    if (spaceBelow >= 200) {
      top = badgeRect.bottom + gap;
    } else {
      top = badgeRect.top - maxTooltipHeight - gap - 20; // Extra 12px spacing from bottom when above
    }

    // Center horizontally relative to badge, but stay in viewport
    left = badgeRect.left + badgeRect.width / 2 - tooltipWidth / 2 - 80;

    // Ensure tooltip stays within viewport horizontally
    left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));

    // Ensure tooltip stays within viewport vertically
    top = Math.max(16, Math.min(top, viewportHeight - maxTooltipHeight - 16));

    this.tooltipPosition = {
      left: Math.round(left),
      top: Math.round(top)
    };
  }

  /**
   * Close the tooltip
   */
  closeTooltip(): void {
    this.hoveredApplicantId = null;
    this.tooltipPosition = null;
  }

  /**
   * Close tooltip when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const tooltip = document.querySelector('[data-tooltip-id]');
    const badgeContainers = document.querySelectorAll('[data-badge-id]');
    const target = event.target as HTMLElement;

    // Check if click is on tooltip or badge
    const isTooltipClick = tooltip && tooltip.contains(target);
    const isBadgeClick = Array.from(badgeContainers).some(container => container.contains(target));

    // Close tooltip if clicking outside both
    if (!isTooltipClick && !isBadgeClick && this.hoveredApplicantId !== null) {
      this.closeTooltip();
    }
  }

  /**
   * Close tooltip when scrolling
   */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.hoveredApplicantId !== null) {
      this.closeTooltip();
    }
  }

  /**
   * Get the hovered applicant for template
   */
  getHoveredApplicant(): Applicant | undefined {
    if (this.hoveredApplicantId === null) {
      return undefined;
    }
    return this.applicant.find(a => a.id === this.hoveredApplicantId);
  }

  /**
   * Check if evaluation exists and is valid
   */
  hasValidEvaluation(applicant: Applicant | undefined): boolean {
    return !!applicant?.evaluation;
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

  // =====================================================
  // Action Methods for Applicant Status Changes
  // =====================================================

  /**
   * Check if applicant has job offer sent status
   */
  isJobOfferSent(status: string): boolean {
    const normalizedStatus = status?.toLowerCase() || '';
    return normalizedStatus === 'job offer sent' || normalizedStatus.includes('offer sent');
  }

  /**
   * Check if applicant has offer rejected status
   */
  isOfferRejected(status: string): boolean {
    const normalizedStatus = status?.toLowerCase() || '';
    return normalizedStatus === 'offer rejected' || normalizedStatus.includes('rejected');
  }

  /**
   * Check if applicant has offer accepted status
   */
  isOfferAccepted(status: string): boolean {
    const normalizedStatus = status?.toLowerCase() || '';
    return normalizedStatus === 'offer accepted' || normalizedStatus.includes('accepted');
  }

  /**
   * Open candidate confirmation modal
   */
  openCandidateConfirmation(applicant: Applicant): void {
    this.selectedApplicant = applicant;
    this.isCandidateModalOpen = true;
  }

  /**
   * Close candidate confirmation modal
   */
  closeCandidateModal(): void {
    this.isCandidateModalOpen = false;
    this.selectedApplicant = null;
  }

  /**
   * Confirm and move applicant to Candidate status
   */
  confirmMakeCandidate(): void {
    if (!this.selectedApplicant?.applicationId) return;

    // Status 2 = Candidate
    this.jobOpeningsService.updateApplicationStatus(this.selectedApplicant.applicationId, 2).subscribe({
      next: () => {
        this.closeCandidateModal();
        this.loadApplicants();
        this.getJobOpeningDetails(this.jobOpening.id);
      },
      error: (error) => {
        console.error('Error moving applicant to candidate:', error);
        this.closeCandidateModal();
      }
    });
  }
  /**
   * Open interview modal to schedule interview (no confirmation modal)
   */
  openInterviewModal(applicant: Applicant): void {
    if (!applicant?.applicationId) return;

    // Reset form
    this.resetInterviewForm();
    this.overlayTitle = 'Schedule Interview';

    // Set application data
    this.currentApplicationId = applicant.applicationId;
    this.currentApplicationDetails = { application: { job: this.jobOpening?.id } };

    // Load departments and branches
    this.loadDepartments();
    this.loadBranches();

    // Open the overlay
    if (this.filterBox) {
      this.filterBox.openOverlay();
    }
  }

  /**
   * Reset interview form
   */
  resetInterviewForm(): void {
    this.interviewTitle = '';
    this.department = '';
    this.section = '';
    this.interviewer = '';
    this.date = '';
    this.time_from = '';
    this.time_to = '';
    this.interview_type = 1;
    this.location = '';
    this.validationErrors = {};
  }

  /**
   * Load departments
   */
  loadDepartments(): void {
    this.departmentsLoading = true;
    this.departmentsService.getAllDepartment(1, 10000).subscribe({
      next: (res) => {
        const items = res?.data?.list_items ?? res?.list_items ?? [];
        this.departments = Array.isArray(items)
          ? items.map((dept: any) => ({
            id: dept?.id ?? 0,
            name: dept?.name ?? '—',
            code: dept?.code ?? ''
          }))
          : [];
        this.departmentsLoading = false;
      },
      error: () => {
        this.departments = [];
        this.departmentsLoading = false;
      }
    });
  }

  /**
   * Load branches
   */
  loadBranches(): void {
    this.branchesLoading = true;
    this.branchesService.getAllBranches(1, 10000).subscribe({
      next: (res) => {
        const items = res?.data?.list_items ?? res?.list_items ?? [];
        this.branches = Array.isArray(items)
          ? items.map((branch: any) => ({
            id: branch?.id ?? 0,
            name: branch?.name ?? '—',
            code: branch?.code ?? ''
          }))
          : [];
        this.branchesLoading = false;
      },
      error: () => {
        this.branches = [];
        this.branchesLoading = false;
      }
    });
  }

  /**
   * Load sections for a department
   */
  private loadSectionsForDepartment(deptId: number): void {
    this.sectionsLoading = true;
    this.departmentsService.showDepartment(deptId).subscribe({
      next: (deptRes) => {
        const deptInfo = deptRes?.data?.object_info ?? deptRes?.object_info ?? {};
        const sectionsList = deptInfo?.sections ?? [];
        this.sections = Array.isArray(sectionsList)
          ? sectionsList.map((sec: any) => ({
            id: sec?.id ?? 0,
            name: sec?.name ?? '—',
            code: sec?.code ?? ''
          }))
          : [];
        this.sectionsLoading = false;
      },
      error: () => {
        this.sections = [];
        this.sectionsLoading = false;
      }
    });
  }

  /**
   * Load employees for a section
   */
  private loadEmployeesForSection(sectionId: number): void {
    this.employeesLoading = true;
    this.employeeService.getEmployees(1, 10000, '', { section: sectionId }).subscribe({
      next: (empRes) => {
        const items = empRes?.data?.list_items ?? [];
        this.employees = Array.isArray(items)
          ? items.map((emp: any) => {
            const empInfo = emp?.object_info ?? emp;
            return {
              id: empInfo?.id ?? 0,
              name: empInfo?.contact_info?.name ?? '—'
            };
          })
          : [];
        this.employeesLoading = false;
      },
      error: () => {
        this.employees = [];
        this.employeesLoading = false;
      }
    });
  }

  /**
   * On department change
   */
  onDepartmentChange(): void {
    this.section = '';
    this.interviewer = '';
    this.sections = [];
    this.employees = [];

    if (!this.department) {
      return;
    }

    this.loadSectionsForDepartment(this.department);
  }

  /**
   * On section change
   */
  onSectionChange(): void {
    this.interviewer = '';
    this.employees = [];

    if (!this.section) {
      return;
    }

    this.loadEmployeesForSection(this.section);
  }

  /**
   * On interview type change
   */
  onInterviewTypeChange(): void {
    // Clear location when switching to online
    if (this.interview_type === 2) {
      this.location = '';
      this.clearValidationError('location');
    }
  }

  /**
   * On interview form change
   */
  onInterviewFormChange(): void {
    // Clear form errors when user modifies fields
  }

  /**
   * Clear validation error
   */
  clearValidationError(field: string): void {
    delete this.validationErrors[field];
  }

  /**
   * Submit interview
   */
  submitInterview(): void {
    // Reset validation errors
    this.validationErrors = {};

    // Validate required fields
    let hasErrors = false;

    if (!this.currentApplicationId) {
      return;
    }

    if (!this.interviewer) {
      this.validationErrors.interviewer = 'Please select an interviewer';
      hasErrors = true;
    }

    if (!this.date || !this.date.trim()) {
      this.validationErrors.date = 'Please select a date';
      hasErrors = true;
    }

    if (!this.time_from || !this.time_from.trim()) {
      this.validationErrors.time_from = 'Please enter start time';
      hasErrors = true;
    }

    if (!this.time_to || !this.time_to.trim()) {
      this.validationErrors.time_to = 'Please enter end time';
      hasErrors = true;
    }

    // Only require location for offline interviews
    if (this.interview_type === 1 && !this.location) {
      this.validationErrors.location = 'Please select a location';
      hasErrors = true;
    }

    // Validate time logic
    if (this.time_from && this.time_to && this.time_from >= this.time_to) {
      this.validationErrors.time_to = 'End time must be after start time';
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    this.submitting = true;

    const payload = {
      title: this.interviewTitle || 'Interview',
      interviewer: this.interviewer!,
      department: this.department,
      section: this.section,
      date: this.date,
      time_from: this.time_from,
      time_to: this.time_to,
      interview_type: this.interview_type,
      location: this.interview_type === 2 ? null : this.location!,
    };

    // Create new interview
    this.jobOpeningsService.createInterview(this.currentApplicationId!, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.closeAllOverlays();
        this.resetInterviewForm();
        this.loadApplicants();
        this.getJobOpeningDetails(this.jobOpening.id);
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  /**
   * Close all overlays
   */
  closeAllOverlays(): void {
    if (this.filterBox) {
      this.filterBox.closeOverlay();
    }
    if (this.jobBox) {
      this.jobBox.closeOverlay();
    }
    if (this.feedbackBox) {
      this.feedbackBox.closeOverlay();
    }
  }

  /**
   * Open feedback modal
   */
  openFeedbackModal(applicant: Applicant): void {
    if (!applicant?.applicationId) return;
    this.currentApplicationId = applicant.applicationId;
    this.resetFeedbackForm();
    this.feedbackBox?.openOverlay();
  }

  /**
   * Reset feedback form
   */
  resetFeedbackForm(): void {
    this.feedbackRating = null;
    this.feedbackComment = '';
    this.feedbackValidationErrors = {};
  }

  /**
   * Submit feedback
   */
  submitFeedback(): void {
    this.feedbackValidationErrors = {};
    let hasErrors = false;

    // Validate rating
    if (
      this.feedbackRating == null ||
      this.feedbackRating < 0 ||
      this.feedbackRating > 10
    ) {
      this.feedbackValidationErrors['rating'] =
        'Please provide a rating between 0 and 10';
      hasErrors = true;
    }

    // Validate comment
    if (!this.feedbackComment || this.feedbackComment.trim() === '') {
      this.feedbackValidationErrors['comment'] = 'Please provide your feedback';
      hasErrors = true;
    }

    if (hasErrors || !this.currentApplicationId) return;

    this.feedbackSubmitting = true;
    this.jobOpeningsService
      .addApplicationFeedback(
        this.currentApplicationId,
        this.feedbackRating!,
        this.feedbackComment || ''
      )
      .subscribe({
        next: () => {
          this.feedbackSubmitting = false;
          this.toastr.success('Feedback submitted successfully');
          this.closeFeedbackOverlay();
          this.resetFeedbackForm();
          this.loadApplicants();
        },
        error: (error) => {
          this.feedbackSubmitting = false;
          this.toastr.error(
            error.error?.message || 'Failed to submit feedback'
          );
        },
      });
  }

  /**
   * Close feedback overlay
   */
  closeFeedbackOverlay(): void {
    this.feedbackBox?.closeOverlay();
  }

  /**
   * Clear feedback validation error
   */
  clearFeedbackError(field: string): void {
    delete this.feedbackValidationErrors[field];
  }

  /**
   * Open qualified confirmation modal
   */
  openQualifiedConfirmation(applicant: Applicant): void {
    this.selectedApplicant = applicant;
    this.isQualifiedModalOpen = true;
  }

  /**
   * Close qualified confirmation modal
   */
  closeQualifiedModal(): void {
    this.isQualifiedModalOpen = false;
    this.selectedApplicant = null;
  }

  /**
   * Confirm and mark applicant as qualified
   */
  confirmMarkQualified(): void {
    if (!this.selectedApplicant?.applicationId) return;

    // Status 4 = Qualified
    this.jobOpeningsService.updateApplicationStatus(this.selectedApplicant.applicationId, 4).subscribe({
      next: () => {
        this.closeQualifiedModal();
        this.loadApplicants();
        this.getJobOpeningDetails(this.jobOpening.id);
      },
      error: (error) => {
        console.error('Error marking applicant as qualified:', error);
        this.closeQualifiedModal();
      }
    });
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
    this.currentApplicationId = applicant.applicationId;
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

    if (!this.currentApplicationId) {
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
      application_id: this.currentApplicationId,
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
    this.jobOpeningsService.sendJobOfferFull(payload).subscribe({
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
   * Open accept offer confirmation modal
   */
  openAcceptOfferConfirmation(applicant: Applicant): void {
    this.selectedApplicant = applicant;
    this.isAcceptOfferModalOpen = true;
  }

  /**
   * Close accept offer confirmation modal
   */
  closeAcceptOfferModal(): void {
    this.isAcceptOfferModalOpen = false;
    this.selectedApplicant = null;
  }

  /**
   * Confirm and accept job offer (move to New Joiner status)
   */
  confirmAcceptOffer(): void {
    if (!this.selectedApplicant?.applicationId) return;

    // Status 6 = Accepted / New Joiner
    this.jobOpeningsService.updateApplicationStatus(this.selectedApplicant.applicationId, 6).subscribe({
      next: () => {
        this.closeAcceptOfferModal();
        this.loadApplicants();
        this.getJobOpeningDetails(this.jobOpening.id);
      },
      error: (error) => {
        console.error('Error accepting job offer:', error);
        this.closeAcceptOfferModal();
      }
    });
  }

  /**
   * Handle application refresh after interview/feedback/job offer actions
   */
  onApplicationRefreshed(): void {
    this.loadApplicants();
    if (this.jobOpening?.id) {
      this.getJobOpeningDetails(this.jobOpening.id);
    }
  }

  /**
   * Handle feedback added event
   */
  onFeedbackAdded(): void {
    this.loadApplicants();
    if (this.jobOpening?.id) {
      this.getJobOpeningDetails(this.jobOpening.id);
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