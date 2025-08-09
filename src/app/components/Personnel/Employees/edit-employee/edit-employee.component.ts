import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';

@Component({
  standalone: true,
  selector: 'app-edit-employee',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './edit-employee.component.html',
  styleUrls: ['./edit-employee.component.css']
})
export class EditEmployeeComponent implements OnInit {
  employeeForm!: FormGroup;
  employeeId!: number;
  errMsg = '';
  isLoading = false;
  employeeData: any = null; // Store the complete employee data
  fieldErrors: { [key: string]: string } = {}; // Store field-specific errors

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService
  ) {
    // initialize form
    this.employeeForm = this.fb.group({
      empId: [''],
      fullName: ['', Validators.required],
      gender: [null, Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }


  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.employeeId = +params['id'];
      if (this.employeeId) {
        this.loadEmployee();
      }
    });

    // Clear field errors when user starts typing
    this.employeeForm.valueChanges.subscribe(() => {
      if (Object.keys(this.fieldErrors).length > 0) {
        this.fieldErrors = {};
      }
    });
  }

  private loadEmployee(): void {
    this.isLoading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: res => {
        this.employeeData = res.data.object_info; // Store the complete employee data
        const info = res.data.object_info.contact_info;
        this.employeeForm.patchValue({
          empId: res.data.object_info.id,
          fullName: info.name,
          // set gender if available (backend may include gender in contact_info)
          gender: (info as any).gender ?? null,
          phone: info.mobile.number,
          email: info.email
        });
        this.isLoading = false;
      },
      error: err => {
        this.errMsg = 'Failed to load employee data.';
        this.isLoading = false;
      }
    });
  }
  isModalOpen = false;
  isSuccessModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/employees/all-employees']);
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.errMsg = 'Please correct errors in the form.';
      return;
    }
    this.errMsg = '';
    this.fieldErrors = {}; // Clear previous field errors
    this.isLoading = true;
    const form = this.employeeForm.value;


    const payload = {
      request_data: {
        id: this.employeeId,
        main_information: {
          code: String(form.empId || this.employeeData?.id),
          name: form.fullName,
          gender: form.gender?.id || this.employeeData?.contact_info?.gender?.id,
          mobile: {
            country_id: this.employeeData?.contact_info?.mobile?.country?.id || 1,
            number: +form.phone
          },
          personal_email: form.email,
          marital_status: this.employeeData?.contact_info?.marital_status?.id,
          date_of_birth: this.formatDate(this.employeeData?.contact_info?.date_of_birth), // Convert to YYYY-M-D format
          address: this.employeeData?.contact_info?.address
        },
        job_details: {
          branch_id: this.employeeData?.job_info?.branch?.id,
          department_id: this.employeeData?.job_info?.department?.id,
          section_id: this.employeeData?.job_info?.section?.id,
          job_title_id: this.employeeData?.job_info?.job_title?.id,
          work_schedule_id: this.employeeData?.job_info?.work_schedule?.id
        },
        contract_details: {
          start_contract: this.formatDate(this.employeeData?.job_info?.start_contract), // Convert to YYYY-M-D format
          contract_type: this.employeeData?.job_info?.contract_type?.id,
          contract_end_date: this.employeeData?.job_info?.end_contract,
          employment_type: this.employeeData?.job_info?.employment_type?.id,
          work_mode: this.employeeData?.job_info?.work_mode?.id,
          days_on_site: this.employeeData?.job_info?.days_on_site,
          salary: this.employeeData?.job_info?.salary
        }
      }
    };

    this.employeeService.updateEmployee(payload).subscribe({
      next: () => {
        this.toasterMessageService.showSuccess('Employee updated successfully');
        this.router.navigate(['/employees/all-employees']);
      },
      error: (err: any) => {
        this.isLoading = false;
        
        // Handle API error response with error_handling array
        if (err?.error?.data?.error_handling && Array.isArray(err.error.data.error_handling)) {
          this.handleFieldErrors(err.error.data.error_handling);
        } else {
          this.errMsg = 'Update failed.';
        }
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private handleFieldErrors(errorHandling: any[]): void {
    this.fieldErrors = {}; // Clear previous errors
    
    errorHandling.forEach(error => {
      const fieldName = error.field;
      const errorMessage = error.error;
      
      // Map API field names to form control names
      const fieldMapping: { [key: string]: string } = {
        'name': 'fullName',
        'number': 'phone',
        'personal_email': 'email',
        'code': 'empId'
      };
      
      const formFieldName = fieldMapping[fieldName] || fieldName;
      this.fieldErrors[formFieldName] = errorMessage;
    });
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName] || '';
  }
}
