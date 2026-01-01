import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CvComponent } from './cv/cv.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { InterviewComponent } from './interview/interview.component';
import { AttachmentAndInfoComponent } from './attachment-and-info/attachment-and-info.component';
import { OverlayFilterBoxComponent } from '../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JobOpeningsService } from 'app/core/services/recruitment/job-openings/job-openings.service';
@Component({
  selector: 'app-applicant-detais',
  imports: [FormsModule, PageHeaderComponent, CvComponent, FeedbackComponent, InterviewComponent, AttachmentAndInfoComponent, OverlayFilterBoxComponent, DatePipe, RouterLink],
  providers: [DatePipe],
  templateUrl: './applicant-detais.component.html',
  styleUrl: './applicant-detais.component.css'
})
export class ApplicantDetaisComponent implements OnInit {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  private route = inject(ActivatedRoute);
  private jobOpeningsService = inject(JobOpeningsService);

  isLoading: boolean = false;
  applicantDetails: any = null;
  applicationDetails: any = null;
  applicationId?: number;
  feedbacks: any[] = [];
  isFeedbackLoading: boolean = false;
  applicantApplications: any[] = [];

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
    // read applicationId from route params
    const applicationIdParam = this.route.snapshot.paramMap.get('applicationId');
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
              job_id: application.job || this.applicationDetails.job
            };

            // Fetch applications for this applicant
            if (applicant.id) {
              this.fetchApplicantApplications(applicant.id);
            }
          }

          this.fetchFeedbacks();
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
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
}
