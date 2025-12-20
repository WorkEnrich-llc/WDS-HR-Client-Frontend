import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { JobCreationDataService } from '../../../../core/services/recruitment/job-openings/job-creation-data.service';
import { MainInfoComponent } from './main-info/main-info.component';
import { RequiredDetailsComponent } from './required-details/required-details.component';
import { AttachmentsComponent } from './attachments/attachments.component';

@Component({
  selector: 'app-create-jop-open',
  imports: [
    PageHeaderComponent,
    CommonModule,
    PopupComponent,
    MainInfoComponent,
    RequiredDetailsComponent,
    AttachmentsComponent
  ],
  providers: [DatePipe],
  templateUrl: './create-jop-open.component.html',
  styleUrl: './create-jop-open.component.css'
})
export class CreateJopOpenComponent implements OnInit {
  private jobCreationDataService = inject(JobCreationDataService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  todayFormatted: string = '';
  errMsg: string = '';
  activeTab: 'main-information' | 'required-details' | 'attachments' = 'main-information';

  @ViewChild(MainInfoComponent) mainInfoComponent?: MainInfoComponent;
  @ViewChild(RequiredDetailsComponent) requiredDetailsComponent?: RequiredDetailsComponent;
  @ViewChild(AttachmentsComponent) attachmentsComponent?: AttachmentsComponent;

  constructor() {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }

  ngOnInit() {
    // Always start from main-information tab
    this.activeTab = 'main-information';
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

  get isCreating(): boolean {
    return this.attachmentsComponent?.isLoading || false;
  }

  onCreateOpportunityClick(): void {
    // Prevent action if already loading
    if (this.isCreating) {
      return;
    }

    // Validate current tab first
    if (!this.validateCurrentTab()) {
      // Validation failed, messages are already shown on current tab
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
        // All valid, trigger create
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
        // Valid, trigger create
        this.jobCreationDataService.triggerCreateUpdate();
      }, 0);
    } else if (this.activeTab === 'attachments') {
      // Already validated above, trigger create/update
      this.jobCreationDataService.triggerCreateUpdate();
    }
  }
}
