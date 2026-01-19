import { Component, OnInit, inject, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientJobBoardService } from '../../services/client-job-board.service';
import { MetaTagsService } from '../../services/meta-tags.service';
import { JobOpeningsService } from 'app/core/services/recruitment/job-openings/job-openings.service';
import { ToastrService } from 'ngx-toastr';
import { OverlayFilterBoxComponent } from '../../../components/shared/overlay-filter-box/overlay-filter-box.component';
import { JobItem } from '../../models/job-listing.model';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './job-details.component.html',
  styleUrl: './job-details.component.css'
})
export class JobDetailsComponent implements OnInit {
  @ViewChild('feedbackBox') feedbackBox!: OverlayFilterBoxComponent;

  private route = inject(ActivatedRoute);
  router = inject(Router);
  private jobBoardService = inject(ClientJobBoardService);
  private metaTagsService = inject(MetaTagsService);
  private jobOpeningsService = inject(JobOpeningsService);
  private toastr = inject(ToastrService);

  jobId: string | null = null;
  job: JobItem | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  jobTitle: string = '';
  relatedJobs: JobItem[] = [];
  isLoadingRelated: boolean = false;

  // Feedback form properties
  rating: number | null = null;
  comment: string = '';
  submitting = false;
  feedbackValidationErrors: { [key: string]: string } = {};

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.jobId = id;
        this.loadJobDetails(parseInt(id, 10));
      } else {
        this.errorMessage = 'Job ID not found in URL';
      }
    });
  }

  private loadJobDetails(jobId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.jobBoardService.getJobDetails(jobId).subscribe({
      next: (response) => {
        this.isLoading = false;
        const jobData = response.data?.object_info;

        // Check if response contains error details or object_info is null
        if (response.details || !jobData) {
          // Treat as error condition even though it's a successful HTTP response
          this.errorMessage = response.details || 'Job not found';
          return;
        }

        // Success case - job data is available
        this.job = jobData;
        this.jobTitle = this.getName(jobData.job_title);
        // Load related jobs
        this.loadRelatedJobs(jobData.id);
        // Update meta tags for SEO
        this.updateMetaTags(jobData);
      },
      error: (error) => {
        this.isLoading = false;
        // Extract error message from response - check details first, then message
        this.errorMessage = error.error?.details || 
                          error.error?.message || 
                          error?.message || 
                          'We encountered an issue while fetching job details. Please try again in a moment.';
        console.error('Error loading job details:', error);
      }
    });
  }

  /**
   * Load related jobs (excluding current job)
   */
  private loadRelatedJobs(currentJobId: number): void {
    this.isLoadingRelated = true;
    // Fetch first page of jobs to get related opportunities
    this.jobBoardService.getJobListings(1, 10).subscribe({
      next: (response) => {
        this.isLoadingRelated = false;
        const jobsData = response.data?.list_items || [];
        // Filter out current job and limit to 5 related jobs
        this.relatedJobs = jobsData
          .filter((job: JobItem) => job.id !== currentJobId)
          .slice(0, 5);
      },
      error: (error) => {
        this.isLoadingRelated = false;
        console.error('Error loading related jobs:', error);
        this.relatedJobs = [];
      }
    });
  }

  /**
   * Helper function to extract name from object or string
   */
  private getName(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.name) return value.name;
    return '';
  }

  /**
   * Check if a job is considered "new" based on creation date
   */
  isJobNew(createdAt: string): boolean {
    if (!createdAt) return false;

    const createdDate = new Date(createdAt);
    const now = new Date();
    const daysDifference = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysDifference <= 7; // Consider jobs created within last 7 days as "new"
  }

  /**
   * Get experience text from job level
   */
  getExperienceText(jobLevel: string | undefined): string {
    if (!jobLevel) return 'Experience Required';
    // Map job levels to experience text
    const levelMap: { [key: string]: string } = {
      'Entry Level': '0-2 Years of Experience',
      'Mid Level': '3-5 Years of Experience',
      'Senior Level': '6-10 Years of Experience',
      'Expert': '10+ Years of Experience',
      'Consultant': '5+ Years of Experience'
    };
    return levelMap[jobLevel] || 'Experience Required';
  }

  /**
   * Get comprehensive ARIA label for job card
   */
  getJobCardAriaLabel(job: JobItem): string {
    const parts = [
      `Job: ${this.getName(job.job_title)}`,
      `Location: ${this.getName(job.branch)}`,
      `Level: ${this.getJobLevel(job)}`,
      `Type: ${this.getName(job.employment_type)}`,
      `Schedule: ${this.getName(job.work_schedule)}`
    ];
    if (this.isJobNew(job.created_at)) {
      parts.push('New posting');
    }
    return parts.join('. ');
  }

  /**
   * Get comprehensive ARIA label for related job
   */
  getRelatedJobAriaLabel(job: JobItem): string {
    return `Related opportunity: ${this.getName(job.job_title)} in ${this.getName(job.branch)}. ${this.getJobLevel(job)} position. ${this.getName(job.employment_type)}. Click to view details.`;
  }

  /**
   * Handle Apply button keyboard events
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Handle Enter and Space on Apply button
    if ((event.key === 'Enter' || event.key === ' ') && (event.target as HTMLElement).classList.contains('apply-button')) {
      event.preventDefault();
      (event.target as HTMLElement).click();
    }
  }

  /**
   * Handle Apply button click
   */
  onApplyClick(): void {
    if (this.job?.id) {
      this.router.navigate(['/careers', this.job.id, 'apply']);
    }
  }

  /**
   * Get loading state announcement for screen readers
   */
  getLoadingAnnouncement(): string {
    if (this.isLoading) {
      return 'Loading job details, please wait.';
    }
    if (this.isLoadingRelated) {
      return 'Loading related job opportunities.';
    }
    return '';
  }

  /**
   * Get job meta information for screen readers
   */
  getJobMetaInfo(job: JobItem): string {
    const parts = [
      `Location: ${this.getName(job.branch)}`,
      `Experience required: ${this.getExperienceText(this.getJobLevel(job))}`,
      `Employment type: ${this.getName(job.employment_type)}`,
      `Work schedule: ${this.getName(job.work_schedule)}`
    ];
    return parts.join('. ');
  }

  /**
   * Getter methods for template to extract name values
   */
  getJobTitle(job: JobItem | null): string {
    if (!job) return '';
    return this.getName(job.job_title);
  }

  getJobBranch(job: JobItem | null): string {
    if (!job) return '';
    return this.getName(job.branch);
  }

  getEmploymentType(job: JobItem | null): string {
    if (!job) return '';
    return this.getName(job.employment_type);
  }

  getWorkSchedule(job: JobItem | null): string {
    if (!job) return '';
    return this.getName(job.work_schedule);
  }

  getJobLevel(job: JobItem | null): string {
    if (!job) return '';
    // Use job_level first, fallback to work_mode (same logic as open-positions component)
    return job.job_level || this.getName(job.work_mode) || '';
  }

  /**
   * Update meta tags for job details page
   */
  private updateMetaTags(job: JobItem): void {
    // Load company settings to get company info for meta tags
    this.jobBoardService.getCompanySettings().subscribe({
      next: (response) => {
        const companyInfo = response.data?.object_info;
        if (companyInfo) {
          const jobTitle = this.getName(job.job_title);
          const jobDescription = job.job_description || undefined;
          this.metaTagsService.updateJobMetaTags(companyInfo, jobTitle, jobDescription, job.id);
        }
      },
      error: (error) => {
        // If company settings fail, still update with basic info
        const jobTitle = this.getName(job.job_title);
        this.metaTagsService.updateJobMetaTags(null, jobTitle, job.job_description, job.id);
      }
    });
  }

  /**
   * Open feedback modal
   */
  openFeedbackModal(): void {
    this.resetFeedbackForm();
    this.feedbackBox.openOverlay();
  }

  /**
   * Reset feedback form
   */
  resetFeedbackForm(): void {
    this.rating = null;
    this.comment = '';
    this.feedbackValidationErrors = {};
  }

  /**
   * Submit feedback
   */
  submitFeedback(): void {
    this.feedbackValidationErrors = {};
    let hasErrors = false;

    if (this.rating == null || this.rating < 0 || this.rating > 10) {
      this.feedbackValidationErrors['rating'] = 'Please provide a rating between 0 and 10';
      hasErrors = true;
    }

    if (!this.comment || this.comment.trim() === '') {
      this.feedbackValidationErrors['comment'] = 'Please provide your feedback';
      hasErrors = true;
    }

    if (hasErrors || !this.job?.id) {
      return;
    }

    this.submitting = true;
    this.jobOpeningsService.addApplicationFeedback(this.job.id, this.rating!, this.comment || '').subscribe({
      next: () => {
        this.submitting = false;
        this.toastr.success('Feedback submitted successfully');
        this.closeFeedbackOverlay();
        this.resetFeedbackForm();
      },
      error: (error) => {
        this.submitting = false;
        this.toastr.error(error.error?.message || 'Failed to submit feedback');
      }
    });
  }

  /**
   * Close feedback overlay
   */
  closeFeedbackOverlay(): void {
    this.feedbackBox?.closeOverlay();
  }

  /**
   * Clear validation error
   */
  clearFeedbackValidationError(field: string): void {
    delete this.feedbackValidationErrors[field];
  }
}
