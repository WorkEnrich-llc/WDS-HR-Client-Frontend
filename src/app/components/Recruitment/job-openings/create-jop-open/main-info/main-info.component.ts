import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JobsService } from '../../../../../core/services/od/jobs/jobs.service';
import { BranchesService } from '../../../../../core/services/od/branches/branches.service';
import { WorkSchaualeService } from '../../../../../core/services/attendance/work-schaduale/work-schauale.service';
import { JobOpeningsService } from '../../../../../core/services/recruitment/job-openings/job-openings.service';
import { JobCreationDataService } from '../../../../../core/services/recruitment/job-openings/job-creation-data.service';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-main-info',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './main-info.component.html',
  styleUrl: './main-info.component.css'
})
export class MainInfoComponent implements OnInit, OnDestroy {
  private jobsService = inject(JobsService);
  private branchesService = inject(BranchesService);
  private workScheduleService = inject(WorkSchaualeService);
  private jobOpeningsService = inject(JobOpeningsService);
  private jobCreationDataService = inject(JobCreationDataService);
  private route = inject(ActivatedRoute);

  selectedWorkMode: string = '';
  selectedJobTitle: any = null;
  selectedBranch: any = null;
  selectedWorkSchedule: any = null;
  selectedEmploymentType: string = '';
  selectedOnsiteDays: string = '';
  timeLimit: number = 5;
  cvLimit: number = 20;
  isJobTitleDropdownOpen: boolean = false;
  isBranchDropdownOpen: boolean = false;
  isWorkScheduleDropdownOpen: boolean = false;
  isUpdateMode = false;
  jobId: number | null = null;

  // Job Titles infinite scroll
  jobTitles: any[] = [];
  jobTitlesPage: number = 1;
  jobTitlesPerPage: number = 10;
  jobTitlesLoading: boolean = false;
  jobTitlesInitialLoading: boolean = true;
  jobTitlesHasMore: boolean = true;
  jobTitlesTotalPages: number = 1;

  // Branches infinite scroll
  branches: any[] = [];
  branchesPage: number = 1;
  branchesPerPage: number = 10;
  branchesLoading: boolean = false;
  branchesInitialLoading: boolean = true;

  // Work Schedules infinite scroll
  workSchedules: any[] = [];
  workSchedulesPage: number = 1;
  workSchedulesPerPage: number = 10;
  workSchedulesLoading: boolean = false;
  workSchedulesInitialLoading: boolean = true;
  workSchedulesHasMore: boolean = true;
  workSchedulesTotalPages: number = 1;

  branchesHasMore: boolean = true;
  branchesTotalPages: number = 1;

  // Search functionality
  jobTitleSearchTerm: string = '';
  branchSearchTerm: string = '';
  workScheduleSearchTerm: string = '';
  private jobTitleSearchSubject = new Subject<string>();
  private branchSearchSubject = new Subject<string>();
  private workScheduleSearchSubject = new Subject<string>();

