import { Component, ViewChild, Input, OnChanges, SimpleChanges, inject, Output, EventEmitter } from '@angular/core';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';

import { FormsModule } from '@angular/forms';
import { JobOpeningsService } from 'app/core/services/recruitment/job-openings/job-openings.service';
import { DepartmentsService } from 'app/core/services/od/departments/departments.service';
import { BranchesService } from 'app/core/services/od/branches/branches.service';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-interview',
  imports: [FormsModule, OverlayFilterBoxComponent, DecimalPipe],
  templateUrl: './interview.component.html',
  styleUrl: './interview.component.css',
})
export class InterviewComponent implements OnChanges {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  @ViewChild('jobBox') jobBox!: OverlayFilterBoxComponent;
  @Input() applicant: any;
  @Input() applicationId?: number;
  @Input() applicationDetails?: any;
  @Output() applicationRefreshed = new EventEmitter<void>();
  status = 'Applicant';
  interviewStatus = true;
  overlayTitle: string = 'Schedule Interview';
  interviewId?: number;
  additionalInterviewId?: number;
  jobOfferId?: number;

  private svc = inject(JobOpeningsService);
  private departmentsService = inject(DepartmentsService);
  private branchesService = inject(BranchesService);
  private employeeService = inject(EmployeeService);
  submitting = false;

  // Departments data
  departments: Array<{ id: number; name: string; code: string }> = [];
  departmentsLoading = false;

  // Sections data
  sections: Array<{ id: number; name: string; code: string }> = [];
  sectionsLoading = false;

  // Branches data
  branches: Array<{ id: number; name: string; code: string }> = [];
  branchesLoading = false;

  // Employees data
  employees: Array<{ id: number; name: string }> = [];
  employeesLoading = false;

  // Interview details loading state
  interviewDetailsLoading = false;

  // Original interview values for change tracking (reschedule)
  private originalInterviewValues: {
    title?: string;
    interviewer?: number | null;
    department?: number | null;
    section?: number | null;
    date?: string;
    time_from?: string;
    time_to?: string;
    interview_type?: number;
    location?: number | null;
  } = {};

  // Expected values from interview details (used to populate fields as APIs load)
  private expectedInterviewValues: {
    department?: number | null;
    section?: number | null;
    interviewer?: number | null;
    location?: number | null;
  } = {};

  // Interview form model
  interviewTitle: string = '';
  interviewer: number | null = null;
  department: number | null = null;
  section: number | null = null;
  date: string = '';
  time_from: string = '';
  time_to: string = '';
  interview_type: number = 1; // 1 offline, 2 online
  location: number | null = null;

  // Validation errors
  validationErrors: {
    interviewer?: string;
    date?: string;
    time_from?: string;
    time_to?: string;
    location?: string;
    noChanges?: string;
  } = {};

  // Job offer validation errors
  jobOfferValidationErrors: {
    salary?: string;
    joinDate?: string;
    offerDetails?: string;
    noChanges?: string;
  } = {};

  // Job offer form model
  offerSalary: number | null = null;
  offerJoinDate: string = '';
  offerDetails: string = '';
  isEditingJobOffer: boolean = false;
  jobOfferDetailsLoading: boolean = false;

  // Original job offer values for change tracking (edit mode)
  private originalJobOfferValues: {
    salary?: number | null;
    join_date?: string;
    offer_details?: string;
  } = {};

  // Probation period checkbox for job offer
  includeProbation: boolean = false;

