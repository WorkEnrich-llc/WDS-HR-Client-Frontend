import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../../../../core/interfaces/employee';
import { Contract, ContractHistory } from '../../../../../../core/interfaces/contract';
import { TableComponent } from '../../../../../shared/table/table.component';
import { PopupComponent } from '../../../../../shared/popup/popup.component';
import { OverlayFilterBoxComponent } from '../../../../../shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  standalone: true,
  selector: 'app-contracts-tab',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableComponent, PopupComponent, OverlayFilterBoxComponent],
  templateUrl: './contracts-tab.component.html',
  styleUrl: './contracts-tab.component.css'
})
export class ContractsTabComponent implements OnInit {
  @Input() employee: Employee | null = null;

  // Table data and pagination
  contractsData: Contract[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  isLoading = false;

  // Modal states
  isDeleteModalOpen = false;
  isHistoryModalOpen = false;
  selectedContract: Contract | null = null;
  contractHistory: ContractHistory[] = [];
  isAddModalOpen = false;
  isEditMode = false;

  // Reactive form
  contractForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contractForm = this.fb.group({
      salary: [null, [Validators.required, Validators.min(0)]],
      startDate: [null, Validators.required],
      withEndDate: [true],
      endDate: [null]
    });

    // Watch for changes in withEndDate to control endDate validation
    this.contractForm.get('withEndDate')?.valueChanges.subscribe(value => {
      const endDateControl = this.contractForm.get('endDate');
      if (value) {
        endDateControl?.setValidators([Validators.required]);
      } else {
        endDateControl?.clearValidators();
        endDateControl?.setValue(null);
      }
      endDateControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadMockData();
  }

  // Mock data - matches the table structure from the image
  private loadMockData(): void {
    this.contractsData = [
      {
        id: 10,
        contractNumber: '010',
        startDate: '20/06/2025',
        endDate: '20/06/2028',
        employmentType: { id: 1, name: 'Full Time' },
        contractType: { id: 1, name: 'Permanent' },
        workMode: { id: 1, name: 'On Site' },
        salary: 7000,
        insuranceSalary: 6000,
        currency: 'EGP',
        status: 'Upcoming',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        branch: { id: 1, name: 'Cairo Branch' },
        department: { id: 1, name: 'Human Resources' },
        jobTitle: { id: 1, name: 'HR Manager' }
      },
      {
        id: 9,
        contractNumber: '009',
        startDate: '20/06/2025',
        endDate: '20/06/2028',
        employmentType: { id: 1, name: 'Full Time' },
        contractType: { id: 1, name: 'Permanent' },
        workMode: { id: 1, name: 'On Site' },
        salary: 5000,
        insuranceSalary: 5000,
        currency: 'EGP',
        status: 'Active',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        branch: { id: 1, name: 'Cairo Branch' },
        department: { id: 1, name: 'Human Resources' },
        jobTitle: { id: 1, name: 'HR Manager' }
      },
      {
        id: 8,
        contractNumber: '008',
        startDate: '20/06/2025',
        endDate: '20/06/2028',
        employmentType: { id: 1, name: 'Full Time' },
        contractType: { id: 1, name: 'Permanent' },
        workMode: { id: 1, name: 'On Site' },
        salary: 7000,
        insuranceSalary: 6000,
        currency: 'EGP',
        status: 'Cancelled',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        branch: { id: 1, name: 'Cairo Branch' },
        department: { id: 1, name: 'Human Resources' },
        jobTitle: { id: 1, name: 'HR Manager' }
      },
      {
        id: 7,
        contractNumber: '007',
        startDate: '20/06/2025',
        endDate: '20/06/2028',
        employmentType: { id: 1, name: 'Full Time' },
        contractType: { id: 1, name: 'Permanent' },
        workMode: { id: 1, name: 'On Site' },
        salary: 5000,
        insuranceSalary: 5000,
        currency: 'EGP',
        status: 'Expired',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        branch: { id: 1, name: 'Cairo Branch' },
        department: { id: 1, name: 'Human Resources' },
        jobTitle: { id: 1, name: 'HR Manager' }
      },
      {
        id: 6,
        contractNumber: '006',
        startDate: '20/06/2025',
        endDate: '20/06/2028',
        employmentType: { id: 1, name: 'Full Time' },
        contractType: { id: 1, name: 'Permanent' },
        workMode: { id: 1, name: 'On Site' },
        salary: 5000,
        insuranceSalary: 5000,
        currency: 'EGP',
        status: 'Expired',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        branch: { id: 1, name: 'Cairo Branch' },
        department: { id: 1, name: 'Human Resources' },
        jobTitle: { id: 1, name: 'HR Manager' }
      },
      {
        id: 5,
        contractNumber: '005',
        startDate: '20/06/2025',
        endDate: '20/06/2028',
        employmentType: { id: 1, name: 'Full Time' },
        contractType: { id: 1, name: 'Permanent' },
        workMode: { id: 1, name: 'On Site' },
        salary: 5000,
        insuranceSalary: 5000,
        currency: 'EGP',
        status: 'Expired',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        branch: { id: 1, name: 'Cairo Branch' },
        department: { id: 1, name: 'Human Resources' },
        jobTitle: { id: 1, name: 'HR Manager' }
      },
      {
        id: 4,
        contractNumber: '004',
        startDate: '20/06/2025',
        endDate: '20/06/2028',
        employmentType: { id: 1, name: 'Full Time' },
        contractType: { id: 1, name: 'Permanent' },
        workMode: { id: 1, name: 'On Site' },
        salary: 5000,
        insuranceSalary: 5000,
        currency: 'EGP',
        status: 'Expired',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        branch: { id: 1, name: 'Cairo Branch' },
        department: { id: 1, name: 'Human Resources' },
        jobTitle: { id: 1, name: 'HR Manager' }
      },
      {
        id: 3,
        contractNumber: '003',
        startDate: '20/06/2025',
        endDate: '20/06/2028',
        employmentType: { id: 1, name: 'Full Time' },
        contractType: { id: 1, name: 'Permanent' },
        workMode: { id: 1, name: 'On Site' },
        salary: 5000,
        insuranceSalary: 5000,
        currency: 'EGP',
        status: 'Expired',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        branch: { id: 1, name: 'Cairo Branch' },
        department: { id: 1, name: 'Human Resources' },
        jobTitle: { id: 1, name: 'HR Manager' }
      },
      {
        id: 2,
        contractNumber: '002',
        startDate: '20/06/2025',
        endDate: '20/06/2028',
        employmentType: { id: 1, name: 'Full Time' },
        contractType: { id: 1, name: 'Permanent' },
        workMode: { id: 1, name: 'On Site' },
        salary: 5000,
        insuranceSalary: 5000,
        currency: 'EGP',
        status: 'Expired',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        branch: { id: 1, name: 'Cairo Branch' },
        department: { id: 1, name: 'Human Resources' },
        jobTitle: { id: 1, name: 'HR Manager' }
      },
      {
        id: 1,
        contractNumber: '001',
        startDate: '20/06/2025',
        endDate: '20/06/2028',
        employmentType: { id: 1, name: 'Full Time' },
        contractType: { id: 1, name: 'Permanent' },
        workMode: { id: 1, name: 'On Site' },
        salary: 5000,
        insuranceSalary: 5000,
        currency: 'EGP',
        status: 'Expired',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        branch: { id: 1, name: 'Cairo Branch' },
        department: { id: 1, name: 'Human Resources' },
        jobTitle: { id: 1, name: 'HR Manager' }
      }
    ];
    this.totalItems = this.contractsData.length;
  }

  // Pagination handlers
  onPageChange(page: number): void {
    this.currentPage = page;
    // In real app, reload data for new page
  }

  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    // In real app, reload data with new page size
  }

  // Status badge styling
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'badge-success';
      case 'upcoming':
        return 'badge-newjoiner';
      case 'expired':
        return 'badge-gray';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  }

