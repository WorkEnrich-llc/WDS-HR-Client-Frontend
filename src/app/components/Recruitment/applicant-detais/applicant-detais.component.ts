import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { InterviewComponent } from './interview/interview.component';
import { AttachmentAndInfoComponent } from './attachment-and-info/attachment-and-info.component';
import { OverlayFilterBoxComponent } from '../../shared/overlay-filter-box/overlay-filter-box.component';
import { TableComponent } from '../../shared/table/table.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobOpeningsService } from 'app/core/services/recruitment/job-openings/job-openings.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { NgxDocViewerModule } from 'ngx-doc-viewer';

@Component({
  selector: 'app-applicant-detais',
  imports: [
    FormsModule,
    PageHeaderComponent,
    InterviewComponent,
    AttachmentAndInfoComponent,
    OverlayFilterBoxComponent,
    TableComponent,
    DatePipe,
    DecimalPipe,
    NgClass,
    RouterLink,
    NgxDocViewerModule
  ],
  providers: [DatePipe],
  templateUrl: './applicant-detais.component.html',
  styleUrl: './applicant-detais.component.css'
})
export class ApplicantDetaisComponent implements OnInit {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  @ViewChild('feedbackOverlay') feedbackOverlay!: OverlayFilterBoxComponent;
  @ViewChild('assignmentSelectionOverlay') assignmentSelectionOverlay!: OverlayFilterBoxComponent;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobOpeningsService = inject(JobOpeningsService);
  private toasterService = inject(ToasterMessageService);

  // Math reference for template
  Math = Math;

  isLoading: boolean = false;
  isNextApplicationLoading: boolean = false;
  applicantDetails: any = null;
  applicationDetails: any = null;
  applicationId?: number;
  feedbacks: any[] = [];
  isFeedbackLoading: boolean = false;
  applicantApplications: any[] = [];
  isApplicationsLoading: boolean = false;
  assignments: any[] = [];
  isAssignmentsLoading: boolean = false;

  // Assignment Selection
  availableAssignments: any[] = [];
  availableAssignmentsLoading: boolean = false;
  selectedAssignmentId: number | null = null;
  assignmentSearchTerm: string = '';
  assignmentCurrentPage: number = 1;
  assignmentPageSize: number = 10;
  assignmentTotalCount: number = 0;
  isAssignmentSubmitting: boolean = false;

  // Tab management
  currentTab: string = 'cv';

  // Feedback form variables
  feedbackRating: number = 0;
  feedbackComment: string = '';
  isFeedbackSubmitting: boolean = false;

  // Reject form variables
  rejectionNotes: string = '';
  rejectionMailMessage: string = '';
  isRejectSubmitting: boolean = false;
  rejectValidationErrors: { rejectionMailMessage?: string } = {};

  // Status mapping
  private statusMap: Record<number, string> = {
    0: 'Applicant',
    1: 'Candidate',
    2: 'Interviewee',
    3: 'Job Offer Sent',
    4: 'New Joiner',
    5: 'Rejected',
    6: 'Qualified',
    7: 'Not Selected'
  };

  // Set current tab
  setCurrentTab(tab: string): void {
    this.currentTab = tab;
    // Lazy load feedback when feedback tab is opened
    if (tab === 'feedback' && this.feedbacks.length === 0 && !this.isFeedbackLoading) {
      this.fetchFeedbacks();
    }
    // Lazy load previous applications when tab is opened
    if (tab === 'previous-applications' && this.applicantApplications.length === 0 && !this.isApplicationsLoading) {
      this.fetchPreviousApplications();
    }
    // Lazy load assignments when tab is opened
    if (tab === 'assignments' && this.assignments.length === 0 && !this.isAssignmentsLoading) {
      this.fetchAssignments();
    }
  }

  // Get evaluation score
  getEvaluationScore(): number {
    return this.applicantDetails?.evaluation?.average_score ?? 0;
  }

  // Get max score (always 10)
  getMaxScore(): number {
    return 10;
  }

  // Get status label
  getStatusLabel(): string {
    if (!this.applicantDetails?.status) return 'Applicant';
    const status = typeof this.applicantDetails.status === 'number'
      ? this.statusMap[this.applicantDetails.status]
      : this.applicantDetails.status;
    return status || 'Applicant';
  }

  // Check if user can add feedback
  canAddFeedback(): boolean {
    // You can add your permission logic here
    return !this.isNewJoiner && !this.isRejected;
  }

