import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../../../../core/interfaces/employee';
import { Contract, ContractHistory } from '../../../../../../core/interfaces/contract';
import { TableComponent } from '../../../../../shared/table/table.component';
import { ContractFormModalComponent } from './modals/contract-form-modal/contract-form-modal.component';
import { ContractDeleteModalComponent } from './modals/contract-delete-modal/contract-delete-modal.component';
import { ContractHistoryModalComponent } from './modals/contract-history-modal/contract-history-modal.component';

@Component({
  standalone: true,
  selector: 'app-contracts-tab',
  imports: [CommonModule, TableComponent, ContractFormModalComponent, ContractDeleteModalComponent, ContractHistoryModalComponent],
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

  constructor() {}

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

  // Handle delete from modal
  onContractDelete(contract: Contract): void {
    // Call API to delete contract
    console.log('Deleting contract:', contract.id);
    
    // Remove from local data (replace with API call)
    this.contractsData = this.contractsData.filter(c => c.id !== contract.id);
    this.totalItems = this.contractsData.length;
    
    this.closeDeleteModal();
    // Show success message
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
        startDate: contractData.startDate,
        endDate: contractData.endDate,
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
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        employmentType: { id: 0, name: '' },
        contractType: { id: 0, name: '' },
        workMode: { id: 0, name: '' },
        salary: contractData.salary,
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
