import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Contract, ContractHistory } from '../../../../../../core/interfaces/contract';
import { Employee } from '../../../../../../core/interfaces/employee';
import { EmployeeService } from '../../../../../../core/services/personnel/employees/employee.service';
import { TableComponent } from '../../../../../shared/table/table.component';
import { ContractCancelModalComponent } from './modals/contract-cancel-modal/contract-cancel-modal.component';
import { ContractFormModalComponent } from './modals/contract-form-modal/contract-form-modal.component';
import { ContractHistoryModalComponent } from './modals/contract-history-modal/contract-history-modal.component';
import { ContractResignModalComponent } from './modals/contract-resign-modal/contract-resign-modal.component';
import { ContractResignedViewModalComponent } from './modals/contract-resigned-view-modal/contract-resigned-view-modal.component';
import { ContractTerminateModalComponent } from './modals/contract-terminate-modal/contract-terminate-modal.component';
import { ContractTerminatedViewModalComponent } from './modals/contract-terminated-view-modal/contract-terminated-view-modal.component';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { finalize } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-contracts-tab',
  imports: [
    CommonModule,
    TableComponent,
    ContractFormModalComponent,
    ContractCancelModalComponent,
    ContractHistoryModalComponent,
    ContractTerminateModalComponent,
    ContractResignModalComponent,
    ContractTerminatedViewModalComponent,
    ContractResignedViewModalComponent,
  ],
  templateUrl: './contracts-tab.component.html',
  styleUrl: './contracts-tab.component.css'
})
export class ContractsTabComponent implements OnInit, OnChanges {
  @Input() employee: Employee | null = null;
  @ViewChild('addForm') addForm: ContractFormModalComponent | undefined;
  private toasterService = inject(ToasterMessageService);
  historyContract: Contract | null = null;
  editedContract: Contract | null = null;

