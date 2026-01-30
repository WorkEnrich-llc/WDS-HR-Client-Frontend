
import { Component, EventEmitter, HostListener, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
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
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { NgClass } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-contracts-tab',
  imports: [
    NgClass,
    TableComponent,
    ContractFormModalComponent,
    ContractCancelModalComponent,
    ContractHistoryModalComponent,
    ContractTerminateModalComponent,
    ContractResignModalComponent,
    ContractTerminatedViewModalComponent,
    ContractResignedViewModalComponent,
    PopupComponent
  ],
  templateUrl: './contracts-tab.component.html',
  styleUrl: './contracts-tab.component.css'
})
export class ContractsTabComponent implements OnInit, OnChanges {
  @Input() employee: Employee | null = null;
  @ViewChild('addForm') addForm: ContractFormModalComponent | undefined;
  private employeeService = inject(EmployeeService);

  @Output() upcomingContractIdChange = new EventEmitter<number | null>();
  private upcomingContractId: number | null = null;

  @Output() contractsDataUpdated = new EventEmitter<void>();
  // private upcomingContract: number | null = null;

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
  selectedForDropdown: Contract | null = null;
  contractHistory: ContractHistory[] = [];
  isLoadingHistory: boolean = false; // Loading state for contract history
  contractTerminationData: any = null;
  contractResignationData: any = null;
  isAddModalOpen = false;
  // isOpen = false;
  isEditMode = false;

  isWarningModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalMessage2 = '';

  isDeleteModalOpen = false;
  isDeleting = false;

  constructor() { }

