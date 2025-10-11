import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateEmployeeRequest, CreateEmployeeResponse } from '../../../../core/interfaces/employee';
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
    InsuranceDetailsStepComponent
  ],
  providers: [DatePipe],
  templateUrl: './manage-employee.component.html',
  styleUrls: ['./manage-employee.component.css'],
})

export class ManageEmployeeComponent implements OnInit {
  // Dependency Injection
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private toasterMessageService = inject(ToasterMessageService);
  private employeeService = inject(EmployeeService);
  public sharedService = inject(ManageEmployeeSharedService);
  private paginationState = inject(PaginationStateService);

  private route = inject(ActivatedRoute);
  public isEditMode = false;
  isModalOpen = false;
  public employeeId!: number;


  // Component state as signals
  readonly todayFormatted = signal<string>('');

  constructor() {
    const today = new Date();
    this.todayFormatted.set(this.datePipe.transform(today, 'dd/MM/yyyy')!);
  }

  ngOnInit(): void {
    // Reset the form when component initializes
    this.sharedService.resetForm();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.employeeId = +id;
        this.sharedService.loadEmployeeData(+id);
      } else {
        this.isEditMode = false;
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
    if (!employeeData) {
      this.toasterMessageService.showError('Invalid form data');
      return;
    }

    if (this.isEditMode) {
      this.employeeService.updateEmployee(employeeData).subscribe({
        next: () => {
          this.sharedService.isLoading.set(false);
          this.toasterMessageService.showSuccess('Employee updated successfully!');
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
          this.toasterMessageService.showSuccess('Employee created successfully!');
          this.router.navigate(['/employees/all-employees']);
        },
        error: (error) => {
          this.sharedService.isLoading.set(false);
          this.sharedService.errMsg.set(error.message || 'Failed to create employee');
          this.toasterMessageService.showError('Failed to create employee');
        }
      });
    }
  }


}