  // Download CV
  downloadCv() {
    const url = this.getCvUrlFromApplication();
    if (!url) return;

    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${this.applicantDetails?.name || 'cv'}.pdf`;
        link.click();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(error => {
        alert('An error occurred while downloading the CV.');
        console.error('Download error:', error);
      });
  }

  // Submit feedback
  submitFeedback(): void {
    if (!this.applicationId) return;

    this.isFeedbackSubmitting = true;

    this.jobOpeningsService.addApplicationFeedback(
      this.applicationId,
      this.feedbackRating,
      this.feedbackComment
    ).subscribe({
      next: () => {
        this.isFeedbackSubmitting = false;
        this.feedbackOverlay?.closeOverlay();
        this.feedbackRating = 0;
        this.feedbackComment = '';
        this.fetchFeedbacks();
      },
      error: () => {
        this.isFeedbackSubmitting = false;
      }
    });
  }

  // Check if status is New Joiner
  get isNewJoiner(): boolean {
    if (!this.applicantDetails?.status) return false;
    const status = typeof this.applicantDetails.status === 'number'
      ? this.statusMap[this.applicantDetails.status]
      : this.applicantDetails.status;
    return status === 'New Joiner';
  }

  // Check if status is Rejected
  get isRejected(): boolean {
    if (!this.applicantDetails?.status) return false;
    const status = typeof this.applicantDetails.status === 'number'
      ? this.statusMap[this.applicantDetails.status]
      : this.applicantDetails.status;
    return status === 'Rejected';
  }

  // Open reject overlay
  openRejectOverlay(): void {
    this.rejectionNotes = '';
    this.rejectionMailMessage = '';
    this.rejectValidationErrors = {};
    this.overlay?.openOverlay();
  }

  // Clear validation errors when user types
  onRejectFormChange(): void {
    if (this.rejectValidationErrors.rejectionMailMessage) {
      this.rejectValidationErrors.rejectionMailMessage = undefined;
    }
  }

  // Submit reject form
  submitReject(): void {
    // Clear previous validation errors
    this.rejectValidationErrors = {};

    // Validate rejection mail message (mandatory)
    if (!this.rejectionMailMessage || !this.rejectionMailMessage.trim()) {
      this.rejectValidationErrors.rejectionMailMessage = 'Rejection email is required';
      return;
    }

    if (!this.applicationId) return;

    this.isRejectSubmitting = true;

    this.jobOpeningsService.rejectApplication(
      this.applicationId,
      this.rejectionNotes || '',
      this.rejectionMailMessage.trim()
    ).subscribe({
      next: () => {
        this.isRejectSubmitting = false;
        this.closeAllOverlays();
        this.refreshApplication();
      },
      error: () => {
        this.isRejectSubmitting = false;
      }
    });
  }

  closeAllOverlays(): void {
    this.filterBox?.closeOverlay();
  }

  ngOnInit(): void {
    // Subscribe to route param changes to load applicant data when ID changes
    this.route.paramMap.subscribe((params) => {
      const applicationIdParam = params.get('applicationId');
      const applicationId = applicationIdParam ? parseInt(applicationIdParam, 10) : NaN;

      if (!isNaN(applicationId)) {
        this.applicationId = applicationId;
        this.isLoading = true;

        // Call application details API directly using application_id
        this.jobOpeningsService.getApplicationDetails(applicationId).subscribe({
          next: (appRes) => {
            this.applicationDetails = appRes?.data?.object_info ?? appRes?.object_info ?? appRes;

            // Extract applicant details from application response
            if (this.applicationDetails) {
              const application = this.applicationDetails.application || this.applicationDetails;
              const applicant = this.applicationDetails.applicant || {};

              // Extract name, email, phone from application_content if applicant object is empty
              const basicInfo = application.application_content?.['Personal Details']?.['Basic Info'] || [];

              // Map applicant details from application response
              this.applicantDetails = {
                id: applicant.id,
                name: applicant.name || basicInfo.find((f: any) => f.name === 'Name')?.value || 'N/A',
                email: applicant.email || basicInfo.find((f: any) => f.name === 'Email')?.value || 'N/A',
                phone: applicant.phone || basicInfo.find((f: any) => f.name === 'Phone Number')?.value || 'N/A',
                status: application.status,
                created_at: application.created_at,
                application_id: application.id,
                job_id: application.job || this.applicationDetails.job,
                evaluation: applicant.evaluation
              };

              // Fetch applications for this applicant
              if (applicant.id) {
                // Store applicant ID for later use
                this.applicantDetails.applicantId = applicant.id;
              }
            }

            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
      }
    });
  }

  getCvUrlFromApplication(): string | undefined {
    const files = this.applicationDetails?.application?.application_content?.Attachments?.files;
    if (Array.isArray(files)) {
      const cv = files.find((f: any) => (f?.name || '').toString().toLowerCase() === 'cv' && f?.value);
      return cv?.value;
    }
    return undefined;
  }

  fetchFeedbacks(): void {
    if (!this.applicationId) { this.isLoading = false; return; }
    this.isFeedbackLoading = true;
    this.jobOpeningsService.getApplicationFeedbacks(this.applicationId, 1, 10).subscribe({
      next: (fbRes) => {
        const list = fbRes?.data?.list_items ?? fbRes?.list_items ?? [];
        this.feedbacks = Array.isArray(list) ? list : [];
        this.isFeedbackLoading = false;
        this.isLoading = false;
      },
      error: () => {
        this.feedbacks = [];
        this.isFeedbackLoading = false;
        this.isLoading = false;
      }
    });
  }

  refreshApplication(): void {
    if (!this.applicationId) return;
    this.isLoading = true;
    this.jobOpeningsService.getApplicationDetails(this.applicationId).subscribe({
      next: (appRes) => {
        this.applicationDetails = appRes?.data?.object_info ?? appRes?.object_info ?? appRes;
        // Update applicant details status from application
        if (this.applicantDetails) {
          this.applicantDetails.status = this.applicationDetails?.application?.status;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private fetchApplicantApplications(applicantId: number): void {
    this.jobOpeningsService.getApplicationsByApplicantId(applicantId).subscribe({
      next: (res) => {
        const applications = res?.data?.list_items ?? res?.list_items ?? [];
        this.applicantApplications = Array.isArray(applications) ? applications : [];
      },
      error: () => {
        this.applicantApplications = [];
      }
    });
  }

  fetchPreviousApplications(): void {
    if (!this.applicantDetails?.applicantId) { return; }
    this.isApplicationsLoading = true;
    this.jobOpeningsService.getApplicationsByApplicantId(this.applicantDetails.applicantId).subscribe({
      next: (res) => {
        const applications = res?.data?.list_items ?? res?.list_items ?? [];
        this.applicantApplications = Array.isArray(applications) ? applications : [];
        this.isApplicationsLoading = false;
      },
      error: () => {
        this.applicantApplications = [];
        this.isApplicationsLoading = false;
      }
    });
  }

  fetchAssignments(): void {
    if (!this.applicationId) { return; }
    this.isAssignmentsLoading = true;
    this.jobOpeningsService.getApplicantAssignments(this.applicationId, 1, 10).subscribe({
      next: (res) => {
        const assignmentsList = res?.data?.list_items ?? res?.list_items ?? [];
        this.assignments = Array.isArray(assignmentsList) ? assignmentsList : [];
        this.isAssignmentsLoading = false;
      },
      error: () => {
        this.assignments = [];
        this.isAssignmentsLoading = false;
      }
    });
  }

  getStatusBadgeForApp(status: string): { class: string; label: string } {
    const statusBadges: Record<string, { class: string; label: string }> = {
      'Applicant': {
        class: 'badge-gray',
        label: 'Applicant'
      },
      'Candidate': {
        class: 'badge-newjoiner',
        label: 'Candidate'
      },
      'Interviewee': {
        class: 'badge-newemployee',
        label: 'Interviewee'
      },
      'Job Offer Sent': {
        class: 'badge-success',
        label: 'Job Offer Sent'
      },
      'New Joiner': {
        class: 'badge-success',
        label: 'New Joiner'
      },
      'Accepted': {
        class: 'badge-success',
        label: 'Accepted'
      },
      'Rejected': {
        class: 'badge-danger',
        label: 'Rejected'
      },
      'Not Selected': {
        class: 'badge-gray',
        label: 'Not Selected'
      }
    };

    return statusBadges[status] || statusBadges['Applicant'];
  }

  // Navigate to next application
  goToNextApplication(): void {
    // Prevent multiple calls
    if (this.isNextApplicationLoading || !this.applicationId) {
      return;
    }

    this.isNextApplicationLoading = true;

    this.jobOpeningsService.getNextApplication(this.applicationId).subscribe({
      next: (response) => {
        this.isNextApplicationLoading = false;

        // Check if there's a details message (no next application)
        if (response?.details) {
          this.toasterService.showInfo(response.details);
          return;
        }

        // Get the next application ID from the response
        const nextApplicationId = response?.data?.object_info?.application?.id ||
          response?.data?.object_info?.id ||
          response?.data?.id;

        if (nextApplicationId) {
          // Navigate to the next application without page refresh
          this.router.navigate(['/job-openings/view-applicant-details', nextApplicationId]);
        } else {
          this.toasterService.showWarning('Unable to navigate to next application');
        }
      },
      error: (error) => {
        this.isNextApplicationLoading = false;

        // Check if error response has a details message
        const errorDetails = error?.error?.details || error?.details;
        if (errorDetails) {
          this.toasterService.showError(errorDetails);
        }
      }
    });
  }

  // Open assignment selection overlay
  openAssignmentSelection(): void {
    this.selectedAssignmentId = null;
    this.assignmentSearchTerm = '';
    this.assignmentCurrentPage = 1;
    this.fetchAvailableAssignments();
    this.assignmentSelectionOverlay?.openOverlay();
  }

  // Fetch available assignments
  fetchAvailableAssignments(): void {
    this.availableAssignmentsLoading = true;
    this.jobOpeningsService.getAssignmentsForSelection(
      this.assignmentCurrentPage,
      this.assignmentPageSize,
      this.assignmentSearchTerm
    ).subscribe({
      next: (res) => {
        const list = res?.data?.list_items ?? res?.list_items ?? [];
        this.availableAssignments = Array.isArray(list) ? list : [];
        this.assignmentTotalCount = res?.data?.total_items ?? res?.total_items ?? 0;
        this.availableAssignmentsLoading = false;
      },
      error: () => {
        this.availableAssignments = [];
        this.availableAssignmentsLoading = false;
      }
    });
  }

  // Handle assignment search
  onAssignmentSearchInput(): void {
    this.assignmentCurrentPage = 1;
    this.fetchAvailableAssignments();
  }

  // Toggle assignment selection (radio button single select)
  toggleAssignmentSelection(assignmentId: number): void {
    // If clicking the same assignment, deselect it
    if (this.selectedAssignmentId === assignmentId) {
      this.selectedAssignmentId = null;
    } else {
      // If clicking a different assignment, select it (exclusive)
      this.selectedAssignmentId = assignmentId;
    }
  }

  // Check if assignment is selected
  isAssignmentSelected(assignmentId: number): boolean {
    return this.selectedAssignmentId === assignmentId;
  }

  // Get total pages for assignments
  getAssignmentTotalPages(): number {
    return Math.ceil(this.assignmentTotalCount / this.assignmentPageSize);
  }

  // Change assignment page
  changeAssignmentPage(page: number): void {
    if (page >= 1 && page <= this.getAssignmentTotalPages()) {
      this.assignmentCurrentPage = page;
      this.fetchAvailableAssignments();
    }
  }

  // Confirm assignment selection
  confirmAssignmentSelection(): void {
    if (!this.selectedAssignmentId) {
      this.toasterService.showWarning('Please select an assignment');
      return;
    }

    if (!this.applicationId) {
      this.toasterService.showWarning('Application ID not found');
      return;
    }

    this.isAssignmentSubmitting = true;

    // Calculate expiration date (default to 3 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 3);
    const formattedDate = expirationDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    this.jobOpeningsService.assignAssignmentToApplicant(
      this.selectedAssignmentId,
      this.applicationId,
      formattedDate
    ).subscribe({
      next: () => {
        this.isAssignmentSubmitting = false;
        this.assignmentSelectionOverlay?.closeOverlay();
        this.toasterService.showSuccess('Assignment sent successfully');
        this.fetchAssignments();
      },
      error: () => {
        this.isAssignmentSubmitting = false;
        this.toasterService.showError('Failed to send assignment');
      }
    });
  }

  // Get pagination info for display
  getPaginationInfo(): string {
    if (this.availableAssignments.length === 0) {
      return '0 from 0';
    }
    const startItem = (this.assignmentCurrentPage - 1) * this.assignmentPageSize + 1;
    return `${startItem} from ${this.assignmentTotalCount}`;
  }
}

