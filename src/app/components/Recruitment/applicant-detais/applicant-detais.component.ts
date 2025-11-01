import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CvComponent } from './cv/cv.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { InterviewComponent } from './interview/interview.component';
import { AttachmentAndInfoComponent } from './attachment-and-info/attachment-and-info.component';
import { OverlayFilterBoxComponent } from '../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute } from '@angular/router';
import { JobOpeningsService } from 'app/core/services/recruitment/job-openings/job-openings.service';
@Component({
  selector: 'app-applicant-detais',
  imports: [CommonModule, PageHeaderComponent, CvComponent, FeedbackComponent, InterviewComponent, AttachmentAndInfoComponent, OverlayFilterBoxComponent],
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
}
