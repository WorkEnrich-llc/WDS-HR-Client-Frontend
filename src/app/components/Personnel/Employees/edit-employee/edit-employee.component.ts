import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { EditEmployeeSharedService } from './services/edit-employee-shared.service';
import { EditStepperNavigationComponent } from './edit-stepper-navigation/edit-stepper-navigation.component';
import { EditMainInformationStepComponent } from './edit-main-information-step/edit-main-information-step.component';
import { EditJobDetailsStepComponent } from './edit-job-details-step/edit-job-details-step.component';
import { EditAttendanceDetailsStepComponent } from './edit-attendance-details-step/edit-attendance-details-step.component';
import { EditContractDetailsStepComponent } from './edit-contract-details-step/edit-contract-details-step.component';
import { EditInsuranceDetailsStepComponent } from './edit-insurance-details-step/edit-insurance-details-step.component';

@Component({
  standalone: true,
  selector: 'app-edit-employee',
  imports: [
    PageHeaderComponent, 
    PopupComponent, 
    ReactiveFormsModule,
    EditStepperNavigationComponent,
    EditMainInformationStepComponent,
    EditJobDetailsStepComponent,
    EditAttendanceDetailsStepComponent,
    EditContractDetailsStepComponent
    ,EditInsuranceDetailsStepComponent
  ],
  providers: [DatePipe],
  templateUrl: './edit-employee.component.html',
  styleUrls: ['./edit-employee.component.css']
})
export class EditEmployeeComponent implements OnInit {
  // Dependency Injection
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private datePipe = inject(DatePipe);
  private employeeService = inject(EmployeeService);
  private toasterMessageService = inject(ToasterMessageService);
  public sharedService = inject(EditEmployeeSharedService);

  employeeId!: number;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.employeeId = +params['id'];
      if (this.employeeId) {
        this.loadEmployee();
      }
    });
  }

  private loadEmployee(): void {
    this.sharedService.isLoading.set(true);
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: res => {
        const employeeData = res.data.object_info;
        this.sharedService.loadEmployeeData(employeeData);
        this.sharedService.isLoading.set(false);
      },
      error: err => {
        this.sharedService.errMsg.set('Failed to load employee data.');
        this.sharedService.isLoading.set(false);
      }
    });
  }

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

  onSubmit(): void {
    if (this.sharedService.employeeForm.invalid) {
      this.sharedService.errMsg.set('Please correct errors in the form.');
      return;
    }
    
    this.sharedService.errMsg.set('');
    this.sharedService.isLoading.set(true);

    const payload = this.sharedService.getFormData();
    
    if (!payload) {
      this.sharedService.errMsg.set('Employee data not loaded.');
      this.sharedService.isLoading.set(false);
      return;
    }

    this.employeeService.updateEmployee(payload).subscribe({
      next: () => {
        this.toasterMessageService.showSuccess('Employee updated successfully');
        this.router.navigate(['/employees/all-employees']);
      },
      error: (err: any) => {
        this.sharedService.isLoading.set(false);
        
        // Handle API error response with error_handling array
        if (err?.error?.data?.error_handling && Array.isArray(err.error.data.error_handling)) {
          this.sharedService.errMsg.set('Please check the form for errors.');
        } else {
          this.sharedService.errMsg.set(err?.error?.message || 'An error occurred while updating the employee.');
        }
      }
    });
  }
}
