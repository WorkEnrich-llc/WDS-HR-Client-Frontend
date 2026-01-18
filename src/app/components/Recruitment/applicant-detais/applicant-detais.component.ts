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
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { DatePickerComponent } from '../../shared/date-picker/date-picker.component';

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
    NgxDocViewerModule,
    PopupComponent,
    DatePickerComponent
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
  @ViewChild('jobBox') jobBox!: OverlayFilterBoxComponent;
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
  // Interviews
  interviews: any[] = [];
  isInterviewsLoading: boolean = false;
  // Job Offers
  jobOffers: any[] = [];
  isJobOffersLoading: boolean = false;
  // pending resend target
  pendingResendOfferId: number | null = null;
  // popup state for resend confirmation
  resendPopupOpen: boolean = false;
  isResendLoading: boolean = false;
  // Job offer overlay state
  overlayTitle: string = 'Job Offer';
  // Job offer validation errors
  jobOfferValidationErrors: {
    salary?: string;
    joinDate?: string;
    offerDetails?: string;
    noChanges?: string;
    noticePeriod?: string;
  } = {};
  // Job offer form model
  offerSalary: number | string | null = null;
  offerJoinDate: string = '';
  offerDetails: string = '';
  isEditingJobOffer: boolean = false;
  jobOfferDetailsLoading: boolean = false;
  jobOfferFormSubmitted: boolean = false;
  // Original values for change tracking
  private originalJobOfferValues: any = { notice_period: null, min_salary: 0, max_salary: 0 };
  includeProbation: boolean = false;
  noticePeriod: number | null = null;
  minSalary: number = 0;
  maxSalary: number = 0;
  withEndDate: boolean = false;
  contractEndDate: string = '';
  // currently selected interview for feedback or view
  currentInterviewForFeedback: any = null;

  // Assignment Selection
  availableAssignments: any[] = [];
  availableAssignmentsLoading: boolean = false;
  selectedAssignmentId: number | null = null;
  assignmentSearchTerm: string = '';
  assignmentCurrentPage: number = 1;
  assignmentPageSize: number = 10;
  assignmentTotalCount: number = 0;
  isAssignmentSubmitting: boolean = false;
  assignmentExpirationDate: string = '';
  assignmentExpirationTime: string = '';
  assignmentExpirationDateError: string = '';
  assignmentExpirationDateTouched: boolean = false;
  assignmentSelectionTouched: boolean = false;

  // Getter for minimum date (today)
  get minExpirationDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Handle date change from date picker
  onAssignmentExpirationDateChange(dateValue: string): void {
    if (dateValue) {
      // Extract date part (YYYY-MM-DD) from ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
      // Handle both ISO format and YYYY-MM-DD format
      const dateOnly = dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
      this.assignmentExpirationDate = dateOnly;
    } else {
      this.assignmentExpirationDate = '';
    }
    this.assignmentExpirationDateTouched = true;
  }

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
    // Always fetch feedback when feedback tab is opened
    if (tab === 'feedback') {
      this.fetchFeedbacks();
    }
    // Always fetch previous applications when tab is opened
    if (tab === 'previous-applications') {
      this.fetchPreviousApplications();
    }
    // Always fetch assignments when tab is opened
    if (tab === 'assignments') {
      this.fetchAssignments();
    }
    // Always fetch interviews when interviews tab is opened
    if (tab === 'interviews') {
      this.fetchInterviews();
    }
    // Always fetch job offers when job-offers tab is opened
    if (tab === 'job-offers') {
      this.fetchJobOffers();
    }
  }

  // Fetch interviews for current application
  fetchInterviews(): void {
    if (!this.applicationId) { this.interviews = []; this.isInterviewsLoading = false; return; }
    this.isInterviewsLoading = true;
    this.jobOpeningsService.getInterviews(this.applicationId, 1, 10).subscribe({
      next: (res) => {
        const list = res?.data?.list_items ?? res?.list_items ?? [];
        this.interviews = Array.isArray(list) ? list : [];
        this.isInterviewsLoading = false;
      },
      error: () => {
        this.interviews = [];
        this.isInterviewsLoading = false;
      }
    });
  }

  // Fetch job offers for current application
  fetchJobOffers(): void {
    if (!this.applicationId) { this.jobOffers = []; this.isJobOffersLoading = false; return; }
    this.isJobOffersLoading = true;
    this.jobOpeningsService.getJobOffers(this.applicationId, 1, 10).subscribe({
      next: (res) => {
        const list = res?.data?.list_items ?? res?.list_items ?? [];
        this.jobOffers = Array.isArray(list) ? list : [];
        this.isJobOffersLoading = false;
      },
      error: () => {
        this.jobOffers = [];
        this.isJobOffersLoading = false;
      }
    });
  }

  // Open feedback overlay for a specific interview
  openFeedbackForInterview(interview: any): void {
    this.currentInterviewForFeedback = interview;
    // Pre-fill feedbackRating/comment if you have per-interview feedback data
    this.feedbackRating = 0;
    this.feedbackComment = '';
    this.feedbackOverlay?.openOverlay();
  }

  // Stub: view interview details (could navigate or open modal)
  viewInterview(interview: any): void {
    // For now we'll navigate to interview detail if route exists, otherwise open details in overlay
    // Placeholder: show toast
    this.toasterService.showInfo('Opening interview details');
  }

  // Stub: open create interview overlay
  openCreateInterviewOverlay(): void {
    this.toasterService.showInfo('Open create interview dialog');
  }

  // Open create job offer overlay (stub)
  openCreateJobOffer(): void {
    this.openJobOfferOverlay();
  }

  // View job offer details (stub)
  viewJobOffer(offer: any): void {
    if (!offer || !offer.id) return;
    this.resetJobOfferForm();
    this.overlayTitle = 'Offer Details';
    this.jobBox?.openOverlay();
    this.jobOfferDetailsLoading = true;

    this.jobOpeningsService.getJobOffer(offer.id).subscribe({
      next: (res) => {
        const jobOffer = res?.data?.object_info ?? res?.object_info ?? res;
        this.offerSalary = jobOffer.salary ?? null;
        this.offerJoinDate = jobOffer.join_date ? jobOffer.join_date.substring(0, 10) : '';
        this.offerDetails = jobOffer.offer_details || '';
        this.noticePeriod = jobOffer.notice_period ?? null;
        this.minSalary = jobOffer.min_salary ?? jobOffer.salary ?? 0;
        this.maxSalary = jobOffer.max_salary ?? jobOffer.salary ?? 0;
        this.withEndDate = !!jobOffer.end_contract;
        this.contractEndDate = jobOffer.end_contract ? jobOffer.end_contract.substring(0, 10) : '';

        this.originalJobOfferValues = {
          salary: this.offerSalary,
          join_date: this.offerJoinDate,
          offer_details: this.offerDetails,
          notice_period: this.noticePeriod,
          min_salary: this.minSalary,
          max_salary: this.maxSalary
        };

        this.jobOfferDetailsLoading = false;
      },
      error: () => {
        this.jobOfferDetailsLoading = false;
      }
    });
  }

  // Resend job offer email (stub)
  resendJobOffer(offer: any): void {
    if (!offer || !offer.id) return;
    this.pendingResendOfferId = offer.id;
    this.resendPopupOpen = true;
  }

  // Confirm resend and call API
  confirmResend(): void {
    if (!this.pendingResendOfferId) return;
    const offerId = this.pendingResendOfferId;
    this.isResendLoading = true;
    this.jobOpeningsService.resendJobOffer(offerId).subscribe({
      next: () => {
        this.isResendLoading = false;
        this.toasterService.showSuccess('Job offer resend initiated');
        this.pendingResendOfferId = null;
        this.resendPopupOpen = false;
        // refresh job offers list
        this.fetchJobOffers();
      },
      error: (err) => {
        this.isResendLoading = false;
        const msg = err?.error?.message || 'Failed to resend job offer';
        this.toasterService.showError(msg);
        this.pendingResendOfferId = null;
        this.resendPopupOpen = false;
      }
    });
  }

  closeResendPopup(): void {
    this.resendPopupOpen = false;
    this.pendingResendOfferId = null;
  }

  // Job offer helpers (copied from interview component)
  private resetJobOfferForm(): void {
    this.offerSalary = null;
    this.offerJoinDate = '';
    this.offerDetails = '';
    this.jobOfferValidationErrors = {};
    this.isEditingJobOffer = false;
    this.jobOfferDetailsLoading = false;
    this.jobOfferFormSubmitted = false;
    this.originalJobOfferValues = { notice_period: null, min_salary: 0, max_salary: 0 };
  }

  openJobOfferOverlay(): void {
    this.resetJobOfferForm();
    this.overlayTitle = 'Job Offer';
    this.jobBox?.openOverlay();
  }

  openEditJobOfferOverlay(): void {
    // Set editing mode
    this.isEditingJobOffer = true;
    this.overlayTitle = 'Update Job Offer';
    this.jobBox?.openOverlay();
    this.jobOfferDetailsLoading = true;

    const jobOfferIdToUse = this.applicationDetails?.additional_info?.job_offer_id || this.applicationId;
    if (!jobOfferIdToUse) {
      this.jobOfferDetailsLoading = false;
      return;
    }
    this.jobOpeningsService.getJobOffer(jobOfferIdToUse).subscribe({
      next: (res) => {
        const jobOffer = res?.data?.object_info ?? res?.object_info ?? res;
        this.offerSalary = jobOffer.salary ?? null;
        this.offerJoinDate = jobOffer.join_date ? jobOffer.join_date.substring(0, 10) : '';
        this.offerDetails = jobOffer.offer_details || '';
        this.noticePeriod = jobOffer.notice_period ?? null;
        this.minSalary = jobOffer.min_salary ?? jobOffer.salary ?? 0;
        this.maxSalary = jobOffer.max_salary ?? jobOffer.salary ?? 0;

        this.originalJobOfferValues = {
          salary: this.offerSalary,
          join_date: this.offerJoinDate,
          offer_details: this.offerDetails,
          notice_period: this.noticePeriod,
          min_salary: this.minSalary,
          max_salary: this.maxSalary
        };

        this.jobOfferDetailsLoading = false;
      },
      error: () => {
        this.jobOfferDetailsLoading = false;
      }
    });
  }

  validateJoinDateField(): void {
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

  validateSalaryField(): void {
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
      if (this.jobOfferValidationErrors.salary) delete this.jobOfferValidationErrors.salary;
    }
  }

  onSalaryFocus(): void {
    if (this.jobOfferValidationErrors.salary) delete this.jobOfferValidationErrors.salary;
  }

  validateOfferDetailsField(): void {
    if (this.overlayTitle === 'Update Job Offer') {
      if (this.jobOfferValidationErrors.offerDetails) delete this.jobOfferValidationErrors.offerDetails;
      return;
    }
    if (!this.offerDetails || !this.offerDetails.trim()) {
      this.jobOfferValidationErrors.offerDetails = 'Offer details is required';
    } else {
      if (this.jobOfferValidationErrors.offerDetails) delete this.jobOfferValidationErrors.offerDetails;
    }
  }

  onOfferDetailsFocus(): void {
    if (this.overlayTitle !== 'Update Job Offer') {
      if (this.jobOfferValidationErrors.offerDetails) delete this.jobOfferValidationErrors.offerDetails;
    }
  }

  validateNoticePeriodField(): void {
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
      if (this.jobOfferValidationErrors.noticePeriod) delete this.jobOfferValidationErrors.noticePeriod;
    }
  }

  onNoticePeriodFocus(): void {
    if (this.jobOfferValidationErrors.noticePeriod) delete this.jobOfferValidationErrors.noticePeriod;
  }

  // Submit job offer (create or update)
  submitJobOffer(): void {
    this.jobOfferFormSubmitted = true;
    this.jobOfferValidationErrors = {};
    let hasErrors = false;
    if (!this.applicationId) return;

    if (this.overlayTitle === 'Update Job Offer') {
      const hasChanges = this.checkJobOfferFormChanges();
      if (!hasChanges) {
        this.jobOfferValidationErrors.noChanges = 'You need to update the job offer details';
        return;
      }
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

    if (!this.offerJoinDate || !this.offerJoinDate.trim()) {
      this.jobOfferValidationErrors.joinDate = 'Please select a join date';
      hasErrors = true;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const joinDate = new Date(this.offerJoinDate);
      joinDate.setHours(0, 0, 0, 0);
      if (joinDate < today) {
        this.jobOfferValidationErrors.joinDate = 'Join date must be today or in the future';
        hasErrors = true;
      }
    }

    if (this.overlayTitle !== 'Update Job Offer') {
      if (!this.offerDetails || !this.offerDetails.trim()) {
        this.jobOfferValidationErrors.offerDetails = 'Offer details is required';
        hasErrors = true;
      }
    }

    if (hasErrors) return;

    this.isLoading = true;

    if (this.overlayTitle === 'Update Job Offer') {
      const numericSalary = typeof this.offerSalary === 'string' ? Number(this.offerSalary) : this.offerSalary;
      const jobOfferId = this.applicationDetails?.additional_info?.job_offer_id;
      if (typeof jobOfferId !== 'number' || numericSalary == null) {
        this.isLoading = false;
        return;
      }
      this.jobOpeningsService.updateJobOffer(
        jobOfferId,
        numericSalary,
        this.offerJoinDate,
        this.offerDetails,
        this.noticePeriod != null ? Number(this.noticePeriod) : undefined
      ).subscribe({
        next: () => {
          this.isLoading = false;
          this.jobBox?.closeOverlay();
          this.resetJobOfferForm();
          this.refreshApplication();
        },
        error: () => {
          this.isLoading = false;
        }
      });
    } else {
      const payload: any = {
        application_id: this.applicationId,
        join_date: this.offerJoinDate,
        salary: typeof this.offerSalary === 'string' ? Number(this.offerSalary) : this.offerSalary,
        offer_details: this.offerDetails,
      };
      if (this.withEndDate && this.contractEndDate) payload.end_contract = this.contractEndDate;
      if (this.noticePeriod) payload.notice_period = this.noticePeriod;
      this.jobOpeningsService.sendJobOfferFull(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.jobBox?.closeOverlay();
          this.resetJobOfferForm();
          this.refreshApplication();
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

  private checkJobOfferFormChanges(): boolean {
    const original = this.originalJobOfferValues;
    if (this.offerSalary !== original.salary) return true;
    if ((this.offerJoinDate || '') !== (original.join_date || '')) return true;
    if ((this.offerDetails || '') !== (original.offer_details || '')) return true;
    if (this.noticePeriod !== original.notice_period) return true;
    if (this.minSalary !== original.min_salary) return true;
    if (this.maxSalary !== original.max_salary) return true;
    return false;
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
    this.filterBox?.openOverlay();
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
    this.jobBox?.closeOverlay();
  }

  ngOnInit(): void {
    // Subscribe to route param changes to load applicant data when ID changes
    this.route.paramMap.subscribe((params) => {
      const applicationIdParam = params.get('applicationId');
      const applicationId = applicationIdParam ? parseInt(applicationIdParam, 10) : NaN;

      if (!isNaN(applicationId)) {
        this.applicationId = applicationId;
        this.isLoading = true;

        // Reset all cached data when navigating to a new applicant
        this.feedbacks = [];
        this.applicantApplications = [];
        this.assignments = [];
        this.applicantDetails = null;
        this.applicationDetails = null;

        // Reset tab to CV when navigating
        this.currentTab = 'cv';

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
    // Mark fields as touched to show validation messages
    this.assignmentSelectionTouched = true;
    this.assignmentExpirationDateTouched = true;

    if (!this.selectedAssignmentId) {
      return;
    }

    if (!this.assignmentExpirationDate) {
      return;
    }

    if (!this.assignmentExpirationTime) {
      return;
    }

    if (!this.applicationId) {
      this.toasterService.showWarning('Application ID not found');
      return;
    }

    this.isAssignmentSubmitting = true;

    // Combine date and time in the format "YYYY-MM-DD HH:MM"
    const expirationDateTime = `${this.assignmentExpirationDate} ${this.assignmentExpirationTime}`;

    this.jobOpeningsService.assignAssignmentToApplicant(
      this.selectedAssignmentId,
      this.applicationId,
      expirationDateTime
    ).subscribe({
      next: () => {
        this.isAssignmentSubmitting = false;
        this.assignmentSelectionOverlay?.closeOverlay();
        this.toasterService.showSuccess('Assignment sent successfully');
        // Reset form
        this.selectedAssignmentId = null;
        this.assignmentExpirationDate = '';
        this.assignmentExpirationTime = '';
        this.assignmentSearchTerm = '';
        this.assignmentSelectionTouched = false;
        this.assignmentExpirationDateTouched = false;
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