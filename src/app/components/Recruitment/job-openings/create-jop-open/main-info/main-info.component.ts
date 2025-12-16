import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, HostListener, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../../../../../core/services/od/jobs/jobs.service';
import { BranchesService } from '../../../../../core/services/od/branches/branches.service';
import { WorkSchaualeService } from '../../../../../core/services/attendance/work-schaduale/work-schauale.service';
import { JobOpeningsService } from '../../../../../core/services/recruitment/job-openings/job-openings.service';
import { JobCreationDataService } from '../../../../../core/services/recruitment/job-openings/job-creation-data.service';
import { ToasterMessageService } from '../../../../../core/services/tostermessage/tostermessage.service';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-main-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  private toasterService = inject(ToasterMessageService);

  @Input() isUpdateMode = false;
  @Input() jobId: number | null = null;

  selectedJobTitle: any = null;
  selectedBranch: any = null;
  selectedWorkSchedule: any = null;
  selectedEmploymentType: string = '';
  selectedWorkMode: string = '';
  selectedOnsiteDays: string = '';
  timeLimit: number = 5;
  cvLimit: number = 20;

  // Work Mode options
  workModes = [
    { id: 1, name: 'On site' },
    { id: 2, name: 'Remote' },
    { id: 3, name: 'Hybrid' }
  ];
  isJobTitleDropdownOpen: boolean = false;
  isBranchDropdownOpen: boolean = false;
  isWorkScheduleDropdownOpen: boolean = false;

  // Validation state
  validationErrors: {
    jobTitle: string;
    employmentType: string;
    workMode: string;
    workSchedule: string;
    branch: string;
    timeLimit: string;
    cvLimit: string;
  } = {
      jobTitle: '',
      employmentType: '',
      workMode: '',
      workSchedule: '',
      branch: '',
      timeLimit: '',
      cvLimit: ''
    };
  isFormTouched = false;

  @Output() nextTab = new EventEmitter<void>();

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
    // Load from cache first, then load from API if needed
    this.loadJobTitlesFromCache();
    this.loadBranchesFromCache();
    this.loadWorkSchedulesFromCache();

    // Load existing data from service (for both create and update mode)
    this.loadExistingData();

    // Setup debounced search for job titles
    this.jobTitleSearchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.jobTitles = [];
      this.jobTitlesPage = 1;
      this.jobTitlesHasMore = true;
      this.loadJobTitlesFromAPI();
    });

    // Setup debounced search for branches
    this.branchSearchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.branches = [];
      this.branchesPage = 1;
      this.branchesHasMore = true;
      this.loadBranchesFromAPI();
    });

    // Setup debounced search for work schedules
    this.workScheduleSearchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.workSchedules = [];
      this.workSchedulesPage = 1;
      this.workSchedulesHasMore = true;
      this.loadWorkSchedulesFromAPI();
    });
  }

  loadExistingData(): void {
    // Get current data from service immediately
    const currentData = this.jobCreationDataService.getCurrentData();
    if (currentData.main_information) {
      this.applyMainInformationData(currentData.main_information);
    }

    // Also subscribe to service data changes for real-time updates
    this.jobCreationDataService.jobData$.subscribe(data => {
      if (data.main_information) {
        this.applyMainInformationData(data.main_information);
      }
    });
  }

  applyMainInformationData(mainInfo: any): void {
    // Pre-fill employment type
    if (mainInfo.employment_type) {
      this.selectedEmploymentType = mainInfo.employment_type.toString();
    }

    // Pre-fill work mode
    if (mainInfo.work_mode) {
      this.selectedWorkMode = mainInfo.work_mode.toString();
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

    // Pre-select job title
    if (mainInfo.job_title_id) {
      // Try to find in already loaded list
      let jobTitle = this.jobTitles.find(jt => jt.id === mainInfo.job_title_id);
      if (jobTitle) {
        this.selectedJobTitle = jobTitle;
      } else {
        // If not found, wait for list to load and try again
        const checkJobTitle = () => {
          jobTitle = this.jobTitles.find(jt => jt.id === mainInfo.job_title_id);
          if (jobTitle) {
            this.selectedJobTitle = jobTitle;
          } else if (this.jobTitlesInitialLoading) {
            setTimeout(checkJobTitle, 100);
          }
        };
        setTimeout(checkJobTitle, 100);
      }
    }

    // Pre-select branch
    if (mainInfo.branch_id) {
      let branch = this.branches.find(b => b.id === mainInfo.branch_id);
      if (branch) {
        this.selectedBranch = branch;
      } else {
        const checkBranch = () => {
          branch = this.branches.find(b => b.id === mainInfo.branch_id);
          if (branch) {
            this.selectedBranch = branch;
          } else if (this.branchesInitialLoading) {
            setTimeout(checkBranch, 100);
          }
        };
        setTimeout(checkBranch, 100);
      }
    }

    // Pre-select work schedule
    if (mainInfo.work_schedule_id) {
      let workSchedule = this.workSchedules.find(ws => ws.id === mainInfo.work_schedule_id);
      if (workSchedule) {
        this.selectedWorkSchedule = workSchedule;
      } else {
        const checkWorkSchedule = () => {
          workSchedule = this.workSchedules.find(ws => ws.id === mainInfo.work_schedule_id);
          if (workSchedule) {
            this.selectedWorkSchedule = workSchedule;
          } else if (this.workSchedulesInitialLoading) {
            setTimeout(checkWorkSchedule, 100);
          }
        };
        setTimeout(checkWorkSchedule, 100);
      }
    }
  }

  /**
   * Load job titles from cache first
   */
  loadJobTitlesFromCache(): void {
    const cached = this.jobCreationDataService.getCachedJobTitles();
    if (cached.length > 0) {
      this.jobTitles = cached;
      this.jobTitlesInitialLoading = false;
      this.jobTitlesHasMore = false; // Assume all cached
    } else {
      // No cache, load from API
      this.loadJobTitles();
    }
  }

  /**
   * Load job titles with pagination
   */
  loadJobTitles(): void {
    // If searching, don't use cache
    if (this.jobTitleSearchTerm.trim()) {
      this.loadJobTitlesFromAPI();
      return;
    }

    if (this.jobTitlesLoading || !this.jobTitlesHasMore) {
      return;
    }

    this.loadJobTitlesFromAPI();
  }

  /**
   * Load job titles from API
   */
  private loadJobTitlesFromAPI(): void {
    if (this.jobTitlesLoading || (!this.jobTitleSearchTerm.trim() && !this.jobTitlesHasMore)) {
      return;
    }

    this.jobTitlesLoading = true;

    this.jobsService.getAllJobTitles(this.jobTitlesPage, this.jobTitlesPerPage, {
      request_in: 'all',
      search: this.jobTitleSearchTerm.trim() || undefined
    }).subscribe({
      next: (response) => {
        if (response.data && response.data.list_items) {
          // Filter to only include active job titles
          const activeJobTitles = response.data.list_items.filter((jobTitle: any) => jobTitle.is_active === true);

          if (this.jobTitleSearchTerm.trim()) {
            // If searching, replace the list
            this.jobTitles = activeJobTitles;
          } else {
            // If not searching, append to existing
            this.jobTitles = [...this.jobTitles, ...activeJobTitles];
            // Cache the full list (first page only, no search)
            if (this.jobTitlesPage === 1 && !this.jobTitleSearchTerm.trim()) {
              this.jobCreationDataService.setCachedJobTitles([...this.jobTitles]);
            }
          }

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
   * Load branches from cache first
   */
  loadBranchesFromCache(): void {
    const cached = this.jobCreationDataService.getCachedBranches();
    if (cached.length > 0) {
      this.branches = cached;
      this.branchesInitialLoading = false;
      this.branchesHasMore = false; // Assume all cached
    } else {
      // No cache, load from API
      this.loadBranches();
    }
  }

  /**
   * Load branches with pagination
   */
  loadBranches(): void {
    // If searching, don't use cache
    if (this.branchSearchTerm.trim()) {
      this.loadBranchesFromAPI();
      return;
    }

    if (this.branchesLoading || !this.branchesHasMore) {
      return;
    }

    this.loadBranchesFromAPI();
  }

  /**
   * Load branches from API
   */
  private loadBranchesFromAPI(): void {
    if (this.branchesLoading || (!this.branchSearchTerm.trim() && !this.branchesHasMore)) {
      return;
    }

    this.branchesLoading = true;

    this.branchesService.getAllBranches(this.branchesPage, this.branchesPerPage, {
      search: this.branchSearchTerm.trim() || undefined
    }).subscribe({
      next: (response) => {
        if (response.data && response.data.list_items) {
          // Filter to only include active branches
          const activeBranches = response.data.list_items.filter((branch: any) => branch.is_active === true);

          if (this.branchSearchTerm.trim()) {
            // If searching, replace the list
            this.branches = activeBranches;
          } else {
            // If not searching, append to existing
            this.branches = [...this.branches, ...activeBranches];
            // Cache the full list (first page only, no search)
            if (this.branchesPage === 1 && !this.branchSearchTerm.trim()) {
              this.jobCreationDataService.setCachedBranches([...this.branches]);
            }
          }

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

  /**
   * Load work schedules from cache first
   */
  loadWorkSchedulesFromCache(): void {
    const cached = this.jobCreationDataService.getCachedWorkSchedules();
    if (cached.length > 0) {
      this.workSchedules = cached;
      this.workSchedulesInitialLoading = false;
      this.workSchedulesHasMore = false; // Assume all cached
    } else {
      // No cache, load from API
      this.loadWorkSchedules();
    }
  }

  loadWorkSchedules(): void {
    // If searching, don't use cache
    if (this.workScheduleSearchTerm.trim()) {
      this.loadWorkSchedulesFromAPI();
      return;
    }

    if (this.workSchedulesLoading || !this.workSchedulesHasMore) return;

    this.loadWorkSchedulesFromAPI();
  }

  /**
   * Load work schedules from API
   */
  private loadWorkSchedulesFromAPI(): void {
    if (this.workSchedulesLoading || (!this.workScheduleSearchTerm.trim() && !this.workSchedulesHasMore)) return;

    this.workSchedulesLoading = true;
    this.workSchedulesInitialLoading = this.workSchedulesPage === 1;

    this.workScheduleService.getAllWorkSchadule(this.workSchedulesPage, this.workSchedulesPerPage, {
      search: this.workScheduleSearchTerm.trim() || undefined
    }).subscribe({
      next: (response) => {
        if (response.data && response.data.list_items) {
          // Filter to only include active work schedules
          const activeWorkSchedules = response.data.list_items.filter((workSchedule: any) => workSchedule.is_active === true);

          if (this.workScheduleSearchTerm.trim()) {
            // If searching, replace the list
            this.workSchedules = activeWorkSchedules;
          } else {
            // If not searching
            if (this.workSchedulesPage === 1) {
              this.workSchedules = activeWorkSchedules;
              // Cache the full list (first page only, no search)
              this.jobCreationDataService.setCachedWorkSchedules([...this.workSchedules]);
            } else {
              this.workSchedules = [...this.workSchedules, ...activeWorkSchedules];
            }
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
      this.loadJobTitlesFromAPI();
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
      this.loadBranchesFromAPI();
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
      this.loadWorkSchedulesFromAPI();
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
    if (this.isFormTouched) {
      this.validationErrors.jobTitle = '';
    }
  }

  /**
   * Select branch
   */
  selectBranch(branch: any): void {
    this.selectedBranch = branch;
    this.isBranchDropdownOpen = false;
    this.branchSearchTerm = ''; // Clear search when selection is made
    this.updateJobData();
    if (this.isFormTouched) {
      this.validationErrors.branch = '';
    }
  }

  /**
   * Select work schedule
   */
  selectWorkSchedule(workSchedule: any): void {
    this.selectedWorkSchedule = workSchedule;
    this.isWorkScheduleDropdownOpen = false;
    this.workScheduleSearchTerm = ''; // Clear search when selection is made
    this.updateJobData();
    if (this.isFormTouched) {
      this.validationErrors.workSchedule = '';
    }
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
      this.toasterService.showError('Please fill in all required fields', 'Validation Error');
      return;
    }

    const jobData = {
      request_data: {
        main_information: {
          job_title_id: this.selectedJobTitle.id,
          employment_type: parseInt(this.selectedEmploymentType),
          work_mode: parseInt(this.selectedWorkMode),
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
        this.toasterService.showSuccess('Job opening created successfully', 'Created Successfully');
        // You can redirect or reset form here
      },
      error: (error) => {
        // Error toast is automatically shown by the interceptor
        // This additional call is for custom error handling if needed
        const errorMessage = error.error?.details || error.message || 'Failed to create job opening';
        this.toasterService.showError(errorMessage, 'Error');
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
      work_mode: this.selectedWorkMode ? parseInt(this.selectedWorkMode) : undefined,
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
    if (this.isFormTouched) {
      this.validationErrors.employmentType = '';
    }
  }

  /**
   * Handle work mode change
   */
  onWorkModeChange(): void {
    // Reset days on site if not hybrid
    if (this.selectedWorkMode !== '3') {
      this.selectedOnsiteDays = '';
    }
    this.updateJobData();
    if (this.isFormTouched) {
      this.validationErrors.workMode = '';
    }
  }

  /**
   * Handle work schedule change
   */
  onWorkScheduleChange(): void {
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
    if (this.isFormTouched) {
      this.validateTimeLimit();
    }
  }

  /**
   * Validate Time Limit
   */
  validateTimeLimit(): void {
    if (!this.timeLimit || this.timeLimit <= 0) {
      this.validationErrors.timeLimit = 'Time Limit must be greater than 0';
    } else {
      this.validationErrors.timeLimit = '';
    }
  }

  /**
   * Handle CV limit change
   */
  onCvLimitChange(): void {
    this.updateJobData();
    if (this.isFormTouched) {
      this.validateCvLimit();
    }
  }

  /**
   * Validate all fields
   */
  validateForm(): boolean {
    this.isFormTouched = true;
    let isValid = true;

    // Validate Job Title
    if (!this.selectedJobTitle) {
      this.validationErrors.jobTitle = 'Job Title is required';
      isValid = false;
    } else {
      this.validationErrors.jobTitle = '';
    }

    // Validate Employment Type
    if (!this.selectedEmploymentType) {
      this.validationErrors.employmentType = 'Employment Type is required';
      isValid = false;
    } else {
      this.validationErrors.employmentType = '';
    }

    // Validate Work Mode
    if (!this.selectedWorkMode) {
      this.validationErrors.workMode = 'Work Mode is required';
      isValid = false;
    } else {
      this.validationErrors.workMode = '';
    }

    // Validate Work Schedule
    if (!this.selectedWorkSchedule) {
      this.validationErrors.workSchedule = 'Work Schedule is required';
      isValid = false;
    } else {
      this.validationErrors.workSchedule = '';
    }

    // Validate Branch
    if (!this.selectedBranch) {
      this.validationErrors.branch = 'Branch is required';
      isValid = false;
    } else {
      this.validationErrors.branch = '';
    }

    // Validate Time Limit
    this.validateTimeLimit();
    if (this.validationErrors.timeLimit) {
      isValid = false;
    }

    // Validate CV Limit
    this.validateCvLimit();
    if (this.validationErrors.cvLimit) {
      isValid = false;
    }

    return isValid;
  }

  /**
   * Validate CV Limit
   */
  validateCvLimit(): void {
    if (!this.cvLimit || this.cvLimit <= 0) {
      this.validationErrors.cvLimit = 'CV Limit must be greater than 0';
    } else {
      this.validationErrors.cvLimit = '';
    }
  }

  /**
   * Navigate to next step with validation
   */
  goToNextStep(): void {
    if (this.validateForm()) {
      this.nextTab.emit();
    }
  }

  ngOnDestroy(): void {
    this.jobTitleSearchSubject.complete();
    this.branchSearchSubject.complete();
    this.workScheduleSearchSubject.complete();
  }
}