  // Table data and pagination
  contractsData: Contract[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  isLoading = false;
  isSaving = false;

  // Modal states
  isCancelModalOpen = false;
  isHistoryModalOpen = false;
  isTerminateModalOpen = false;
  isResignModalOpen = false;
  isTerminatedViewModalOpen = false;
  isResignedViewModalOpen = false;
  selectedContract: Contract | null = null;
  contractHistory: ContractHistory[] = [];
  contractTerminationData: any = null;
  contractResignationData: any = null;
  isAddModalOpen = false;
  isOpen = false;
  isEditMode = false;

  constructor(private employeeService: EmployeeService) { }

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

  // Sample contracts for demonstration - Remove in production
  // private addSampleContracts(): void {
  //   const sampleContracts: Contract[] = [
  //     {
  //       id: 1001,
  //       expired: false,
  //       trial: false,
  //       start_contract: '2024-01-01',
  //       end_contract: '2025-12-31',
  //       salary: 15000,
  //       insurance_salary: 12000,
  //       status: 'Active',
  //       created_at: '2024-01-01T00:00:00Z',
  //       created_by: 'Admin',
  //       contractNumber: '001',
  //       startDate: '01/01/2024',
  //       endDate: '31/12/2025',
  //       currency: 'EGP',
  //       employmentType: { id: 1, name: 'Full Time' },
  //       contractType: { id: 1, name: 'Permanent' },
  //       workMode: { id: 1, name: 'On Site' },
  //       branch: { id: 1, name: 'Main Branch' },
  //       department: { id: 1, name: 'HR' },
  //       jobTitle: { id: 1, name: 'HR Manager' }
  //     },
  //     {
  //       id: 1002,
  //       expired: false,
  //       trial: false,
  //       start_contract: '2025-01-01',
  //       end_contract: '2026-12-31',
  //       salary: 18000,
  //       insurance_salary: 15000,
  //       status: 'Upcoming',
  //       created_at: '2024-12-01T00:00:00Z',
  //       created_by: 'Admin',
  //       contractNumber: '002',
  //       startDate: '01/01/2025',
  //       endDate: '31/12/2026',
  //       currency: 'EGP',
  //       employmentType: { id: 1, name: 'Full Time' },
  //       contractType: { id: 1, name: 'Permanent' },
  //       workMode: { id: 2, name: 'Remote' },
  //       branch: { id: 1, name: 'Main Branch' },
  //       department: { id: 2, name: 'IT' },
  //       jobTitle: { id: 2, name: 'Developer' }
  //     },
  //     {
  //       id: 1003,
  //       expired: false,
  //       trial: false,
  //       start_contract: '2023-01-01',
  //       end_contract: '2024-01-01',
  //       salary: 12000,
  //       insurance_salary: 10000,
  //       status: 'Terminated',
  //       created_at: '2023-01-01T00:00:00Z',
  //       created_by: 'Admin',
  //       contractNumber: '003',
  //       startDate: '01/01/2023',
  //       endDate: '01/01/2024',
  //       currency: 'EGP',
  //       employmentType: { id: 1, name: 'Full Time' },
  //       contractType: { id: 1, name: 'Permanent' },
  //       workMode: { id: 1, name: 'On Site' },
  //       branch: { id: 1, name: 'Main Branch' },
  //       department: { id: 3, name: 'Finance' },
  //       jobTitle: { id: 3, name: 'Accountant' },
  //       terminationData: {
  //         lastDay: '2024-01-01',
  //         reason: 'Performance issues and failure to meet targets consistently.'
  //       }
  //     },
  //     {
  //       id: 1004,
  //       expired: false,
  //       trial: false,
  //       start_contract: '2022-06-01',
  //       end_contract: '2024-03-15',
  //       salary: 14000,
  //       insurance_salary: 11000,
  //       status: 'Resigned',
  //       created_at: '2022-06-01T00:00:00Z',
  //       created_by: 'Admin',
  //       contractNumber: '004',
  //       startDate: '01/06/2022',
  //       endDate: '15/03/2024',
  //       currency: 'EGP',
  //       employmentType: { id: 1, name: 'Full Time' },
  //       contractType: { id: 1, name: 'Permanent' },
  //       workMode: { id: 1, name: 'On Site' },
  //       branch: { id: 2, name: 'Branch 2' },
  //       department: { id: 4, name: 'Marketing' },
  //       jobTitle: { id: 4, name: 'Marketing Specialist' },
  //       resignationData: {
  //         resignDate: '2024-01-15',
  //         noticePeriod: 60,
  //         lastDay: '2024-03-15',
  //         reason: 'Found a better opportunity with higher compensation and growth prospects.'
  //       }
  //     }
  //   ];

  //   this.contractsData = sampleContracts;
  // }

  // Map API response to UI format
  private mapApiContractsToUI(apiContracts: Contract[]): Contract[] {
    return apiContracts.map(contract => ({
      ...contract,
      contractNumber: contract.id.toString().padStart(3, '0'),
      startDate: this.formatDateToDisplay(contract.start_contract),
      endDate: contract.end_contract ? this.formatDateToDisplay(contract.end_contract) : 'Indefinite term contract',
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
      case 'terminate':
        return 'badge-terminated';
      case 'probation':
        return 'badge-probation';
      case 'resign':
        return 'badge-resigned';
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
      this.employeeService.cancelEmployeeContract({
        contract_id: this.selectedContract.id,
      }).subscribe({
        next: (response) => {
          // Update local data with the response
          this.contractsData = this.mapApiContractsToUI(response.data.list_items);
          this.totalItems = this.contractsData.length;
          this.closeCancelModal();
          this.toasterService.showSuccess('Contract cancelled successfully');
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
    this.employeeService.cancelEmployeeContract({
      contract_id: contract.id,
    }).subscribe({
      next: (response) => {
        const listItems =
          response?.data?.list_items ??
          response?.data?.list_items ??
          [];
        // Update local data with the response
        this.closeCancelModal();
        this.toasterService.showSuccess('Contract cancelled successfully');
        this.contractsData = this.mapApiContractsToUI(listItems);
        this.totalItems = this.contractsData.length;
        this.loadEmployeeContracts();
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
    this.editedContract = contract;
    this.isEditMode = true;
    this.isAddModalOpen = true;
  }

  // Add new contract
  addContract(): void {
    this.isEditMode = false;
    this.editedContract = null;
    this.isAddModalOpen = true;
  }

  // Close add/edit contract overlay
  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.isOpen = false;
    this.isEditMode = false;
    this.editedContract = null;

  }

  // Save contract (add or edit) - called from modal
  onContractSave(contractData: any): void {
    if (this.isSaving) return;
    this.isSaving = true;
    if (this.isEditMode && contractData) {
      const contractId = contractData.contractId || this.editedContract?.id;
      console.log('from save :', contractId)
      // Adjust existing contract via API
      const payload = {
        contract_id: contractId,
        adjustment_type: contractData.adjustmentType,
        salary: contractData.salary,
        start_contract: contractData.startDate,
        end_contract: contractData.endDate,
        notice_period: contractData.noticePeriod
      };
      this.employeeService.adjustEmployeeContractAdjustment(payload).pipe(
        finalize(() => this.isSaving = false)
      ).subscribe({
        next: () => {
          this.toasterService.showSuccess('Contract adjusted successfully');
          // Reload contracts after adjustment
          this.loadEmployeeContracts();
          this.closeAddModal();
        },
        error: (error) => {
          console.error('Error adjusting contract:', error);
          this.isSaving = false;
          // Show error message
        }
      });
    }
    else {
      // Add new contract via API
      if (!this.employee?.id) {
        console.error('Employee ID is required to create contract');
        this.isLoading = false;
        return;
      }

      const payload = {
        employee_id: this.employee.id,
        contract_type: 1, // Default contract type
        start_contract: contractData.startDate,
        end_contract: contractData.endDate || null, // Default far future date if no end date
        salary: contractData.salary,
        insurance_salary: contractData.insuranceSalary || 0
      };

      this.employeeService.createEmployeeContract(payload).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          // Reload contracts to get updated list
          this.toasterService.showSuccess('Contract created successfully');
          this.loadEmployeeContracts();
          this.closeAddModal();
          // Show success message
        },
        error: (error) => {
          console.error('Error creating contract:', error);
          // Show error message
        }
      });
    }
  }

  // View contract history
  viewHistory(contract: Contract): void {
    this.historyContract = contract;
    this.loadContractHistory(contract.id);
    this.isHistoryModalOpen = true;
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen = false;
    this.historyContract = null;
    this.contractHistory = [];
  }

  private loadContractHistory(contractId: number): void {
    // Load adjustment history from API
    this.employeeService.getEmployeeContractAdjustments(contractId).subscribe({
      next: response => {
        const adjustments = response.data.list_items;
        console.log('Loaded contract adjustments:', response.data.list_items);
        this.contractHistory = adjustments.map(adj => ({
          id: adj.id,
          contractId: contractId,
          date: this.getFormattedDateTime(adj.created_at || ''),
          endDate: adj.end_contract ? this.getFormattedDate(adj.end_contract) : '',
          type: adj.adjustment_type || '',
          salary: adj.salary,

          action: adj.adjustment_type,
          changedBy: adj.created_by,
          changeDate: this.getFormattedDate(adj.start_date || adj.created_at),
          previousValue: '',
          // newValue: `${adj.new_salary.toLocaleString()} ${this.selectedContract?.currency || 'EGP'}`,
          reason: ''
        }));


        adjustment_type
        :
        "Appraisal"
        created_at
        :
        "2025-10-20T16:24:22.318164"
        created_by
        :
        "Assem"
        end_contract
        :
        "2025-09-11"
        id
        :
        6
        notice_period
        :
        20
        salary
        :
        50000
        start_contract
        :
        "2025-09-11"
      },
      error: error => {
        console.error('Error loading contract history:', error);
        this.contractHistory = [];
      }
    });
  }

  getFormattedDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      // hour: '2-digit',
      // minute: '2-digit'
    });
  }

  // Statistics methods
  getActiveContractsCount(): number {
    return this.contractsData.filter(contract => contract.status === 'Active').length;
  }

  getUpcomingContractsCount(): number {
    return this.contractsData.filter(contract => contract.status === 'Upcoming').length;
  }

  getProbationContractsCount(): number {
    return this.contractsData.filter(contract => contract.status === 'Probation').length;
  }

  // Terminate contract actions
  openTerminateModal(contract: Contract): void {
    console.log('CONTRACT RECEIVED FROM HTML:', contract);
    this.selectedContract = contract;
    this.isTerminateModalOpen = true;
  }

  closeTerminateModal(): void {
    this.isTerminateModalOpen = false;
    // this.selectedContract = null;
  }

  onContractTerminate(data: { contract: Contract, terminationData: any }): void {
    // TODO: Call API to terminate contract
    // this.employeeService.terminateEmployeeContract(data.contract.id, data.terminationData).subscribe({
    // For now, just update local data

    this.employeeService.terminateEmployeeContract({
      contract_id: data.contract.id,
      last_date: data.terminationData.lastDay,
      reason: data.terminationData.reason
    }).subscribe({
      next: response => {
        const contractIndex = this.contractsData.findIndex(c => c.id === data.contract.id);
        if (contractIndex !== -1) {
          this.contractsData[contractIndex].status = 'Terminate';
          this.contractsData[contractIndex].terminationData = data.terminationData;
        }

      },
      error: error => {
        console.error('Error terminating contract:', error);
      }
    });
    this.toasterService.showSuccess('contract terminated successfully');
    console.log('Contract terminated successfully');
    // TODO: Add toast notification
  }


  openResignModal(contract: Contract) {
    this.selectedContract = contract;
    this.isResignModalOpen = true;
  }


  closeResignModal(): void {
    this.isResignModalOpen = false;
    this.selectedContract = null;
  }

  onContractResign(data: { contract: Contract, resignationData: any }): void {
    // TODO: Call API to process resignation
    // this.employeeService.resignEmployeeContract(data.contract.id, data.resignationData).subscribe({
    // For now, just update local data
    if (!data?.contract?.id) return;
    this.employeeService.resignEmployeeContract({
      contract_id: data.contract.id,
      last_date: data.resignationData.lastDay,
      resign_date: data.resignationData.resignDate,
      reason: data.resignationData.reason
    }).subscribe({
      next: () => {
        // const contractIndex = this.contractsData.findIndex(c => c.id === data.contract.id);
        // if (contractIndex !== -1) {
        //   this.contractsData[contractIndex].status = 'Resigned';
        //   this.contractsData[contractIndex].resignationData = data.resignationData;
        // }
        const contractIndex = this.contractsData.findIndex(c => c.id === data.contract.id);
        if (contractIndex !== -1) {
          this.contractsData[contractIndex] = {
            ...this.contractsData[contractIndex],
            status: 'Resign',
            resignationData: data.resignationData
          };
        }
      },
      error: error => {
        console.error('Error processing contract resignation:', error);
      }
    });
    this.toasterService.showSuccess('contract resignation processed successfully');
    // TODO: Add toast notification
  }

  // View terminated contract details
  viewTerminatedContract(contract: Contract): void {
    this.selectedContract = contract;
    this.contractTerminationData = contract.terminationData || {
      lastDay: contract.endDate,
      reason: 'Contract was terminated'
    };
    this.isTerminatedViewModalOpen = true;
  }

  closeTerminatedViewModal(): void {
    this.isTerminatedViewModalOpen = false;
    this.selectedContract = null;
    this.contractTerminationData = null;
  }

  // View resigned contract details
  viewResignedContract(contract: Contract): void {

    this.selectedContract = contract;
    this.contractResignationData = contract.resignationData || {
      resignDate: contract.endDate,
      lastDay: contract.endDate,
      reason: 'Employee resigned'
    };
    this.isResignedViewModalOpen = true;
  }

  closeResignedViewModal(): void {
    this.isResignedViewModalOpen = false;
    this.selectedContract = null;
    this.contractResignationData = null;
  }

  // Dropdown toggle methods
  toggleDropdown(contract: Contract): void {
    if (this.selectedContract?.id === contract.id) {
      this.selectedContract = null;
    } else {
      this.selectedContract = contract;
    }
  }

  closeDropdown(): void {
    this.selectedContract = null;
  }

  // Close dropdown when clicking outside
  // @HostListener('document:click', ['$event'])
  // onDocumentClick(event: Event): void {
  //   const target = event.target as HTMLElement;
  //   if (!target.closest('.custom-dropdown')) {
  //     this.selectedContract = null;
  //   }
  // }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isAddModalOpen || this.isHistoryModalOpen || this.isCancelModalOpen || this.isTerminateModalOpen || this.isResignModalOpen || this.isTerminatedViewModalOpen || this.isResignedViewModalOpen) {
      return;
    }
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.selectedContract = null;
    }
  }
}
