import { Component, OnInit, inject } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { filter } from 'rxjs';
import { JobOpeningsService } from '../../../../core/services/recruitment/job-openings/job-openings.service';
import { JobCreationDataService } from '../../../../core/services/recruitment/job-openings/job-creation-data.service';

@Component({
  selector: 'app-update-job-open',
  imports: [PageHeaderComponent, CommonModule, RouterOutlet, PopupComponent],
  providers: [DatePipe],
  templateUrl: './update-job-open.component.html',
  styleUrl: './update-job-open.component.css'
})
export class UpdateJobOpenComponent implements OnInit {
  private jobOpeningsService = inject(JobOpeningsService);
  private jobCreationDataService = inject(JobCreationDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private datePipe = inject(DatePipe);

  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  activeRoute = '';
  jobId: number = 0;

  constructor() {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }

  ngOnInit() {
    // Get job ID from route params
    this.route.params.subscribe(params => {
      this.jobId = +params['id'];
      if (this.jobId) {
        this.loadJobData();
      }
    });

    this.updateActiveRoute();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveRoute();
    });
  }

  loadJobData(): void {
    this.isLoading = true;
    this.jobOpeningsService.getJobOpeningById(this.jobId).subscribe({
      next: (response) => {
        if (response.data && response.data.object_info) {
          // Pre-populate the service with existing job data from object_info
          const jobData = response.data.object_info;

          // Update main information
          this.jobCreationDataService.updateMainInformation({
            job_title_id: jobData.job_title?.id,
            employment_type: jobData.employment_type?.id,
            work_schedule_id: jobData.work_schedule?.id,
            days_on_site: jobData.days_on_site,
            branch_id: jobData.branch?.id,
            time_limit: jobData.time_limit,
            cv_limit: jobData.cv_limit
          });

          // Update dynamic fields if they exist
          if (jobData.recruiter_dynamic_fields) {
            this.jobCreationDataService.updateDynamicFields(jobData.recruiter_dynamic_fields);
          }

          console.log('Job data loaded:', jobData);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading job data:', error);
        this.errMsg = 'Failed to load job data';
        this.isLoading = false;
      }
    });
  }

  private updateActiveRoute(): void {
    const urlSegments = this.router.url.split('/');
    this.activeRoute = urlSegments[urlSegments.length - 1];
  }

  isActive(path: string): boolean {
    return this.activeRoute === path;
  }

  isCompleted(path: string): boolean {
    const order = ['main-information', 'required-details', 'attachments'];
    return order.indexOf(this.activeRoute) > order.indexOf(path);
  }

  getStepIconType(path: string): 'active' | 'completed' | 'upcoming' {
    if (this.isActive(path)) return 'active';
    if (this.isCompleted(path)) return 'completed';
    return 'upcoming';
  }

  // discard popup
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/job-openings']);
  }
}
