
import { Component, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { PayrollRunService } from 'app/core/services/payroll/payroll-run.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-view-payroll-runs',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, PopupComponent, DatePipe],
  providers: [DatePipe],
  templateUrl: './view-payroll-runs.component.html',
  styleUrl: './view-payroll-runs.component.css'
})
export class ViewPayrollRunsComponent implements OnDestroy {
  private subscriptions: Subscription[] = [];
  fetchEmployees() {
    this.loadData = true;
    const sub = this.payrollRunService.getAllSheets(this.currentPage, this.itemsPerPage).subscribe({
      next: (data) => {
        this.allSheetsData = data;
        if (data && data.data && Array.isArray(data.data.list_items)) {
          this.employees = data.data.list_items.map((item: any, idx: number) => ({
            id: item.id,
            name: item.name,
            created_at: item.created_at,
            updated_at: item.updated_at,
            basicSalary: item.basicSalary ?? 0,
            insurance: item.insurance ?? 0,
            absence: item.absence ?? 0,
            damages: item.damages ?? 0,
            bonus: item.bonus ?? 0,
            profitShare: item.profitShare ?? 0,
            overtime: item.overtime ?? 0,
            currency: item.currency ?? 'EGP'
          }));
        } else {
          this.employees = [];
        }
        this.loadData = false;
      },
      error: () => { this.employees = []; this.loadData = false; }
    });
    this.subscriptions.push(sub);
  }
  @ViewChild('importBox') importBox!: OverlayFilterBoxComponent;

