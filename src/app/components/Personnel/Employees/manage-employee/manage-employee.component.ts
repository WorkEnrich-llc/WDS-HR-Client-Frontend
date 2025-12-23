import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
// import { CreateEmployeeRequest, CreateEmployeeResponse } from '../../../../core/interfaces/employee';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { PageHeaderComponent } from './../../../shared/page-header/page-header.component';
import { StepperNavigationComponent } from './stepper-navigation/stepper-navigation.component';
import { MainInformationStepComponent } from './main-information-step/main-information-step.component';
import { JobDetailsStepComponent } from './job-details-step/job-details-step.component';
import { ContractDetailsStepComponent } from './contract-details-step/contract-details-step.component';
import { AttendanceDetailsStepComponent } from './attendance-details-step/attendance-details-step.component';
import { InsuranceDetailsStepComponent } from './insurance-details/insurance-details-step.component';
import { ManageEmployeeSharedService } from './services/manage-shared.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';
import { OnboardingChecklistComponent, OnboardingListItem } from 'app/components/shared/onboarding-checklist/onboarding-checklist.component';
import { SystemSetupTourComponent } from 'app/components/shared/system-setup-tour/system-setup-tour.component';

import { EmployeeSkeletonLoaderComponent } from './employee-skeleton-loader.component';
import { SystemSetupService } from 'app/core/services/main/system-setup.service';


@Component({
  standalone: true,
  selector: 'app-manage-employee',
  imports: [
    CommonModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    PopupComponent,
    StepperNavigationComponent,
    MainInformationStepComponent,
    JobDetailsStepComponent,
    ContractDetailsStepComponent,
    AttendanceDetailsStepComponent,
    InsuranceDetailsStepComponent,
    OnboardingChecklistComponent,
    SystemSetupTourComponent,
    EmployeeSkeletonLoaderComponent
  ],
  providers: [DatePipe],
  templateUrl: './manage-employee.component.html',
  styleUrls: ['./manage-employee.component.css'],
})

export class ManageEmployeeComponent implements OnInit {
  @ViewChild(SystemSetupTourComponent) systemSetupTour!: SystemSetupTourComponent;
  // Dependency Injection
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private toasterMessageService = inject(ToasterMessageService);
  private employeeService = inject(EmployeeService);
  public sharedService = inject(ManageEmployeeSharedService);
  private paginationState = inject(PaginationStateService);
  private systemSetupService = inject(SystemSetupService);

  private route = inject(ActivatedRoute);
  // public isEditMode = false;
  isModalOpen = false;
  public employeeId!: number;

  // Onboarding checklist state
  isOnboardingModalOpen = false;
  loadingChecklistItemTitle: string | null = null;



  // Component state as signals
  readonly todayFormatted = signal<string>('');

  constructor() {
    const today = new Date();
    this.todayFormatted.set(this.datePipe.transform(today, 'dd/MM/yyyy')!);
  }