  // Job offer additional fields for template
  noticePeriod: number | null = null;
  minSalary: number = 0;
  maxSalary: number = 0;
  withEndDate: boolean = false;
  contractEndDate: string = '';

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['applicant']) {
      const raw = this.applicant?.status;
      if (typeof raw === 'number') {
        this.status = this.statusMap[raw] ?? 'Applicant';
      } else if (typeof raw === 'string') {
        const str = raw.trim();
        // numeric-like string
        if (/^\d+$/.test(str)) {
          const code = parseInt(str, 10);
          this.status = this.statusMap[code] ?? 'Applicant';
        } else {
          this.status = this.normalizeStatusFromString(str);
        }
      }
    }
    if (changes['applicationDetails']) {
      // Extract interview ID from application details
      this.interviewId = this.applicationDetails?.interview?.id ??
        this.applicationDetails?.application?.interview?.id ??
        this.applicationDetails?.interview_id ??
        undefined;
      // Extract interview_id from additional_info if present
      this.additionalInterviewId = this.applicationDetails?.additional_info?.interview_id ?? undefined;
      // Extract job_offer_id from additional_info if present
      this.jobOfferId = this.applicationDetails?.additional_info?.job_offer_id ?? undefined;
    }
  }

  isStatus(name: string): boolean {
    return this.status === name;
  }

  get isRescheduleLoading(): boolean {
    // For reschedule interview, check if any required APIs are still loading
    if (this.overlayTitle !== 'Reschedule Interview') {
      return false;
    }

    // Check if interview details are loading
    if (this.interviewDetailsLoading) {
      return true;
    }

    // Check if departments or branches are loading
    if (this.departmentsLoading || this.branchesLoading) {
      return true;
    }

    // If department is set, check if sections are loading
    if (this.department && this.sectionsLoading) {
      return true;
    }

    // If section is set, check if employees are loading
    if (this.section && this.employeesLoading) {
      return true;
    }

    return false;
  }

  private normalizeStatusFromString(input: string): string {
    const norm = input.toLowerCase();
    if (norm.includes('applicant')) return 'Applicant';
    if (norm.includes('candidate')) return 'Candidate';
    if (norm.includes('interview')) return 'Interviewee';
    if (norm.includes('offer')) return 'Job Offer Sent';
    if (norm.includes('new join')) return 'New Joiner';
    if (norm.includes('not selected')) return 'Not Selected';
    if (norm.includes('reject')) return 'Rejected';
    if (norm.includes('qualif')) return 'Qualified';
    return 'Applicant';
  }

  openOverlay(title: string, target: 'filter' | 'job' = 'filter'): void {
    this.overlayTitle = title;
    if (target === 'filter') {
      // Load departments and branches when opening interview overlay (only for Schedule, not Reschedule)
      // Reschedule loads them explicitly before calling this method
      if (title === 'Schedule Interview') {
        this.loadDepartments();
        this.loadBranches();
      }
      this.filterBox.openOverlay();
    } else {
      // Reset job offer form when opening job offer overlay
      this.resetJobOfferForm();
      this.jobBox.openOverlay();
    }
  }
  closeAllOverlays(): void {
    this.filterBox?.closeOverlay();
    this.jobBox?.closeOverlay();
  }

  addAsCandidate(): void {
    if (!this.applicationId) return;
    this.submitting = true;
    this.svc.updateApplicationStatus(this.applicationId, 2).subscribe({
      next: () => {
        this.submitting = false;
        this.applicationRefreshed.emit();
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  openInterviewOverlay(): void {
    this.resetInterviewForm(); // Reset form before opening
    this.openOverlay('Schedule Interview', 'filter');
  }

  openRescheduleOverlay(): void {
    this.resetInterviewForm(); // Reset form first
    this.openOverlay('Reschedule Interview', 'filter');
    this.interviewDetailsLoading = true;
    this.loadDepartments();
    this.loadBranches();
    // Use additionalInterviewId if available, otherwise fall back to applicationId
    const interviewIdToUse = this.additionalInterviewId || this.applicationId;
    if (interviewIdToUse) {
      this.svc.getInterviewDetails(interviewIdToUse).subscribe({
        next: (res) => {
          const interview = res?.data?.object_info ?? res?.object_info ?? res;
          const interviewDept = interview.department?.id ?? interview.department ?? null;
          const interviewSection = interview.section?.id ?? interview.section ?? null;
          const interviewInterviewer = interview.interviewer?.id ?? interview.interviewer ?? null;
          const interviewType = interview.interview_type?.id ?? interview.interview_type ?? 1;

          // Store expected values to populate fields as APIs load
          this.expectedInterviewValues = {
            department: interviewDept,
            section: interviewSection,
            interviewer: interviewInterviewer,
            location: interview.location?.id ?? interview.location ?? null
          };

          // Populate form fields immediately from response (these don't depend on other APIs)
          this.interviewTitle = interview.title || '';
          this.date = interview.date || '';
          this.time_from = interview.time_from ? interview.time_from.substring(0, 5) : ''; // Extract HH:mm from HH:mm:ss
          this.time_to = interview.time_to ? interview.time_to.substring(0, 5) : ''; // Extract HH:mm from HH:mm:ss
          this.interview_type = interviewType;

          // Set location if available (branches API will populate dropdown, but we can set value if branches already loaded)
          if (this.expectedInterviewValues.location && this.branches.length > 0) {
            this.location = this.expectedInterviewValues.location;
          }

          // Set department if available and departments already loaded
          if (interviewDept && this.departments.length > 0) {
            this.department = interviewDept;
          }

          // Store original values for change tracking (store all values we have now)
          this.originalInterviewValues = {
            title: this.interviewTitle,
            interviewer: interviewInterviewer,
            department: interviewDept,
            section: interviewSection,
            date: this.date,
            time_from: this.time_from,
            time_to: this.time_to,
            interview_type: interviewType,
            location: this.expectedInterviewValues.location
          };

          // Mark interview details as loaded (don't wait for sections/employees)
          this.interviewDetailsLoading = false;

          // Load sections if department is available (will set values as they load)
          // Note: If departments API already loaded, loadSectionsForDepartment will be called from loadDepartments
          if (interviewDept && this.departments.length > 0) {
            // Departments already loaded, trigger sections load
            this.loadSectionsForDepartment(interviewDept);
          } else if (interviewDept) {
            // Departments not loaded yet, it will trigger sections load when departments finish
            // No need to load sections here, it will happen in loadDepartments callback
          }
        },
        error: (err) => {
          // Handle error fetching interview details
          console.error('Failed to fetch interview details', err);
          this.interviewDetailsLoading = false;
        }
      });
    } else {
      // If no applicationId, just set loading to false
      console.warn('No application ID found. Cannot fetch interview details.');
      this.interviewDetailsLoading = false;
    }
  }

  private loadDepartments(): void {
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

        // Set department value immediately if we have an expected value
        if (this.expectedInterviewValues.department && this.departments.length > 0) {
          this.department = this.expectedInterviewValues.department;
          // Trigger sections loading if department was set
          if (this.overlayTitle === 'Reschedule Interview') {
            this.loadSectionsForDepartment(this.expectedInterviewValues.department);
          }
        }
      },
      error: () => {
        this.departments = [];
        this.departmentsLoading = false;
      }
    });
  }

  private loadSectionsForDepartment(deptId: number): void {
    // Always load sections for reschedule interview, or if we have an expected section value
    if (!this.expectedInterviewValues.section && this.overlayTitle !== 'Reschedule Interview') {
      return;
    }

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

        // Set section immediately after sections are loaded
        if (this.expectedInterviewValues.section && this.sections.length > 0) {
          this.section = this.expectedInterviewValues.section;
          this.originalInterviewValues.section = this.expectedInterviewValues.section;

          // Load employees for this section if we have an expected interviewer
          if (this.expectedInterviewValues.interviewer) {
            this.loadEmployeesForSection(this.expectedInterviewValues.section);
          }
        }
      },
      error: () => {
        this.sections = [];
        this.sectionsLoading = false;
      }
    });
  }

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

        // Set interviewer immediately after employees are loaded
        if (this.expectedInterviewValues.interviewer && this.employees.length > 0) {
          this.interviewer = this.expectedInterviewValues.interviewer;
          this.originalInterviewValues.interviewer = this.expectedInterviewValues.interviewer;
        }
      },
      error: () => {
        this.employees = [];
        this.employeesLoading = false;
      }
    });
  }

  onDepartmentChange(): void {
    // Clear section and employees when department changes
    this.section = null;
    this.sections = [];
    this.interviewer = null;
    this.employees = [];

    if (!this.department) {
      return;
    }

    this.sectionsLoading = true;
    this.departmentsService.showDepartment(this.department).subscribe({
      next: (res) => {
        const deptInfo = res?.data?.object_info ?? res?.object_info ?? {};
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

  onSectionChange(): void {
    // Clear interviewer when section changes
    this.interviewer = null;
    this.employees = [];

    if (!this.section) {
      return;
    }

    this.employeesLoading = true;
    this.employeeService.getEmployees(1, 10000, '', { section: this.section }).subscribe({
      next: (res) => {
        const items = res?.data?.list_items ?? [];
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

  private loadBranches(): void {
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

        // Set location value immediately if we have an expected value
        if (this.expectedInterviewValues.location && this.branches.length > 0) {
          this.location = this.expectedInterviewValues.location;
        }
      },
      error: () => {
        this.branches = [];
        this.branchesLoading = false;
      }
    });
  }

  submitInterview(): void {
    // Reset validation errors
    this.validationErrors = {};

    // Validate required fields
    let hasErrors = false;

    if (!this.applicationId) {
      return;
    }

    // Check if reschedule and no changes were made
    if (this.overlayTitle === 'Reschedule Interview') {
      const hasChanges = this.hasInterviewFormChanges();
      if (!hasChanges) {
        this.validationErrors.noChanges = 'You need to update the interview details';
        return;
      }
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

    // Check if it's a reschedule (overlay title is "Reschedule Interview")
    if (this.overlayTitle === 'Reschedule Interview' && this.interviewId) {
      // Use PUT endpoint with interview ID
      this.svc.rescheduleInterview(this.interviewId, payload).subscribe({
        next: () => {
          this.submitting = false;
          this.closeAllOverlays();
          this.resetInterviewForm();
          this.applicationRefreshed.emit();
        },
        error: () => {
          this.submitting = false;
        }
      });
    } else {
      // Use POST endpoint to create new interview
      this.svc.createInterview(this.applicationId!, payload).subscribe({
        next: () => {
          this.submitting = false;
          this.closeAllOverlays();
          this.resetInterviewForm();
          this.applicationRefreshed.emit();
        },
        error: () => {
          this.submitting = false;
        }
      });
    }
  }

  private hasInterviewFormChanges(): boolean {
    const original = this.originalInterviewValues;

    // Compare all fields
    if ((this.interviewTitle || '') !== (original.title || '')) {
      return true;
    }

    if (this.interviewer !== original.interviewer) {
      return true;
    }

    if (this.department !== original.department) {
      return true;
    }

    if (this.section !== original.section) {
      return true;
    }

    if ((this.date || '') !== (original.date || '')) {
      return true;
    }

    if ((this.time_from || '') !== (original.time_from || '')) {
      return true;
    }

    if ((this.time_to || '') !== (original.time_to || '')) {
      return true;
    }

    if (this.interview_type !== original.interview_type) {
      return true;
    }

    if (this.location !== original.location) {
      return true;
    }

    return false;
  }

  clearValidationError(field: keyof typeof this.validationErrors): void {
    if (this.validationErrors[field]) {
      delete this.validationErrors[field];
    }
  }

  onInterviewFormChange(): void {
    // Clear no changes error when user modifies any field
    if (this.validationErrors.noChanges) {
      delete this.validationErrors.noChanges;
    }
  }

  onInterviewTypeChange(): void {
    // Clear location when switching to online
    if (this.interview_type === 2) {
      this.location = null;
      this.clearValidationError('location');
    }
  }

  private resetInterviewForm(): void {
    this.interviewTitle = '';
    this.interviewer = null;
    this.department = null;
    this.section = null;
    this.date = '';
    this.time_from = '';
    this.time_to = '';
    this.interview_type = 1;
    this.location = null;
    this.employees = [];
    this.sections = [];
    this.validationErrors = {};
    this.interviewDetailsLoading = false;
    this.originalInterviewValues = {};
    this.expectedInterviewValues = {};
  }

  submitJobOffer(): void {
    // Reset validation errors
    this.jobOfferValidationErrors = {};

    // Validate required fields
    let hasErrors = false;

    if (!this.applicationId) {
      return;
    }

    // Check if editing and no changes were made
    if (this.overlayTitle === 'Update Job Offer') {
      const hasChanges = this.checkJobOfferFormChanges();
      if (!hasChanges) {
        this.jobOfferValidationErrors.noChanges = 'You need to update the job offer details';
        return;
      }
    }

    if (this.offerSalary == null || this.offerSalary <= 0) {
      this.jobOfferValidationErrors.salary = 'Please enter a valid salary';
      hasErrors = true;
    }

    if (!this.offerJoinDate || !this.offerJoinDate.trim()) {
      this.jobOfferValidationErrors.joinDate = 'Please select a join date';
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    this.submitting = true;

    // Check if we're editing or creating
    if (this.overlayTitle === 'Update Job Offer') {
      // Update existing job offer
      this.svc.updateJobOffer(this.applicationId, this.offerSalary!, this.offerJoinDate, this.offerDetails || '').subscribe({
        next: () => {
          this.submitting = false;
          this.closeAllOverlays();
          this.resetJobOfferForm();
          this.applicationRefreshed.emit();
        },
        error: () => {
          this.submitting = false;
        }
      });
    } else {
      // Create new job offer with full payload
      const payload: any = {
        application_id: this.applicationId,
        join_date: this.offerJoinDate,
        salary: this.offerSalary,
        offer_details: this.offerDetails || '',
      };
      if (this.withEndDate && this.contractEndDate) {
        payload.end_contract = this.contractEndDate;
      }
      if (this.noticePeriod) {
        payload.notice_period = this.noticePeriod;
      }
      this.svc.sendJobOfferFull(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.closeAllOverlays();
          this.resetJobOfferForm();
          this.applicationRefreshed.emit();
        },
        error: () => {
          this.submitting = false;
        }
      });
    }
  }

  onJobOfferFormChange(): void {
    // Clear no changes error when user modifies any field
    if (this.jobOfferValidationErrors.noChanges) {
      delete this.jobOfferValidationErrors.noChanges;
    }
  }

  get hasJobOfferFormChanges(): boolean {
    if (this.overlayTitle !== 'Update Job Offer') {
      // For create mode, allow submission if form is valid
      return true;
    }
    return this.checkJobOfferFormChanges();
  }

  private checkJobOfferFormChanges(): boolean {
    const original = this.originalJobOfferValues;

    // Compare all fields
    if (this.offerSalary !== original.salary) {
      return true;
    }

    if ((this.offerJoinDate || '') !== (original.join_date || '')) {
      return true;
    }

    if ((this.offerDetails || '') !== (original.offer_details || '')) {
      return true;
    }

    return false;
  }

  clearJobOfferValidationError(field: keyof typeof this.jobOfferValidationErrors): void {
    if (this.jobOfferValidationErrors[field]) {
      delete this.jobOfferValidationErrors[field];
    }
  }

  private resetJobOfferForm(): void {
    this.offerSalary = null;
    this.offerJoinDate = '';
    this.offerDetails = '';
    this.jobOfferValidationErrors = {};
    this.isEditingJobOffer = false;
    this.jobOfferDetailsLoading = false;
    this.originalJobOfferValues = {};
  }

  acceptJobOffer(): void {
    if (!this.applicationId) {
      return;
    }

    this.submitting = true;
    // Update application status to 5 (as specified by user)
    this.svc.updateApplicationStatus(this.applicationId, 5).subscribe({
      next: () => {
        this.submitting = false;
        this.applicationRefreshed.emit();
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  openEditJobOfferOverlay(): void {
    if (!this.applicationId && !this.jobOfferId) {
      return;
    }

    // Set editing mode
    this.isEditingJobOffer = true;

    // Open overlay immediately with "Update Job Offer" title
    this.openOverlay('Update Job Offer', 'job');

    // Set loading state
    this.jobOfferDetailsLoading = true;

    // Fetch job offer details and pre-fill the form
    const jobOfferIdToUse = this.jobOfferId || this.applicationId;
    if (!jobOfferIdToUse) {
      this.jobOfferDetailsLoading = false;
      return;
    }
    this.svc.getJobOffer(jobOfferIdToUse).subscribe({
      next: (res) => {
        const jobOffer = res?.data?.object_info ?? res?.object_info ?? res;
        // Pre-fill form fields
        this.offerSalary = jobOffer.salary ?? null;
        this.offerJoinDate = jobOffer.join_date ? jobOffer.join_date.substring(0, 10) : '';
        this.offerDetails = jobOffer.offer_details || '';

        // Store original values for change tracking
        this.originalJobOfferValues = {
          salary: this.offerSalary,
          join_date: this.offerJoinDate,
          offer_details: this.offerDetails
        };

        // Mark as loaded
        this.jobOfferDetailsLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch job offer details', err);
        // Mark as loaded even if fetch fails
        this.jobOfferDetailsLoading = false;
      }
    });
  }

  openJobOfferOverlay(): void {
    // Reset form and set to create mode
    this.resetJobOfferForm();
    this.openOverlay('Job Offer', 'job');
  }

}
