import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';

@Component({
  standalone: true,
  selector: 'app-edit-employee',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './edit-employee.component.html',
  styleUrls: ['./edit-employee.component.css']
})
export class EditEmployeeComponent implements OnInit {
  employeeForm!: FormGroup;
  employeeId!: number;
  errMsg = '';
  isLoading = false;

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
  }

  private loadEmployee(): void {
    this.isLoading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: res => {
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
    this.isLoading = true;
    const form = this.employeeForm.value;
    const payload = {
      request_data: {
        id: this.employeeId,
        main_information: {
          code: form.empId,
          name: form.fullName,
          gender: form.gender.id,
          // mobile expects object, using number only
          mobile: { country_id: 1, number: +form.phone },
          personal_email: form.email
        }
      }
    };
    this.employeeService.updateEmployee(payload).subscribe({
      next: () => {
        this.toasterMessageService.sendMessage('Employee updated successfully');
        this.router.navigate(['/employees/all-employees']);
      },
      error: (err: any) => {
        this.errMsg = 'Update failed.';
        this.isLoading = false;
      }
    });
  }

}