  // Format date
  getFormattedDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Format salary
  getFormattedSalary(salary: number, currency: string): string {
    return `${salary.toLocaleString()} ${currency}`;
  }

  // Delete contract actions
  openDeleteModal(contract: Contract): void {
    this.selectedContract = contract;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedContract = null;
  }

  confirmDelete(): void {
    if (this.selectedContract) {
      // Call API to delete contract
      console.log('Deleting contract:', this.selectedContract.id);
      
      // Remove from local data (replace with API call)
      this.contractsData = this.contractsData.filter(c => c.id !== this.selectedContract!.id);
      this.totalItems = this.contractsData.length;
      
      this.closeDeleteModal();
      // Show success message
    }
  }

  // Edit contract
  // Edit contract
  editContract(contract: Contract): void {
    this.selectedContract = contract;
    this.isEditMode = true;
    this.isAddModalOpen = true;

    // Format dates for form inputs (convert from display format to ISO format)
    const formattedStartDate = this.convertDisplayDateToFormDate(contract.startDate);
    const formattedEndDate = contract.endDate ? this.convertDisplayDateToFormDate(contract.endDate) : null;
    const hasEndDate = !!contract.endDate;

    // Populate form with contract data
    this.contractForm.patchValue({
      salary: contract.salary,
      startDate: formattedStartDate,
      withEndDate: hasEndDate,
      endDate: formattedEndDate
    });
  }

