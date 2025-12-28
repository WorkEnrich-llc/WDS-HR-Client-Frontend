import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { DelegationService, CreateDelegationRequest, UpdateDelegationRequest } from '../../../../core/services/personnel/delegation/delegation.service';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { CustomValidators } from 'app/core/validators/custom-validators';

@Component({
  selector: 'app-manage-delegation',
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    PopupComponent
],
  providers: [DatePipe],
  templateUrl: './manage-delegation.component.html',
  styleUrl: './manage-delegation.component.css'
})
export class ManageDelegationComponent implements OnInit, OnDestroy {
  delegationForm!: FormGroup;
  isEditMode = false;
  delegationId: number | null = null;
  isLoading = false;
  isSubmitting = false;
  isModalOpen = false;
  isSuccessModalOpen = false;
  employees: any[] = [];
  currentDate = new Date().toISOString().split('T')[0];
  todayFormatted = '';
  delegatorList: any[] = [];
  delegateList: any[] = [];

  private delegationService = inject(DelegationService);
  private employeeService = inject(EmployeeService);
  private toasterMessageService = inject(ToasterMessageService);
  private subscriptions: Subscription[] = [];
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe)
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(ToastrService);


  constructor(
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Initialize today's date
    this.todayFormatted = this.datePipe.transform(new Date(), 'dd/MM/yyyy') || '';

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.delegationId = +params['id'];
        this.loadDelegationData();
      }
    });

    this.loadEmployees();
  }

  initializeForm(): void {
    this.delegationForm = this.fb.group({
      delegator_id: ['', [Validators.required]],
      delegate_id: ['', [Validators.required]],
      from_date: ['', [Validators.required, CustomValidators.futureDate(this.currentDate)]],
      to_date: ['', [Validators.required]]
    });

    // Add custom validator to ensure end date is after start date`
    this.delegationForm.setValidators(this.dateRangeValidator.bind(this));
  }

  dateRangeValidator(control: any) {
    const form = control as FormGroup;
    const fromDate = form.get('from_date')?.value;
    const toDate = form.get('to_date')?.value;

    if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
      return { dateRange: true };
    }
    return null;
  }

  loadEmployees(): void {
    this.employeeService.getEmployees(1, 100).subscribe({
      next: (response) => {
        this.employees = response.data.list_items.map(employee => ({
          id: employee.id,
          name: employee.contact_info.name
        }));
        this.delegatorList = [...this.employees];
        this.delegateList = [...this.employees];
        this.setupDelegationFilters();
      },

      error: (error) => {
        console.error('Error loading employees:', error);
        this.toastr.error('Failed to load employees', 'Error');
      }
    });
  }

  setupDelegationFilters(): void {
    this.delegationForm.get('delegator_id')?.valueChanges.subscribe(selectedId => {
      this.delegateList = this.employees.filter(emp => emp.id !== +selectedId);

      const delegateId = this.delegationForm.get('delegate_id')?.value;
      if (delegateId === +selectedId) {
        this.delegationForm.patchValue({ delegate_id: '' });
      }
    });

    this.delegationForm.get('delegate_id')?.valueChanges.subscribe(selectedId => {
      this.delegatorList = this.employees.filter(emp => emp.id !== +selectedId);

      const delegatorId = this.delegationForm.get('delegator_id')?.value;
      if (delegatorId === +selectedId) {
        this.delegationForm.patchValue({ delegator_id: '' });
      }
    });
  }

  loadDelegationData(): void {
    if (!this.delegationId) return;

    this.isLoading = true;
    this.delegationService.getDelegationById(this.delegationId).subscribe({
      next: (response) => {
        const delegation = response.data.object_info;
        this.delegationForm.patchValue({
          delegator_id: delegation.delegator.id,
          delegate_id: delegation.delegate.id,
          from_date: delegation.from_date,
          to_date: delegation.to_date
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading delegation:', error);
        this.toastr.error('Failed to load delegation data', 'Error');
        this.isLoading = false;
        this.router.navigate(['/delegation']);
      }
    });
  }

  onSubmit(): void {
    if (this.delegationForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = this.delegationForm.value;

      // Format dates to match API expected format
      const requestData = {
        request_data: {
          ...(this.isEditMode && this.delegationId && { id: this.delegationId }),
          from_date: this.formatDate(formData.from_date),
          to_date: this.formatDate(formData.to_date),
          delegator_id: formData.delegator_id,
          delegate_id: formData.delegate_id
        }
      };

      const operation = this.isEditMode
        ? this.delegationService.updateDelegation(requestData as UpdateDelegationRequest)
        : this.delegationService.createDelegation(requestData as CreateDelegationRequest);

      operation.subscribe({
        next: (response) => {
          this.isSubmitting = false;
          const message = this.isEditMode ? 'Delegation updated successfully' : 'Delegation created successfully';
          this.toasterMessageService.showSuccess(message);
          this.router.navigate(['/delegation']);
          // this.openSuccessModal();
        },
        error: (error) => { }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private formatDate(dateString: string): string {
    // Convert from YYYY-MM-DD to API format (YYYY-M-D)
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-based month
    const day = date.getDate();
    return `${year}-${month}-${day}`;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.delegationForm.controls).forEach(key => {
      const control = this.delegationForm.get(key);
      control?.markAsTouched();
    });
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.delegationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.delegationForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
    }

    // Check for date range error
    if (fieldName === 'to_date' && this.delegationForm.errors?.['dateRange']) {
      return 'End date must be the same as or after the start date.';
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'delegator_id': 'Delegator',
      'delegate_id': 'Delegate',
      'from_date': 'Start Date',
      'to_date': 'End Date'
    };
    return labels[fieldName] || fieldName;
  }

  // Modal handlers
  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  confirmAction(): void {
    this.isModalOpen = false;
    this.router.navigate(['/delegation']);
  }

  openSuccessModal(): void {
    this.isSuccessModalOpen = true;
  }

  closeSuccessModal(): void {
    this.isSuccessModalOpen = false;
  }

  viewDelegations(): void {
    this.closeSuccessModal();
    this.router.navigate(['/delegation']);
  }

  createAnother(): void {
    this.closeSuccessModal();
    this.delegationForm.reset();
    this.isEditMode = false;
    this.delegationId = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