  ngOnInit(): void {
    // Don't load here - let ngOnChanges handle it when employee input is set
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && changes['employee'].currentValue?.id) {
      // Only load if employee ID actually changed to prevent duplicate calls
      const previousId = changes['employee'].previousValue?.id;
      const currentId = changes['employee'].currentValue?.id;
      if (previousId !== currentId) {
        this.loadEmployeeContracts();
      }
    }
  }



  // Load contracts from API
  loadEmployeeContracts(): void {
    if (!this.employee?.id) return;

    this.isLoading = true;
    this.employeeService.getEmployeeContracts(this.employee.id).subscribe({
      next: (response) => {
        this.contractsData = this.mapApiContractsToUI(response.data.list_items);
        this.totalItems = this.contractsData.length;
        this.isLoading = false;

        const activeContract = this.contractsData.find(contract => contract.status === 'Upcoming');
        this.upcomingContractId = activeContract ? activeContract.id : null;
        this.upcomingContractIdChange.emit(this.upcomingContractId);

      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.isLoading = false;
        this.upcomingContractIdChange.emit(null);
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
    this.closeDropdown();
  }

  closeCancelModal(): void {
    this.isCancelModalOpen = false;
    this.selectedContract = null;
  }

  // confirmCancel(): void {
  //   if (this.selectedContract) {
  //     this.isLoading = true;
  //     // Call API to cancel contract
  //     this.employeeService.cancelEmployeeContract({
  //       contract_id: this.selectedContract.id,
  //     }).subscribe({
  //       next: (response) => {
  //         this.isLoading = false;
  //         // Update local data with the response
  //         this.contractsData = this.mapApiContractsToUI(response.data.list_items);
  //         this.totalItems = this.contractsData.length;
  //         this.closeCancelModal();
  //         this.toasterService.showSuccess('Contract cancelled successfully');
  //         // Show success message
  //       },
  //       error: (error) => {
  //         console.error('Error cancelling contract:', error);
  //         // Show error message
  //       }
  //     });
  //   }
  // }

  // Handle cancel from modal
  onContractCancel(contract: Contract): void {
    if (this.isLoading) return;
    this.isLoading = true;
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
        this.isLoading = false;
        this.closeCancelModal();
        this.toasterService.showSuccess('Contract cancelled successfully');
        this.contractsData = this.mapApiContractsToUI(listItems);
        this.totalItems = this.contractsData.length;
        this.loadEmployeeContracts();
        // Show success message
        this.contractsDataUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.closeCancelModal();
        console.error('Error cancelling contract:', error);
        // Show error message
      }

    });
    this.loadEmployeeContracts();
  }

  // Edit contract
  editContract(contract: Contract): void {
    // this.editedContract = contract;
    this.selectedContract = contract;
    this.isAddModalOpen = true;
    this.isEditMode = true;
  }

  // Add new contract
  // addContract(): void {
  //   this.isEditMode = false;
  //   // this.editedContract = null;
  //   this.selectedContract = null;
  //   this.isAddModalOpen = true;
  // }

  get isAddContractDisabled(): boolean {
    if (!this.contractsData || this.contractsData.length === 0) {
      return false;
    }
    const hasOpenContract = this.contractsData.some(contract =>
      (contract.status === 'Active' || contract.status === 'Probation') &&
      (!contract.end_contract)
    );
    return hasOpenContract;
  }


  addContract(): void {
    const hasOpenContract = this.contractsData.some(contract =>
      (contract.status === 'Active' || contract.status === 'Probation' || contract.status === 'Upcoming') &&
      (!contract.end_contract)
    );




    if (hasOpenContract) {
      this.modalTitle = 'Action Not Allowed';
      if (this.contractsData.some(contract => contract.status === 'Active')) {
        this.modalMessage = 'You cannot create a new contract while there is an active contract with an indefinite period (No End Date).';
      } this.modalMessage2 = 'Please terminate or add an end date to the current contract first.';
      if (this.contractsData.some(contract => contract.status === 'Upcoming')) {
        this.modalMessage = 'You cannot create a new contract while there is an upcoming contract with an indefinite period (No End Date).';
        this.modalMessage2 = 'Please terminate or add an end date to this upcoming contract first.';
      }
      // this.modalMessage = 'You cannot create a new contract while there is an active contract with an indefinite period (No End Date).';
      // this.modalMessage2 = 'Please terminate or add an end date to the current contract first.';
      this.isWarningModalOpen = true;
      return;
    }
    this.isEditMode = false;
    this.selectedContract = null;
    this.isAddModalOpen = true;
  }

  closeWarningModal(): void {
    this.isWarningModalOpen = false;
  }

  // Close add/edit contract overlay
  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.isAddModalOpen = false;
    this.isEditMode = false;

  }

  // Save contract (add or edit) - called from modal
  onContractSave(contractData: any): void {
    if (this.isLoading) return;
    this.isLoading = true;
    if (this.isEditMode && contractData) {
      // const contractId = contractData.contractId || this.editedContract?.id;
      const contractId = contractData.contractId || this.selectedContract?.id;
      // Adjust existing contract via API
      // Build payload only with defined values, use original contract values if new values are undefined
      const payload: any = {
        contract_id: contractId,
        adjustment_type: contractData.adjustmentType
      };

      // Only include salary if it's defined
      if (contractData.salary !== undefined && contractData.salary !== null) {
        payload.salary = contractData.salary;
      }

      // Only include start_contract if it's defined
      if (contractData.startDate !== undefined && contractData.startDate !== null && contractData.startDate !== '') {
        payload.start_contract = contractData.startDate;
      }

      // Only include end_contract if it's defined (can be null if no end date)
      if (contractData.endDate !== undefined) {
        payload.end_contract = contractData.endDate || null;
      }

      // Only include notice_period if it's defined
      if (contractData.noticePeriod !== undefined && contractData.noticePeriod !== null) {
        payload.notice_period = contractData.noticePeriod;
      }

      this.employeeService.adjustEmployeeContractAdjustment(payload).pipe(
        finalize(() => {
          this.isLoading = false;
          this.isAddModalOpen = false;
        })
      ).subscribe({
        next: () => {
          // this.isLoading = false;
          this.toasterService.showSuccess('Contract adjusted successfully');
          this.closeAddModal();
          // Emit event to parent - parent will handle refreshing both employee data and contracts
          this.contractsDataUpdated.emit();
        },
        error: (error) => {
          console.error('Error adjusting contract:', error);
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

      const payload: any = {
        employee_id: this.employee.id,
        contract_type: 1, // Default contract type
      };

      // Only include fields that are defined
      if (contractData.startDate !== undefined && contractData.startDate !== null && contractData.startDate !== '') {
        payload.start_contract = contractData.startDate;
      }

      // end_contract can be null if no end date
      if (contractData.endDate !== undefined) {
        payload.end_contract = contractData.endDate || null;
      }

      if (contractData.salary !== undefined && contractData.salary !== null) {
        payload.salary = contractData.salary;
      }

      if (contractData.notice_period !== undefined && contractData.notice_period !== null) {
        payload.notice_period = contractData.notice_period;
      } else if (contractData.noticePeriod !== undefined && contractData.noticePeriod !== null) {
        payload.notice_period = contractData.noticePeriod;
      }

      this.employeeService.createEmployeeContract(payload).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.isLoading = false;
          // Reload contracts to get updated list
          this.toasterService.showSuccess('Contract created successfully');
          this.closeAddModal();
          // Emit event to parent - parent will handle refreshing both employee data and contracts
          this.contractsDataUpdated.emit();
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
    this.isLoadingHistory = true;
    this.employeeService.getEmployeeContractAdjustments(contractId).subscribe({
      next: response => {
        const adjustments = response.data.list_items;
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
        this.isLoadingHistory = false;
      },
      error: error => {
        console.error('Error loading contract history:', error);
        this.contractHistory = [];
        this.isLoadingHistory = false;
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

    const payload: any = {
      contract_id: data.contract.id
    };

    // Only include fields that are defined
    if (data.terminationData.lastDay !== undefined && data.terminationData.lastDay !== null && data.terminationData.lastDay !== '') {
      payload.last_date = data.terminationData.lastDay;
    }

    if (data.terminationData.reason !== undefined && data.terminationData.reason !== null && data.terminationData.reason.trim() !== '') {
      payload.reason = data.terminationData.reason.trim();
    }

    this.employeeService.terminateEmployeeContract(payload).subscribe({
      next: response => {
        const contractIndex = this.contractsData.findIndex(c => c.id === data.contract.id);
        if (contractIndex !== -1) {
          this.contractsData[contractIndex].status = 'Terminate';
          this.contractsData[contractIndex].terminationData = data.terminationData;
        }

        this.toasterService.showSuccess('contract terminated successfully');
        this.loadEmployeeContracts();

        // Emit event to parent component to refresh entire employee data
        this.contractsDataUpdated.emit();
      },
      error: error => {
        console.error('Error terminating contract:', error);
      }
    });
  }


  openResignModal(contract: Contract) {
    this.selectedContract = contract;
    this.isResignModalOpen = true;
  }


  closeResignModal(): void {
    this.isResignModalOpen = false;
    this.selectedForDropdown = null;
  }

  onContractResign(data: { contract: Contract, resignationData: any }): void {
    // TODO: Call API to process resignation
    // this.employeeService.resignEmployeeContract(data.contract.id, data.resignationData).subscribe({
    // For now, just update local data
    if (!data?.contract?.id) return;

    const payload: any = {
      contract_id: data.contract.id
    };

    // Only include fields that are defined
    if (data.resignationData.lastDay !== undefined && data.resignationData.lastDay !== null && data.resignationData.lastDay !== '') {
      payload.last_date = data.resignationData.lastDay;
    }

    if (data.resignationData.resignDate !== undefined && data.resignationData.resignDate !== null && data.resignationData.resignDate !== '') {
      payload.resign_date = data.resignationData.resignDate;
    }

    if (data.resignationData.reason !== undefined && data.resignationData.reason !== null && data.resignationData.reason.trim() !== '') {
      payload.reason = data.resignationData.reason.trim();
    }

    this.employeeService.resignEmployeeContract(payload).subscribe({
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

        this.toasterService.showSuccess('contract resignation processed successfully');
        this.loadEmployeeContracts();

        // Emit event to parent component to refresh entire employee data
        this.contractsDataUpdated.emit();
      },
      error: error => {
        console.error('Error processing contract resignation:', error);
      }
    });
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
    if (this.selectedForDropdown?.id === contract.id) {
      this.selectedForDropdown = null;
    } else {
      this.selectedForDropdown = contract;
    }
  }

  closeDropdown(): void {
    this.selectedForDropdown = null;
  }

  openDeleteModal(contract: Contract): void {
    this.selectedContract = contract;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedContract = null;
  }

  confirmDeleteContract(): void {
    if (!this.selectedContract || this.isDeleting) return;
    this.isDeleting = true;
    this.employeeService.deleteContract(this.selectedContract.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.toasterService.showSuccess('Contract deleted successfully');
        this.loadEmployeeContracts();
        this.contractsDataUpdated.emit();
      },
      error: (err) => {
        this.isDeleting = false;
        this.closeDeleteModal();
        console.error('Error deleting contract:', err);
        this.toasterService.showError(err?.error?.details ?? 'Failed to delete contract');
      }
    });
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
    if (this.isAddModalOpen || this.isHistoryModalOpen || this.isCancelModalOpen || this.isTerminateModalOpen || this.isResignModalOpen || this.isTerminatedViewModalOpen || this.isResignedViewModalOpen || this.isDeleteModalOpen) {
      return;
    }

    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.selectedForDropdown = null;
      this.closeDropdown();
    }
  }
}