  // Add new contract
  addContract(): void {
    this.isEditMode = false;
    this.selectedContract = null;
    this.contractForm.reset({
      salary: null,
      startDate: null,
      withEndDate: true,
      endDate: null
    });
    this.isAddModalOpen = true;
  }

  // Close add/edit contract overlay
  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.isEditMode = false;
    this.selectedContract = null;
    this.contractForm.reset();
  }

  // Save contract (add or edit)
  saveContract(): void {
    if (this.contractForm.invalid) {
      Object.keys(this.contractForm.controls).forEach(key => {
        this.contractForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.contractForm.value;

    if (this.isEditMode && this.selectedContract) {
      // Update existing contract
      const updatedContract: Contract = {
        ...this.selectedContract,
        salary: formValue.salary,
        startDate: this.convertFormDateToDisplayDate(formValue.startDate),
        endDate: formValue.withEndDate ? this.convertFormDateToDisplayDate(formValue.endDate) : '',
        updatedAt: new Date().toISOString()
      };

      const index = this.contractsData.findIndex(c => c.id === this.selectedContract!.id);
      if (index !== -1) {
        this.contractsData[index] = updatedContract;
      }
    } else {
      // Add new contract
      const newId = this.contractsData.length ? Math.max(...this.contractsData.map(c => c.id)) + 1 : 1;
      const newContract: Contract = {
        id: newId,
        contractNumber: ('00' + newId).slice(-3),
        startDate: this.convertFormDateToDisplayDate(formValue.startDate),
        endDate: formValue.withEndDate ? this.convertFormDateToDisplayDate(formValue.endDate) : '',
        employmentType: { id: 0, name: '' },
        contractType: { id: 0, name: '' },
        workMode: { id: 0, name: '' },
        salary: formValue.salary,
        insuranceSalary: 0,
        currency: 'EGP',
        status: 'Upcoming',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        branch: { id: 0, name: '' },
        department: { id: 0, name: '' },
        jobTitle: { id: 0, name: '' }
      };
      this.contractsData.unshift(newContract);
      this.totalItems = this.contractsData.length;
    }

    this.closeAddModal();
  }

  // Helper method to convert display date (DD/MM/YYYY) to form date (YYYY-MM-DD)
  private convertDisplayDateToFormDate(displayDate: string): string {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return displayDate;
  }

  // Helper method to convert form date (YYYY-MM-DD) to display date (DD/MM/YYYY)
  private convertFormDateToDisplayDate(formDate: string): string {
    if (!formDate) return '';
    const date = new Date(formDate);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // View contract history
  viewHistory(contract: Contract): void {
    this.selectedContract = contract;
    this.loadContractHistory(contract.id);
    this.isHistoryModalOpen = true;
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen = false;
    this.selectedContract = null;
    this.contractHistory = [];
  }

  private loadContractHistory(contractId: number): void {
    // Mock history data - replace with real API call
    this.contractHistory = [
      {
        id: 1,
        contractId: contractId,
        action: 'Appraisal',
        changedBy: 'HR Admin',
        changeDate: '2/5/2025',
        previousValue: '7,000 EGP',
        newValue: '7,000 EGP',
        reason: 'Annual appraisal'
      },
      {
        id: 2,
        contractId: contractId,
        action: 'Appraisal',
        changedBy: 'HR Manager',
        changeDate: '2/5/2025',
        previousValue: '7,000 EGP',
        newValue: '7,000 EGP',
        reason: 'Annual appraisal'
      },
      {
        id: 3,
        contractId: contractId,
        action: 'Appraisal',
        changedBy: 'HR Specialist',
        changeDate: '2/5/2025',
        previousValue: '7,000 EGP',
        newValue: '7,000 EGP',
        reason: 'Annual appraisal'
      },
      {
        id: 4,
        contractId: contractId,
        action: 'Appraisal',
        changedBy: 'HR Admin',
        changeDate: '2/5/2025',
        previousValue: '7,000 EGP',
        newValue: '7,000 EGP',
        reason: 'Annual appraisal'
      },
      {
        id: 5,
        contractId: contractId,
        action: 'Appraisal',
        changedBy: 'HR Manager',
        changeDate: '2/5/2025',
        previousValue: '7,000 EGP',
        newValue: '7,000 EGP',
        reason: 'Annual appraisal'
      },
      {
        id: 6,
        contractId: contractId,
        action: 'Appraisal',
        changedBy: 'HR Specialist',
        changeDate: '2/5/2025',
        previousValue: '7,000 EGP',
        newValue: '7,000 EGP',
        reason: 'Annual appraisal'
      },
      {
        id: 7,
        contractId: contractId,
        action: 'Appraisal',
        changedBy: 'HR Admin',
        changeDate: '2/5/2025',
        previousValue: '7,000 EGP',
        newValue: '7,000 EGP',
        reason: 'Annual appraisal'
      },
      {
        id: 8,
        contractId: contractId,
        action: 'Appraisal',
        changedBy: 'HR Manager',
        changeDate: '2/5/2025',
        previousValue: '7,000 EGP',
        newValue: '7,000 EGP',
        reason: 'Annual appraisal'
      },
      {
        id: 9,
        contractId: contractId,
        action: 'Appraisal',
        changedBy: 'HR Specialist',
        changeDate: '2/5/2025',
        previousValue: '7,000 EGP',
        newValue: '7,000 EGP',
        reason: 'Annual appraisal'
      },
      {
        id: 10,
        contractId: contractId,
        action: 'Appraisal',
        changedBy: 'HR Admin',
        changeDate: '2/5/2025',
        previousValue: '7,000 EGP',
        newValue: '7,000 EGP',
        reason: 'Annual appraisal'
      }
    ];
  }

  getFormattedDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Statistics methods
  getActiveContractsCount(): number {
    return this.contractsData.filter(contract => contract.status === 'Active').length;
  }

  getUpcomingContractsCount(): number {
    return this.contractsData.filter(contract => contract.status === 'Upcoming').length;
  }

  // Form validation helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contractForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.contractForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
    }
    return '';
  }

  // Modal title helper
  getModalTitle(): string {
    return this.isEditMode ? 'Edit Contract' : 'New Contract';
  }

  // Button text helper
  getSaveButtonText(): string {
    return this.isEditMode ? 'Update Contract' : 'Save Contract';
  }
}