  ngOnInit(): void {
    // Check if we're in update mode
    this.route.parent?.params.subscribe(params => {
      if (params['id']) {
        this.isUpdateMode = true;
        this.jobId = +params['id'];
      }
    });

    this.loadJobTitles();
    this.loadBranches();
    this.loadWorkSchedules();

    // Load existing data from service (for update mode)
    this.loadExistingData();

    // Setup debounced search for job titles
    this.jobTitleSearchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.jobTitles = [];
      this.jobTitlesPage = 1;
      this.jobTitlesHasMore = true;
      this.loadJobTitles();
    });

    // Setup debounced search for branches
    this.branchSearchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.branches = [];
      this.branchesPage = 1;
      this.branchesHasMore = true;
      this.loadBranches();
    });

    // Setup debounced search for work schedules
    this.workScheduleSearchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.workSchedules = [];
      this.workSchedulesPage = 1;
      this.workSchedulesHasMore = true;
      this.loadWorkSchedules();
    });
  }

  loadExistingData(): void {
    // Subscribe to service data to pre-fill form (for update mode)
    this.jobCreationDataService.jobData$.subscribe(data => {
      if (data.main_information) {
        const mainInfo = data.main_information;

        // Pre-fill employment type
        if (mainInfo.employment_type) {
          this.selectedEmploymentType = mainInfo.employment_type.toString();
        }

        // Pre-fill days on site
        if (mainInfo.days_on_site !== undefined) {
          this.selectedOnsiteDays = mainInfo.days_on_site.toString();
        }

        // Pre-fill time limit and cv limit
        if (mainInfo.time_limit !== undefined) {
          this.timeLimit = mainInfo.time_limit;
        }
        if (mainInfo.cv_limit !== undefined) {
          this.cvLimit = mainInfo.cv_limit;
        }

        // Pre-select job title (we need to wait for job titles to load)
        if (mainInfo.job_title_id) {
          setTimeout(() => {
            const jobTitle = this.jobTitles.find(jt => jt.id === mainInfo.job_title_id);
            if (jobTitle) {
              this.selectedJobTitle = jobTitle;
            }
          }, 1000); // Wait for initial load
        }

        // Pre-select branch
        if (mainInfo.branch_id) {
          setTimeout(() => {
            const branch = this.branches.find(b => b.id === mainInfo.branch_id);
            if (branch) {
              this.selectedBranch = branch;
            }
          }, 1000); // Wait for initial load
        }

        // Pre-select work schedule
        if (mainInfo.work_schedule_id) {
          setTimeout(() => {
            const workSchedule = this.workSchedules.find(ws => ws.id === mainInfo.work_schedule_id);
            if (workSchedule) {
              this.selectedWorkSchedule = workSchedule;
            }
          }, 1000); // Wait for initial load
        }
      }
    });
  }

  isHybridOrOnsite(): boolean {
    return this.selectedWorkMode === 'onsite' || this.selectedWorkMode === 'hypred';
  }

  /**
   * Load job titles with pagination
   */
  loadJobTitles(): void {
    if (this.jobTitlesLoading || !this.jobTitlesHasMore) {
      return;
    }

    this.jobTitlesLoading = true;

    this.jobsService.getAllJobTitles(this.jobTitlesPage, this.jobTitlesPerPage, {
      request_in: 'all',
      search: this.jobTitleSearchTerm.trim() || undefined
    }).subscribe({
      next: (response) => {
        if (response.data && response.data.list_items) {
          this.jobTitles = [...this.jobTitles, ...response.data.list_items];
          this.jobTitlesTotalPages = response.data.total_pages || 1;
          this.jobTitlesHasMore = this.jobTitlesPage < this.jobTitlesTotalPages;
        }
        this.jobTitlesLoading = false;
        this.jobTitlesInitialLoading = false;
      },
      error: (error) => {
        console.error('Error loading job titles:', error);
        this.jobTitlesLoading = false;
        this.jobTitlesInitialLoading = false;
      }
    });
  }

  /**
   * Load branches with pagination
   */
  loadBranches(): void {
    if (this.branchesLoading || !this.branchesHasMore) {
      return;
    }

    this.branchesLoading = true;

    this.branchesService.getAllBranches(this.branchesPage, this.branchesPerPage, {
      search: this.branchSearchTerm.trim() || undefined
    }).subscribe({
      next: (response) => {
        if (response.data && response.data.list_items) {
          this.branches = [...this.branches, ...response.data.list_items];
          this.branchesTotalPages = response.data.total_pages || 1;
          this.branchesHasMore = this.branchesPage < this.branchesTotalPages;
        }
        this.branchesLoading = false;
        this.branchesInitialLoading = false;
      },
      error: (error) => {
        console.error('Error loading branches:', error);
        this.branchesLoading = false;
        this.branchesInitialLoading = false;
      }
    });
  }

  loadWorkSchedules(): void {
    if (this.workSchedulesLoading || !this.workSchedulesHasMore) return;

    this.workSchedulesLoading = true;
    this.workSchedulesInitialLoading = this.workSchedulesPage === 1;

    this.workScheduleService.getAllWorkSchadule(this.workSchedulesPage, this.workSchedulesPerPage, {
      search: this.workScheduleSearchTerm.trim() || undefined
    }).subscribe({
      next: (response) => {
        if (response.data && response.data.list_items) {
          if (this.workSchedulesPage === 1) {
            this.workSchedules = response.data.list_items;
          } else {
            this.workSchedules = [...this.workSchedules, ...response.data.list_items];
          }

          this.workSchedulesTotalPages = response.data.total_pages || 1;
          this.workSchedulesHasMore = this.workSchedulesPage < this.workSchedulesTotalPages;
          this.workSchedulesPage++;
        }

        this.workSchedulesLoading = false;
        this.workSchedulesInitialLoading = false;
      },
      error: (error) => {
        console.error('Error loading work schedules:', error);
        this.workSchedulesLoading = false;
        this.workSchedulesInitialLoading = false;
      }
    });
  }

  /**
   * Handle scroll event for job titles dropdown
   */
  onJobTitlesScroll(event: Event): void {
    const div = event.target as HTMLDivElement;
    const scrollPosition = div.scrollTop + div.clientHeight;
    const scrollHeight = div.scrollHeight;

    // Load more when user is near the bottom (80% scrolled)
    if (scrollPosition >= scrollHeight * 0.8 && this.jobTitlesHasMore && !this.jobTitlesLoading) {
      this.jobTitlesPage++;
      this.loadJobTitles();
    }
  }

  /**
   * Handle scroll event for branches dropdown
   */
  onBranchesScroll(event: Event): void {
    const div = event.target as HTMLDivElement;
    const scrollPosition = div.scrollTop + div.clientHeight;
    const scrollHeight = div.scrollHeight;

    // Load more when user is near the bottom (80% scrolled)
    if (scrollPosition >= scrollHeight * 0.8 && this.branchesHasMore && !this.branchesLoading) {
      this.branchesPage++;
      this.loadBranches();
    }
  }

  /**
   * Handle scroll event for work schedules dropdown
   */
  onWorkSchedulesScroll(event: Event): void {
    const div = event.target as HTMLDivElement;
    const scrollPosition = div.scrollTop + div.clientHeight;
    const scrollHeight = div.scrollHeight;

    // Load more when user is near the bottom (80% scrolled)
    if (scrollPosition >= scrollHeight * 0.8 && this.workSchedulesHasMore && !this.workSchedulesLoading) {
      this.workSchedulesPage++;
      this.loadWorkSchedules();
    }
  }

  /**
   * Toggle job title dropdown
   */
  toggleJobTitleDropdown(): void {
    this.isJobTitleDropdownOpen = !this.isJobTitleDropdownOpen;
    this.isBranchDropdownOpen = false; // Close other dropdown
    this.isWorkScheduleDropdownOpen = false; // Close other dropdown
  }

  /**
   * Toggle branch dropdown
   */
  toggleBranchDropdown(): void {
    this.isBranchDropdownOpen = !this.isBranchDropdownOpen;
    this.isJobTitleDropdownOpen = false; // Close other dropdown
    this.isWorkScheduleDropdownOpen = false; // Close other dropdown
  }

  /**
   * Toggle work schedule dropdown
   */
  toggleWorkScheduleDropdown(): void {
    this.isWorkScheduleDropdownOpen = !this.isWorkScheduleDropdownOpen;
    this.isJobTitleDropdownOpen = false; // Close other dropdown
    this.isBranchDropdownOpen = false; // Close other dropdown
  }

  /**
   * Select job title
   */
  selectJobTitle(jobTitle: any): void {
    this.selectedJobTitle = jobTitle;
    this.isJobTitleDropdownOpen = false;
    this.jobTitleSearchTerm = ''; // Clear search when selection is made
    this.updateJobData();
  }

  /**
   * Select branch
   */
  selectBranch(branch: any): void {
    this.selectedBranch = branch;
    this.isBranchDropdownOpen = false;
    this.branchSearchTerm = ''; // Clear search when selection is made
    this.updateJobData();
  }

  /**
   * Select work schedule
   */
  selectWorkSchedule(workSchedule: any): void {
    this.selectedWorkSchedule = workSchedule;
    this.isWorkScheduleDropdownOpen = false;
    this.workScheduleSearchTerm = ''; // Clear search when selection is made
    this.updateJobData();
  }

  /**
   * Close dropdowns when clicking outside
   */
  closeDropdowns(): void {
    this.isJobTitleDropdownOpen = false;
    this.isBranchDropdownOpen = false;
    this.isWorkScheduleDropdownOpen = false;
    this.clearSearchTerms();
  }

  /**
   * Clear search terms when dropdowns are closed
   */
  clearSearchTerms(): void {
    this.jobTitleSearchTerm = '';
    this.branchSearchTerm = '';
    this.workScheduleSearchTerm = '';
  }

  /**
   * Handle job title search input change
   */
  onJobTitleSearchChange(): void {
    this.jobTitleSearchSubject.next(this.jobTitleSearchTerm);
  }

  /**
   * Handle branch search input change
   */
  onBranchSearchChange(): void {
    this.branchSearchSubject.next(this.branchSearchTerm);
  }

  /**
   * Handle work schedule search input change
   */
  onWorkScheduleSearchChange(): void {
    this.workScheduleSearchSubject.next(this.workScheduleSearchTerm);
  }

  /**
   * Handle clicks outside the component
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Check if click is inside any dropdown
    const isInsideAnyDropdown = target.closest('.custom-dropdown');

    // If click is outside any dropdown, close them and clear search
    if (!isInsideAnyDropdown) {
      this.closeDropdowns();
    }
  }

  /**
   * Create job opening
   */
  createJobOpening(): void {
    if (!this.selectedJobTitle || !this.selectedBranch || !this.selectedEmploymentType) {
      alert('Please fill in all required fields');
      return;
    }

    const jobData = {
      request_data: {
        main_information: {
          job_title_id: this.selectedJobTitle.id,
          employment_type: parseInt(this.selectedEmploymentType),
          work_schedule_id: parseInt(this.selectedWorkSchedule) || 1,
          days_on_site: parseInt(this.selectedOnsiteDays) || 0,
          branch_id: this.selectedBranch.id,
          time_limit: this.timeLimit,
          cv_limit: this.cvLimit
        },
        recruiter_dynamic_fields: {
          "Personal Details": {
            "Basic Info": [
              {
                "name": "Name",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Email",
                "type": "email",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Phone Number",
                "type": "phone",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Gender",
                "type": "number",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Age",
                "type": "number",
                "system": true,
                "value": null,
                "required": false
              }
            ],
            "Education Details": [
              {
                "name": "University Name",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "College Name",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Department",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Major",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Graduation Year",
                "type": "number",
                "system": true,
                "value": null,
                "required": false
              }
            ],
            "Address Information": [
              {
                "name": "Country",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "City",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "State/Province",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              }
            ]
          },
          "Professional Details": {
            "Current Job Information": [
              {
                "name": "Current Company",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Current Job Title",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Job Level",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Years of Experience",
                "type": "number",
                "system": true,
                "value": null,
                "required": false
              }
            ],
            "Salary Information": [
              {
                "name": "Current Salary",
                "type": "number",
                "system": true,
                "value": null,
                "required": false
              },
              {
                "name": "Expected Salary",
                "type": "number",
                "system": true,
                "value": null,
                "required": false
              }
            ]
          },
          "Attachments": {
            "links": [
              {
                "name": "Portfolio",
                "type": "text",
                "system": true,
                "value": null,
                "required": true
              },
              {
                "name": "Git",
                "type": "text",
                "system": true,
                "value": null,
                "required": false
              }
            ],
            "files": [
              {
                "name": "CV",
                "type": "text",
                "system": true,
                "value": null,
                "required": true
              }
            ]
          }
        }
      }
    };

    this.jobOpeningsService.createJobOpening(jobData).subscribe({
      next: (response) => {
        alert('Job opening created successfully!');
        // You can redirect or reset form here
      },
      error: (error) => {
        alert('Error creating job opening: ' + (error.error?.details || error.message));
      }
    });
  }

  /**
   * Update job creation data service
   */
  updateJobData(): void {
    const mainInfo = {
      job_title_id: this.selectedJobTitle?.id,
      employment_type: this.selectedEmploymentType ? parseInt(this.selectedEmploymentType) : undefined,
      work_schedule_id: this.selectedWorkSchedule?.id,
      days_on_site: this.selectedOnsiteDays ? parseInt(this.selectedOnsiteDays) : 0,
      branch_id: this.selectedBranch?.id,
      time_limit: this.timeLimit,
      cv_limit: this.cvLimit
    };

    this.jobCreationDataService.updateMainInformation(mainInfo);
  }

  /**
   * Handle employment type change
   */
  onEmploymentTypeChange(): void {
    this.updateJobData();
  }

  /**
   * Handle work schedule change
   */
  onWorkScheduleChange(): void {
    this.updateJobData();
  }

  /**
   * Handle work mode change
   */
  onWorkModeChange(): void {
    this.updateJobData();
  }

  /**
   * Handle onsite days change
   */
  onOnsiteDaysChange(): void {
    this.updateJobData();
  }

  /**
   * Handle time limit change
   */
  onTimeLimitChange(): void {
    this.updateJobData();
  }

  /**
   * Handle CV limit change
   */
  onCvLimitChange(): void {
    this.updateJobData();
  }

  ngOnDestroy(): void {
    this.jobTitleSearchSubject.complete();
    this.branchSearchSubject.complete();
    this.workScheduleSearchSubject.complete();
  }
}