  closeOverlays(): void {
    this.importBox?.closeOverlay();
  }
  payRollRunData: any = null;
  allSheetsData: any = null;
  relatedSheetId: string | null = null;
  relatedSheetName: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private payrollRunService: PayrollRunService, private toasterMessageService: ToasterMessageService) { }

  employees: any[] = [];
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  loadData: boolean = false;
  selectedSheetId: string | null = null;
  payRollRun = {
    id: 2,
    month: 'March 2025',
    cycle: '1 February – 28 February',
    numOfEmp: 93,
    Status: 'Pending'
  };
  selectedFile: File | null = null;
  payrollRunId: string | null = null;
  isStartingPayroll: boolean = false;
  showConfirmation: boolean = false;
  showValidationError: boolean = false;
  showCreateSheetConfirmation: boolean = false;
  isCreatingSheet: boolean = false;
  showPayrollMenu: boolean = false;
  showRevertToDraftConfirmation: boolean = false;
  isRevertingToDraft: boolean = false;
  showRestartRunConfirmation: boolean = false;
  isRestartingRun: boolean = false;
  showPublishConfirmation: boolean = false;
  isPublishing: boolean = false;

  ngOnInit(): void {
    this.loadData = true;
    const id = this.route.snapshot.paramMap.get('id');
    this.payrollRunId = id;
    if (id) {
      const sub = this.payrollRunService.getPayrollRunById(id).subscribe({
        next: (data) => {
          this.payRollRunData = data;
          // Store the related sheet ID and name if it exists
          this.relatedSheetId = data?.data?.object_info?.related?.id || null;
          this.relatedSheetName = data?.data?.object_info?.related?.name || null;
          // Auto-select related sheet if available
          if (this.relatedSheetId) {
            this.selectedSheetId = this.relatedSheetId;
          }
          // Only fetch payroll sheets if status is Draft and run_cycle is not Off Cycle (id !== 2)
          if (data?.data?.object_info?.status === 'Draft' && data?.data?.object_info?.run_cycle?.id !== 2) {
            this.fetchEmployees();
          } else {
            this.loadData = false;
          }
        },
        error: () => {
          this.loadData = false;
        }
      });
      this.subscriptions.push(sub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.employees = this.employees.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (this.sortDirection === 'asc') {
        return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
      } else {
        return nameA < nameB ? 1 : (nameA > nameB ? -1 : 0);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedExtensions = ['xls', 'xlsx'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && allowedExtensions.includes(extension)) {
        this.selectedFile = file;
      } else {
        alert('Only .xls or .xlsx files are allowed.');
        input.value = '';
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchEmployees();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.fetchEmployees();
  }

  onStartPayrollClick(): void {
    // Check if it's an off-cycle payroll without a sheet
    const isOffCycle = this.payRollRunData?.data?.object_info?.run_cycle?.id === 2;
    const hasNoSheet = !this.selectedSheetId && !this.relatedSheetId;
    
    if (isOffCycle && hasNoSheet) {
      this.toasterMessageService.showError('Please create a sheet before starting the payroll run.');
      return;
    }

    if (!this.selectedSheetId && !this.relatedSheetId) {
      this.showValidationError = true;
      return;
    }
    
    this.showValidationError = false;
    this.showConfirmation = true;
  }

  confirmStartPayroll(): void {
    if (!this.selectedSheetId || !this.payrollRunId) {
      return;
    }

    this.isStartingPayroll = true;
    const formData = new FormData();
    formData.append('run_id', this.payrollRunId);
    // Use the related sheet ID if available, otherwise use the selected sheet ID
    const sheetId = this.relatedSheetId || this.selectedSheetId;
    formData.append('sheet_id', sheetId);

    const sub = this.payrollRunService.startPayrollRun(formData).subscribe({
      next: (data) => {
        this.showConfirmation = false;
        this.isStartingPayroll = false;
        // Refresh the payroll run details
        this.refreshPayrollRunDetails();
      },
      error: (error) => {
        this.isStartingPayroll = false;
      }
    });
    this.subscriptions.push(sub);
  }

  cancelStartPayroll(): void {
    this.showConfirmation = false;
  }

  getSelectedSheetName(): string {
    if (!this.selectedSheetId) {
      return 'Unknown';
    }
    // If the selected sheet is the related sheet, return the related sheet name
    if (this.selectedSheetId === this.relatedSheetId && this.relatedSheetName) {
      return this.relatedSheetName;
    }
    // Otherwise, search in the employees (sheets) array
    const selectedSheet = this.employees.find(e => e.id === this.selectedSheetId);
    return selectedSheet?.name || 'Unknown';
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Processed': 'badge-probation',
      'Completed': 'badge-success',
      'Complete': 'badge-success',
      'In Process': 'badge-newjoiner',
      'Draft': 'badge-gray',
      'Pending': 'badge-warning',
      'Failed': 'badge-danger'
    };
    return statusMap[status] || 'badge-gray';
  }

  getDisplayTableHeaders(): any[] {
    const displayTable = this.payRollRunData?.data?.object_info?.display_table;
    if (!displayTable || !displayTable.headers) {
      return [];
    }
    return displayTable.headers;
  }

  getDisplayTableRows(): any[] {
    const displayTable = this.payRollRunData?.data?.object_info?.display_table;
    if (!displayTable || !displayTable.rows) {
      return [];
    }
    // Transform rows to include employee info
    return displayTable.rows.map((row: any) => ({
      ...row,
      employee: {
        code: row.code,
        name: row.name
      }
    }));
  }

  onCreateSheetClick(): void {
    this.showCreateSheetConfirmation = true;
  }

  confirmCreateSheet(): void {
    if (!this.payrollRunId || !this.payRollRunData?.data?.object_info?.title) {
      this.toasterMessageService.showError('Unable to create sheet. Missing required information.');
      return;
    }

    this.isCreatingSheet = true;

    // Check if this is an Off-Cycle payroll run (run_cycle.id === 2)
    const isOffCyclePayroll = this.payRollRunData?.data?.object_info?.run_cycle?.id === 2;
    const createSheetCall = isOffCyclePayroll
      ? this.payrollRunService.createOffCycleSheet(this.buildOffCycleSheetFormData())
      : this.payrollRunService.createPayrollSheet(this.buildPayrollSheetFormData());

    const sub = createSheetCall.subscribe({
      next: (data) => {
        this.showCreateSheetConfirmation = false;
        this.isCreatingSheet = false;
        // Refresh the payroll run details and sheets list
        this.refreshPayrollRunDetails();
      },
      error: (error) => {
        this.isCreatingSheet = false;
        this.toasterMessageService.showError('Failed to create sheet. Please try again.');
      }
    });
    this.subscriptions.push(sub);
  }

  cancelCreateSheet(): void {
    this.showCreateSheetConfirmation = false;
  }

  buildOffCycleSheetFormData(): FormData {
    const formData = new FormData();
    formData.append('id', this.payrollRunId || '');
    return formData;
  }

  buildPayrollSheetFormData(): FormData {
    const sheetName = `Sheet | ${this.payRollRunData.data.object_info.title}`;
    const formData = new FormData();
    formData.append('name', sheetName);
    formData.append('type', 'System_File');
    formData.append('file_type', 'payroll_sheet');
    return formData;
  }

  onViewSheetClick(): void {
    const relatedSheetId = this.payRollRunData?.data?.object_info?.related?.id;
    if (relatedSheetId) {
      this.router.navigate(['/cloud/system-file', relatedSheetId]);
    }
  }

  /**
   * Navigate to the sheet view with the provided sheet ID
   */
  viewSheet(sheetId: string): void {
    if (sheetId) {
      this.router.navigate(['/cloud/system-file', sheetId]);
    }
  }

  navigateToEmployeeDetails(employeeId: string | number): void {
    this.router.navigate(['/employees/view-employee', employeeId]);
  }

  navigateToEmployeePayslip(employeeId: string | number): void {
    this.router.navigate(['/payroll-runs/view-employee-payroll', this.payrollRunId, employeeId]);
  }

  togglePayrollMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showPayrollMenu = !this.showPayrollMenu;
  }

  closePayrollMenu(event?: Event): void {
    if (event && (event.target as HTMLElement).closest('.position-relative')) {
      return;
    }
    this.showPayrollMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.position-relative')) {
      this.showPayrollMenu = false;
    }
  }

  onRevertToDraft(): void {
    this.showRevertToDraftConfirmation = true;
    this.showPayrollMenu = false;
  }

  confirmRevertToDraft(): void {
    if (!this.payrollRunId) {
      return;
    }

    this.isRevertingToDraft = true;
    const formData = new FormData();
    formData.append('id', this.payrollRunId);

    const sub = this.payrollRunService.revertToDraft(formData).subscribe({
      next: (data) => {
        this.showRevertToDraftConfirmation = false;
        this.isRevertingToDraft = false;
        this.toasterMessageService.showSuccess('Payroll has been reverted to draft successfully');
        // Refresh the payroll run details
        this.refreshPayrollRunDetails();
      },
      error: (error) => {
        this.showRevertToDraftConfirmation = false;
        this.isRevertingToDraft = false;
        this.toasterMessageService.showError('Failed to revert to draft. Please try again.');
      }
    });
    this.subscriptions.push(sub);
  }

  cancelRevertToDraft(): void {
    this.showRevertToDraftConfirmation = false;
  }

  refreshPayrollRunDetails(): void {
    if (this.payrollRunId) {
      const sub = this.payrollRunService.getPayrollRunById(this.payrollRunId).subscribe({
        next: (data) => {
          this.payRollRunData = data;
          // Store the related sheet ID and name if it exists
          this.relatedSheetId = data?.data?.object_info?.related?.id || null;
          this.relatedSheetName = data?.data?.object_info?.related?.name || null;
          // Auto-select related sheet if available
          if (this.relatedSheetId) {
            this.selectedSheetId = this.relatedSheetId;
          }
          // Only fetch payroll sheets if status is Draft and run_cycle is not Off Cycle (id !== 2)
          if (data?.data?.object_info?.status === 'Draft' && data?.data?.object_info?.run_cycle?.id !== 2) {
            this.fetchEmployees();
          } else {
            this.loadData = false;
          }
        },
        error: () => {
          this.loadData = false;
        }
      });
      this.subscriptions.push(sub);
    }
  }

  onRestartRun(): void {
    this.showRestartRunConfirmation = true;
    this.showPayrollMenu = false;
  }

  confirmRestartRun(): void {
    if (!this.payrollRunId) {
      return;
    }

    this.isRestartingRun = true;
    const formData = new FormData();
    formData.append('id', this.payrollRunId);

    const sub = this.payrollRunService.restartPayrollRun(formData).subscribe({
      next: (data) => {
        this.showRestartRunConfirmation = false;
        this.isRestartingRun = false;
        // Refresh the payroll run details
        this.refreshPayrollRunDetails();
      },
      error: (error) => {
        this.showRestartRunConfirmation = false;
        this.isRestartingRun = false;
        this.toasterMessageService.showError('Failed to restart payroll run. Please try again.');
      }
    });
    this.subscriptions.push(sub);
  }

  cancelRestartRun(): void {
    this.showRestartRunConfirmation = false;
  }

  onPublishClick(): void {
    this.showPublishConfirmation = true;
  }

  confirmPublish(): void {
    if (!this.payrollRunId) {
      return;
    }

    this.isPublishing = true;
    const formData = new FormData();
    formData.append('id', this.payrollRunId);

    const sub = this.payrollRunService.publishPayrollRun(formData).subscribe({
      next: (data) => {
        this.showPublishConfirmation = false;
        this.isPublishing = false;
        this.toasterMessageService.showSuccess('Payroll has been published successfully');
        // Refresh the payroll run details
        this.refreshPayrollRunDetails();
      },
      error: (error) => {
        this.isPublishing = false;
      }
    });
    this.subscriptions.push(sub);
  }

  cancelPublish(): void {
    this.showPublishConfirmation = false;
  }
}
