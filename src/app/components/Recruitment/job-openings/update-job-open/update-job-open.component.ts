import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { JobOpeningsService } from '../../../../core/services/recruitment/job-openings/job-openings.service';
import { JobCreationDataService, JobCreationData } from '../../../../core/services/recruitment/job-openings/job-creation-data.service';
import { MainInfoComponent } from '../create-jop-open/main-info/main-info.component';
import { RequiredDetailsComponent } from '../create-jop-open/required-details/required-details.component';
import { AttachmentsComponent } from '../create-jop-open/attachments/attachments.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-update-job-open',
  imports: [
    PageHeaderComponent,
    PopupComponent,
    MainInfoComponent,
    RequiredDetailsComponent,
    AttachmentsComponent,
    NgClass
  ],
  templateUrl: './update-job-open.component.html',
  styleUrl: './update-job-open.component.css'
})
export class UpdateJobOpenComponent implements OnInit, OnDestroy {
  private jobOpeningsService = inject(JobOpeningsService);
  private jobCreationDataService = inject(JobCreationDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private datePipe = inject(DatePipe);

  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  activeTab: 'main-information' | 'required-details' | 'attachments' = 'main-information';
  jobId: number = 0;
  hasChanges: boolean = false;

  // Store initial form data for comparison
  private initialFormData: JobCreationData | null = null;
  private initialAttachments: { links: Array<{ value: string | null }>, documents: Array<{ value: string | null }> } | null = null;
  private dataSubscription?: Subscription;
  private changeCheckInterval?: any;

  @ViewChild(MainInfoComponent) mainInfoComponent?: MainInfoComponent;
  @ViewChild(RequiredDetailsComponent) requiredDetailsComponent?: RequiredDetailsComponent;
  @ViewChild(AttachmentsComponent) attachmentsComponent?: AttachmentsComponent;

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

    // Always start from main-information tab
    this.activeTab = 'main-information';

    // Subscribe to form data changes
    this.dataSubscription = this.jobCreationDataService.jobData$.subscribe(() => {
      this.checkForChanges();
    });

    // Periodically check for changes (especially for attachments component)
    this.changeCheckInterval = setInterval(() => {
      if (!this.isLoading) {
        this.checkForChanges();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.changeCheckInterval) {
      clearInterval(this.changeCheckInterval);
    }
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

          // Store initial form data after a short delay to ensure attachments component is initialized
          setTimeout(() => {
            this.storeInitialData();
          }, 500);
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

  storeInitialData(): void {
    // Store initial service data
    const currentData = this.jobCreationDataService.getCurrentData();
    this.initialFormData = JSON.parse(JSON.stringify(currentData));

    // Wait for attachments component to initialize and load data, then store initial attachments
    const checkAttachments = (attempts: number = 0) => {
      if (this.attachmentsComponent && this.attachmentsComponent.links && this.attachmentsComponent.links.length > 0) {
        this.initialAttachments = {
          links: JSON.parse(JSON.stringify(this.attachmentsComponent.links)),
          documents: JSON.parse(JSON.stringify(this.attachmentsComponent.Documents))
        };
        this.hasChanges = false;
      } else if (attempts < 10) {
        // Retry up to 10 times (5 seconds total)
        setTimeout(() => checkAttachments(attempts + 1), 500);
      } else {
        // If attachments component doesn't exist or has no data, initialize with empty
        this.initialAttachments = {
          links: [],
          documents: []
        };
        this.hasChanges = false;
      }
    };

    setTimeout(() => checkAttachments(), 500);
  }

  checkForChanges(): void {
    if (!this.initialFormData) {
      this.hasChanges = false;
      return;
    }

    // Compare service data
    const currentData = this.jobCreationDataService.getCurrentData();
    const serviceDataChanged = !this.deepEqual(currentData, this.initialFormData);

    // Compare attachments if component exists and initial attachments are stored
    let attachmentsChanged = false;
    if (this.attachmentsComponent && this.initialAttachments) {
      try {
        const currentLinks = JSON.stringify(this.attachmentsComponent.links || []);
        const currentDocuments = JSON.stringify(this.attachmentsComponent.Documents || []);
        const initialLinks = JSON.stringify(this.initialAttachments.links || []);
        const initialDocuments = JSON.stringify(this.initialAttachments.documents || []);

        attachmentsChanged = currentLinks !== initialLinks || currentDocuments !== initialDocuments;
      } catch (error) {
        // If comparison fails, assume no change
        attachmentsChanged = false;
      }
    }

    this.hasChanges = serviceDataChanged || attachmentsChanged;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  }

  isActive(path: string): boolean {
    return this.activeTab === path;
  }

  isCompleted(path: string): boolean {
    const order: ('main-information' | 'required-details' | 'attachments')[] = ['main-information', 'required-details', 'attachments'];
    return order.indexOf(this.activeTab) > order.indexOf(path as any);
  }

  getStepIconType(path: string): 'active' | 'completed' | 'upcoming' {
    if (this.isActive(path)) return 'active';
    if (this.isCompleted(path)) return 'completed';
    return 'upcoming';
  }

  setActiveTab(tab: 'main-information' | 'required-details' | 'attachments'): void {
    this.activeTab = tab;
    // Check for changes after tab change (attachments component might be initialized)
    setTimeout(() => {
      this.checkForChanges();
    }, 100);
  }

  get isUpdating(): boolean {
    return this.attachmentsComponent?.isLoading || false;
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

  // update confirmation popup
  isUpdateConfirmModalOpen = false;

  openUpdateConfirmModal() {
    this.isUpdateConfirmModalOpen = true;
  }

  closeUpdateConfirmModal() {
    this.isUpdateConfirmModalOpen = false;
  }

  validateCurrentTab(): boolean {
    if (this.activeTab === 'main-information') {
      if (this.mainInfoComponent) {
        return this.mainInfoComponent.validateForm();
      }
      return false;
    } else if (this.activeTab === 'attachments') {
      if (this.attachmentsComponent) {
        return this.attachmentsComponent.validateForm();
      }
      return false;
    }
    // Required details has no validation needed
    return true;
  }

  onUpdateOpportunityClick(): void {
    // Prevent action if already loading
    if (this.isUpdating) {
      return;
    }

    // Validate current tab first
    if (!this.validateCurrentTab()) {
      // Validation failed, messages are already shown on current tab
      return;
    }

    // Current tab is valid, show confirmation popup
    this.openUpdateConfirmModal();
  }

  confirmUpdate(): void {
    // Close the confirmation popup
    this.closeUpdateConfirmModal();

    // Prevent action if already loading
    if (this.isUpdating) {
      return;
    }

    // Current tab is valid, navigate through remaining tabs
    if (this.activeTab === 'main-information') {
      // Move to required-details (no validation)
      this.setActiveTab('required-details');
      // Then move to attachments
      this.setActiveTab('attachments');
      // Wait for view to update, then validate attachments
      setTimeout(() => {
        if (this.attachmentsComponent && !this.attachmentsComponent.validateForm()) {
          // Validation failed, stay on attachments tab with errors shown
          return;
        }
        // All valid, trigger update
        this.jobCreationDataService.triggerCreateUpdate();
      }, 0);
    } else if (this.activeTab === 'required-details') {
      // Move to attachments
      this.setActiveTab('attachments');
      // Wait for view to update, then validate
      setTimeout(() => {
        if (this.attachmentsComponent && !this.attachmentsComponent.validateForm()) {
          // Validation failed, stay on attachments tab with errors shown
          return;
        }
        // Valid, trigger update
        this.jobCreationDataService.triggerCreateUpdate();
      }, 0);
    } else if (this.activeTab === 'attachments') {
      // Already validated above, trigger create/update
      this.jobCreationDataService.triggerCreateUpdate();
    }
  }
}