  ngOnInit(): void {
    // Reset the form when component initializes
    // this.sharedService.loadInitialData();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.sharedService.resetForm();
      if (id) {
        this.sharedService.isEditMode.set(true);
        this.employeeId = +id;
        this.sharedService.loadEmployeeData(+id);
      } else {
        this.sharedService.isEditMode.set(false);
        this.sharedService.resetForm();
      }
    });

  }



  // Modal handlers
  openModal() {
    this.isModalOpen = true;
    // this.sharedService.isModalOpen.set(true);
  }




  closeModal() {
    this.isModalOpen = false
    // this.sharedService.isModalOpen.set(false);
  }



  confirmAction() {
    // this.isModalOpen = false;
    this.sharedService.isEditMode();
    this.sharedService.isModalOpen.set(false);
    const currentPage = this.paginationState.getPage('employees/all-employees');
    this.router.navigate(['/employees'], { queryParams: { page: currentPage } });
  }

  openSuccessModal() {
    this.sharedService.isSuccessModalOpen.set(true);
  }

  closeSuccessModal() {
    this.sharedService.isSuccessModalOpen.set(false);
  }

  viewEmployees() {
    this.closeSuccessModal();
    this.router.navigate(['/employees/all-employees']);
  }

  createAnother() {
    this.closeSuccessModal();
    this.sharedService.resetForm();
  }

  // Onboarding checklist methods
  get onboardingCompleted(): number {
    const list = this.sharedService.onboardingList();
    if (!list || list.length === 0) return 0;
    return list.filter(item => item.status === true).length;
  }

  get onboardingTotal(): number {
    const list = this.sharedService.onboardingList();
    if (!list || list.length === 0) return 0;
    return list.length;
  }

  openOnboardingModal(): void {
    this.isOnboardingModalOpen = true;
  }

  closeOnboardingModal(): void {
    this.isOnboardingModalOpen = false;
  }

  onChecklistItemClick(item: OnboardingListItem): void {
    this.updateChecklistItem(item);
  }

  updateChecklistItem(item: { title: string; status: boolean }): void {
    if (!this.sharedService.isEditMode() || !this.sharedService.employeeData() || this.loadingChecklistItemTitle) {
      return; // Only allow updates in edit mode when employee data is loaded
    }

    // Set loading state for the clicked item
    this.loadingChecklistItemTitle = item.title;

    // Toggle the clicked item status, keep all others as they were
    const newStatus = !item.status;
    const currentList = this.sharedService.onboardingList();
    const updatedOnboardingList = currentList.map(listItem => {
      if (listItem.title === item.title) {
        return { ...listItem, status: newStatus };
      }
      return listItem; // Keep all other items as they were (true or false)
    });

    // Update the shared service's onboarding list
    this.sharedService.onboardingList.set(updatedOnboardingList);

    // Build the complete employee update payload
    const employeeData = this.sharedService.getFormData();
    if (!employeeData) {
      // Revert the change if form data is invalid
      this.sharedService.onboardingList.set(currentList);
      this.loadingChecklistItemTitle = null;
      return;
    }

    // Update the payload with the new onboarding list
    employeeData.request_data.onboarding_list = updatedOnboardingList;

    this.employeeService.updateEmployee(employeeData).subscribe({
      next: (response: any) => {
        this.toasterMessageService.showSuccess('Checklist item updated successfully');
        // Clear loading state
        this.loadingChecklistItemTitle = null;
      },
      error: (error: any) => {
        console.error('Error updating checklist item:', error);
        this.toasterMessageService.showError('Failed to update checklist item');
        // Revert the local change on error
        this.sharedService.onboardingList.set(currentList);
        // Clear loading state on error
        this.loadingChecklistItemTitle = null;
      }
    });
  }



  // Form submission
  onSubmit() {
    if (this.sharedService.employeeForm.invalid) {
      this.sharedService.employeeForm.markAllAsTouched();
      this.sharedService.mobileGroup.markAllAsTouched();
      this.sharedService.errMsg.set('Please fill in all required fields');
      return;
    }
    this.sharedService.isLoading.set(true);
    this.sharedService.errMsg.set('');
    const employeeData = this.sharedService.getFormData();

    if (this.sharedService.isEditMode() && !this.sharedService.employeeData()) {
      this.toasterMessageService.showError('Employee data not loaded yet.');
      this.sharedService.isLoading.set(false);
      return;
    }

    if (!employeeData) {
      this.toasterMessageService.showError('Invalid form data');
      this.sharedService.isLoading.set(false);
      return;
    }

    if (this.sharedService.isEditMode()) {
      this.employeeService.updateEmployee(employeeData).subscribe({
        next: () => {
          this.sharedService.isLoading.set(false);
          this.toasterMessageService.showSuccess('Employee updated successfully', 'Update Successfully');
          this.router.navigate(['/employees/all-employees']);
        },
        error: (error) => {
          this.sharedService.isLoading.set(false);
          this.sharedService.errMsg.set(error.message || 'Failed to update employee');
          this.toasterMessageService.showError('Failed to update employee');
        }
      });
    } else {
      this.employeeService.createEmployee(employeeData).subscribe({
        next: () => {
          this.sharedService.isLoading.set(false);
          this.toasterMessageService.showSuccess('Employee created successfully', "Created Successfully");
          this.router.navigate(['/employees/all-employees']);

          // After successful employee creation:
          this.systemSetupService.notifyModuleItemCreated('employees');
          if (this.systemSetupTour) {
            setTimeout(() => {
              this.systemSetupTour.showCelebration('employees');
            }, 500);
          }
        },
        error: (error) => {
          this.sharedService.isLoading.set(false);
          this.sharedService.errMsg.set(error.message || 'Failed to create employee');
          this.toasterMessageService.showError('Failed to create employee');
        }
      });
    }
  }

  get isSaveDisabled(): boolean {
    const isLoading = this.sharedService.isLoading();
    const isEditMode = this.sharedService.isEditMode();
    const employeeDataLoaded = !!this.sharedService.employeeData();

    // In edit mode, don't validate until data is loaded
    if (isEditMode && !employeeDataLoaded) {
      return true; // Disable until data is loaded
    }

    const isInvalid = this.sharedService.employeeForm.invalid;

    // In edit mode, check for changes. In create mode, check if form is pristine
    const isUnchanged = isEditMode
      ? !this.sharedService.hasChanges()
      : this.sharedService.employeeForm.pristine;

    const isDisabled = isInvalid || isUnchanged || isLoading;

    return isDisabled;
  }

  // onSubmit() {
  //   if (this.sharedService.employeeForm.invalid) {
  //     this.sharedService.employeeForm.markAllAsTouched();
  //     this.sharedService.mobileGroup.markAllAsTouched();
  //     this.sharedService.errMsg.set('Please fill in all required fields');
  //     return;
  //   }
  //   this.sharedService.isLoading.set(true);
  //   this.sharedService.errMsg.set('');



  //   if (this.sharedService.isEditMode()) {
  //     if (!this.sharedService.employeeData()) {
  //       this.toasterMessageService.showError('Employee data not loaded yet.');
  //       this.sharedService.isLoading.set(false);
  //       return;
  //     }

  //     const employeeData = this.sharedService.getFormData();

  //     if (!employeeData) {
  //       this.toasterMessageService.showError('Invalid form data');
  //       this.sharedService.isLoading.set(false);
  //       return;
  //     }

  //     this.employeeService.updateEmployee(employeeData).subscribe({
  //       next: () => {
  //         this.sharedService.isLoading.set(false);
  //         this.toasterMessageService.showSuccess('Employee updated successfully!');
  //         this.router.navigate(['/employees/all-employees']);
  //       },
  //       error: (error) => {
  //         this.sharedService.isLoading.set(false);
  //         this.sharedService.errMsg.set(error.message || 'Failed to update employee');
  //         this.toasterMessageService.showError('Failed to update employee');
  //       }
  //     });

  //   } else {
  //     const employeeData = this.sharedService.getFormData();

  //     if (!employeeData) {
  //       this.toasterMessageService.showError('Invalid form data');
  //       this.sharedService.isLoading.set(false);
  //       return;
  //     }

  //     this.employeeService.createEmployee(employeeData).subscribe({
  //       next: () => {
  //         this.sharedService.isLoading.set(false);
  //         this.toasterMessageService.showSuccess('Employee created successfully!');
  //         this.router.navigate(['/employees/all-employees']);
  //       },
  //       error: (error) => {
  //         this.sharedService.isLoading.set(false);
  //         this.sharedService.errMsg.set(error.message || 'Failed to create employee');
  //         this.toasterMessageService.showError('Failed to create employee');
  //       }
  //     });
  //   }
  // }

}
