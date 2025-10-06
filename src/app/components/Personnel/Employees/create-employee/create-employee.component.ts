import { DatePipe } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateEmployeeRequest, CreateEmployeeResponse } from '../../../../core/interfaces/employee';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { PageHeaderComponent } from './../../../shared/page-header/page-header.component';
import { CreateEmployeeSharedService } from './services/create-employee-shared.service';
import { StepperNavigationComponent } from './stepper-navigation/stepper-navigation.component';
import { MainInformationStepComponent } from './main-information-step/main-information-step.component';
import { JobDetailsStepComponent } from './job-details-step/job-details-step.component';
import { ContractDetailsStepComponent } from './contract-details-step/contract-details-step.component';
import { AttendanceDetailsStepComponent } from './attendance-details-step/attendance-details-step.component';
import { InsuranceDetailsStepComponent } from './insurance-details/insurance-details-step.component';

@Component({
  standalone: true,
  selector: 'app-create-employee',
  imports: [
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
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.css'],
})

export class CreateEmployeeComponent implements OnInit {
  // Dependency Injection
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private toasterMessageService = inject(ToasterMessageService);
  private employeeService = inject(EmployeeService);
  public sharedService = inject(CreateEmployeeSharedService);

  // Component state as signals
  readonly todayFormatted = signal<string>('');

  constructor() {
    const today = new Date();
    this.todayFormatted.set(this.datePipe.transform(today, 'dd/MM/yyyy')!);
  }

  ngOnInit(): void {
    // Reset the form when component initializes
    this.sharedService.resetForm();
  }

  // Modal handlers
  openModal() {
    this.sharedService.isModalOpen.set(true);
  }

  closeModal() {
    this.sharedService.isModalOpen.set(false);
  }

  confirmAction() {
    this.sharedService.isModalOpen.set(false);
    this.router.navigate(['/employees/all-employees']);
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
    if (this.sharedService.employeeForm.valid) {
      this.sharedService.isLoading.set(true);
      this.sharedService.errMsg.set('');

      const formData = this.sharedService.employeeForm.value;

      // Transform form data to match the API contract
      const employeeData: CreateEmployeeRequest = {
        request_data: {
          main_information: {
            code: formData.main_information.code || '',
            name: formData.main_information.name,
            gender: parseInt(formData.main_information.gender, 10),
            mobile: {
              country_id: formData.main_information.mobile.country_id,
              number: parseInt(formData.main_information.mobile.number)
            },
            personal_email: formData.main_information.personal_email,
            marital_status: parseInt(formData.main_information.marital_status, 10),
            date_of_birth: formData.main_information.date_of_birth,
            address: formData.main_information.address
          },
          job_details: {
            years_of_experience: formData.job_details.years_of_experience ? parseFloat(formData.job_details.years_of_experience) : undefined,
            branch_id: parseInt(formData.job_details.branch_id, 10),
            department_id: parseInt(formData.job_details.department_id, 10),
            section_id: formData.job_details.section_id ? parseInt(formData.job_details.section_id, 10) : undefined,
            job_title_id: parseInt(formData.job_details.job_title_id, 10),
            // work_schedule_id now lives under attendance_details
            work_schedule_id: parseInt(formData.attendance_details.work_schedule_id, 10),
            activate_attendance_rules: !!formData.attendance_details.activate_attendance_rules
          },
          contract_details: {
            start_contract: formData.contract_details.start_contract,
            contract_type: formData.contract_details.contract_type,
            contract_end_date: formData.contract_details.contract_type === 1 ? formData.contract_details.contract_end_date : "",
            employment_type: parseInt(formData.attendance_details.employment_type, 10),
            work_mode: parseInt(formData.attendance_details.work_mode, 10),
            days_on_site: formData.attendance_details.days_on_site ? parseInt(formData.attendance_details.days_on_site, 10) : undefined,
            salary: parseFloat(formData.contract_details.salary),
            insurance_salary: formData.insurance_details.include_insurance_salary ? parseFloat(formData.insurance_details.insurance_salary) : undefined,
            gross_insurance: formData.insurance_details.include_gross_insurance_salary ? parseFloat(formData.insurance_details.gross_insurance_salary) : undefined,
            notice_period: formData.contract_details.notice_period ? parseInt(formData.contract_details.notice_period, 10) : 0
          }
        }
      };

      // Call the real employee service
      this.employeeService.createEmployee(employeeData).subscribe({
        next: (response: CreateEmployeeResponse) => {
          this.sharedService.isLoading.set(false);
          this.sharedService.errMsg.set('');
          this.toasterMessageService.sendMessage('Employee created successfully!');
          this.router.navigate(['/employees/all-employees']);
        },
        error: (error: any) => {
          this.sharedService.isLoading.set(false);
          this.sharedService.errMsg.set(error.message || 'An error occurred while creating the employee');
          this.toasterMessageService.sendMessage('Failed to create employee');
        }
      });
    } else {
      this.sharedService.employeeForm.markAllAsTouched();
      // Also mark nested form groups as touched
      this.sharedService.mobileGroup.markAllAsTouched();
      this.sharedService.errMsg.set('Please fill in all required fields');

      // Scroll to first invalid field
      const firstInvalidField = document.querySelector('.is-invalid');
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}
