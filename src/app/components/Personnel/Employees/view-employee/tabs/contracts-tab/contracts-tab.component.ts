import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../../../../core/interfaces/employee';
import { Contract, ContractHistory } from '../../../../../../core/interfaces/contract';
import { TableComponent } from '../../../../../shared/table/table.component';
import { ContractFormModalComponent } from './modals/contract-form-modal/contract-form-modal.component';
import { ContractCancelModalComponent } from './modals/contract-cancel-modal/contract-cancel-modal.component';
import { ContractHistoryModalComponent } from './modals/contract-history-modal/contract-history-modal.component';
import { EmployeeService } from '../../../../../../core/services/personnel/employees/employee.service';

@Component({
  standalone: true,
  selector: 'app-contracts-tab',
  imports: [CommonModule, TableComponent, ContractFormModalComponent, ContractCancelModalComponent, ContractHistoryModalComponent],
  templateUrl: './contracts-tab.component.html',
  styleUrl: './contracts-tab.component.css'
})
export class ContractsTabComponent implements OnInit, OnChanges {
  @Input() employee: Employee | null = null;

  // Table data and pagination
  contractsData: Contract[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  isLoading = false;

  // Modal states
  isCancelModalOpen = false;
  isHistoryModalOpen = false;
  selectedContract: Contract | null = null;
  contractHistory: ContractHistory[] = [];
  isAddModalOpen = false;
  isEditMode = false;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    if (this.employee?.id) {
      this.loadEmployeeContracts();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && changes['employee'].currentValue?.id) {
      this.loadEmployeeContracts();
    }
  }

  // Load contracts from API
  private loadEmployeeContracts(): void {
    if (!this.employee?.id) return;
    
    this.isLoading = true;
    this.employeeService.getEmployeeContracts(this.employee.id).subscribe({
      next: (response) => {
        this.contractsData = this.mapApiContractsToUI(response.data.list_items);
        this.totalItems = this.contractsData.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.isLoading = false;
        // Show error message to user
      }
    });
  }

  // Map API response to UI format
  private mapApiContractsToUI(apiContracts: Contract[]): Contract[] {
    return apiContracts.map(contract => ({
      ...contract,
      contractNumber: contract.id.toString().padStart(3, '0'),
      startDate: this.formatDateToDisplay(contract.start_contract),
      endDate: this.formatDateToDisplay(contract.end_contract),
      insuranceSalary: contract.insurance_salary,
      currency: 'EGP',
      createdAt: contract.created_at,
      updatedAt: contract.created_at,
      // Default values for missing fields
      employmentType: { id: 1, name: 'Full Time' },
      contractType: { id: 1, name: contract.trial ? 'Trial' : 'Permanent' },
      workMode: { id: 1, name: 'On Site' },
      branch: { id: 1, name: 'Main Branch' },
      department: { id: 1, name: 'Human Resources' },
      jobTitle: { id: 1, name: 'Employee' }
    }));
  }

  // Convert API date format to display format
  private formatDateToDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
    return `${salary.toLocaleString()} ${currency || 'EGP'}`;
  }

  // Cancel contract actions
  openCancelModal(contract: Contract): void {
    this.selectedContract = contract;
    this.isCancelModalOpen = true;
  }

  closeCancelModal(): void {
    this.isCancelModalOpen = false;
    this.selectedContract = null;
  }

  confirmCancel(): void {
    if (this.selectedContract) {
      // Call API to cancel contract
      this.employeeService.cancelEmployeeContract(this.selectedContract.id).subscribe({
        next: (response) => {
          // Update local data with the response
          this.contractsData = this.mapApiContractsToUI(response.data.list_items);
          this.totalItems = this.contractsData.length;
          this.closeCancelModal();
          // Show success message
        },
        error: (error) => {
          console.error('Error cancelling contract:', error);
          // Show error message
        }
      });
    }
  }

  // Handle cancel from modal
  onContractCancel(contract: Contract): void {
    // Call API to cancel contract
    this.employeeService.cancelEmployeeContract(contract.id).subscribe({
      next: (response) => {
        // Update local data with the response
        this.contractsData = this.mapApiContractsToUI(response.data.list_items);
        this.totalItems = this.contractsData.length;
        this.closeCancelModal();
        // Show success message
      },
      error: (error) => {
        console.error('Error cancelling contract:', error);
        // Show error message
      }
    });
  }

  // Edit contract
  editContract(contract: Contract): void {
    this.selectedContract = contract;
    this.isEditMode = true;
    this.isAddModalOpen = true;
  }

  // Add new contract
  addContract(): void {
    this.isEditMode = false;
    this.selectedContract = null;
    this.isAddModalOpen = true;
  }

  // Close add/edit contract overlay
  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.isEditMode = false;
    this.selectedContract = null;
  }

  // Save contract (add or edit) - called from modal
  onContractSave(contractData: any): void {
    if (contractData.isEdit && this.selectedContract) {
      // Update existing contract
      const updatedContract: Contract = {
        ...this.selectedContract,
        salary: contractData.salary,
        start_contract: contractData.startDate,
        end_contract: contractData.endDate,
        startDate: this.formatDateToDisplay(contractData.startDate),
        endDate: this.formatDateToDisplay(contractData.endDate),
        created_at: new Date().toISOString()
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
        expired: false,
        trial: false,
        start_contract: contractData.startDate,
        end_contract: contractData.endDate,
        salary: contractData.salary,
        insurance_salary: 0,
        status: 'Upcoming',
        created_at: new Date().toISOString(),
        created_by: 'Current User',
        // UI compatibility fields
        contractNumber: ('00' + newId).slice(-3),
        startDate: this.formatDateToDisplay(contractData.startDate),
        endDate: this.formatDateToDisplay(contractData.endDate),
        employmentType: { id: 0, name: '' },
        contractType: { id: 0, name: '' },
        workMode: { id: 0, name: '' },
        insuranceSalary: 0,
        currency: 'EGP',
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
}
