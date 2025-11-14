import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { HttpEventType } from '@angular/common/http';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { Employee, Subscription } from '../../../../core/interfaces/employee';
import { TableComponent } from '../../../shared/table/table.component';

// Import tab components
import { AttendanceTabComponent } from './tabs/attendance-tab/attendance-tab.component';
import { RequestsTabComponent } from './tabs/requests-tab/requests-tab.component';
import { DocumentsTabComponent } from './tabs/documents-tab/documents-tab.component';
import { ContractsTabComponent } from './tabs/contracts-tab/contracts-tab.component';
import { LeaveBalanceTabComponent } from './tabs/leave-balance-tab/leave-balance-tab.component';
import { CustomInfoComponent } from './tabs/custom-info-tab/custom-info.component';
import { CustomFieldsService } from 'app/core/services/personnel/custom-fields/custom-fields.service';
import { CustomFieldValueItem, CustomFieldValuesParams, UpdateCustomValueRequest, UpdateFieldRequest } from 'app/core/models/custom-field';



@Component({
  selector: 'app-view-employee',
  imports: [
    PageHeaderComponent,
    CommonModule,
    RouterLink,
    PopupComponent,
    AttendanceTabComponent,
    RequestsTabComponent,
    DocumentsTabComponent,
    ContractsTabComponent,
    LeaveBalanceTabComponent,
    CustomInfoComponent,
    TableComponent
  ],
  templateUrl: './view-employee.component.html',
  styleUrl: './view-employee.component.css'
})
export class ViewEmployeeComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private route = inject(ActivatedRoute);
  private toasterMessageService = inject(ToasterMessageService);
  private customFieldsService = inject(CustomFieldsService);

  employee: Employee | null = null;
  subscription: Subscription | null = null;
  loading = false;
  employeeId: number = 0;
  isLoading = false;
  customFieldValues: CustomFieldValueItem[] = [];
  readonly app_name = 'personnel';
  
  // Contact Info collapse state
  contactInfoExpanded = false;

  toggleContactInfo(): void {
    this.contactInfoExpanded = !this.contactInfoExpanded;
  }

  hasAdditionalContactInfo(): boolean {
    if (!this.employee) return false;
    
    // Check if there are custom fields beyond the always-visible ones
    const hasCustomFields = this.customFieldValues.some(
      item => item.custom_field.pinned === true && item.value.value
    );
    
    return hasCustomFields;
  }

  // Device Info collapse state
  deviceInfoExpanded = false;

  toggleDeviceInfo(): void {
    this.deviceInfoExpanded = !this.deviceInfoExpanded;
  }


  // Tab management
  currentTab: 'attendance' | 'requests' | 'documents' | 'contracts' | 'leave-balance' | 'custom-info' | 'devices' = 'attendance';
  devices: any[] = [];
  devicesLoading = false;
  devicesLoaded = false;
  devicesTotal = 0;
  devicesAttempted = false;
  devicesPage = 1;
  devicesPerPage = 10;
  devicesTotalPages = 1;

  // Documents checklist
  documentsRequired: Array<{
    name: string;
    key: string;
    uploaded: boolean;
    url?: string;
    id?: number;
    uploadDate?: string;
    fileName?: string;
    size?: number;
    fileExt?: string;
    fileType?: string;
    isLoading?: boolean;
    isDeleteModalOpen?: boolean;
  }> = [
      { name: 'CV', key: 'cv', uploaded: false },
      { name: 'ID Front', key: 'id_front', uploaded: false },
      { name: 'ID Back', key: 'id_back', uploaded: false },
      { name: 'Driver License', key: 'driver_license', uploaded: false },
      { name: '101 Medical File', key: '101_medical_file', uploaded: false },
      { name: 'Print Insurance', key: 'print_insurance', uploaded: false },
      { name: 'Background Check', key: 'background_check', uploaded: false }
    ];

  // Load existing documents for employee
  loadEmployeeDocuments(): void {
    if (!this.employee) return;
    this.employeeService.getEmployeeDocuments(this.employee.id).subscribe({
      next: (res) => {
        const items = res.data.list_items || [];
        items.forEach((item: any) => {
          const doc = this.documentsRequired.find(d => d.key === item.name);
          if (doc) {
            doc.uploaded = true;
            doc.url = item.document_url;
            doc.id = item.id;
            doc.uploadDate = item.created_at;
            doc.fileName = item.info?.file_name;
            doc.size = item.info?.file_size_kb;
            doc.fileExt = item.info?.file_ext;
            doc.fileType = item.info?.file_type;
          }
        });
      },
      error: (error) => console.error('Error loading documents', error)
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.employeeId = +params['id'];
      if (this.employeeId) {
        this.loadEmployeeData();
      }
    });
    this.loadCustomValues();
  }

  loadEmployeeData(): void {
    this.loading = true;
    this.devicesLoaded = false;
    this.devicesAttempted = false;
    this.devicesPage = 1;
    this.devicesPerPage = 10;
    this.devicesTotalPages = 1;
    this.devices = [];
    this.devicesTotal = 0;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (response) => {
        this.employee = response.data.object_info;
        // fetch documents
        this.loadEmployeeDocuments();
        this.subscription = response.data.subscription;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading employee:', error);
        this.loading = false;
      }
    });
  }

  loadCustomValues(): void {
    this.isLoading = true;
    const modelName = 'employees';
    const objectId = this.route.snapshot.paramMap.get('id');

    if (!modelName || !objectId) {
      console.error('Could not load custom field values');
      this.isLoading = false;
      return;
    }

    const params: CustomFieldValuesParams = {
      app_name: this.app_name,
      model_name: modelName,
      object_id: objectId,
    };

    this.customFieldsService.getCustomFieldValues(params, 1, 100).subscribe({
      next: (response) => {
        this.customFieldValues = response.data.list_items;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }



  handleValueUpdate(payload: UpdateCustomValueRequest): void {
    this.isLoading = true;
    this.customFieldsService.updateCustomFieldValue(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toasterMessageService.showSuccess('Value updated successfully!');
        const updatedValueId = payload.request_data.id;
        const newValue = payload.request_data.value;
        const itemToUpdate = this.customFieldValues.find(item => item.id === updatedValueId);

        if (itemToUpdate) {
          itemToUpdate.value.value = newValue;
        }
      },
      error: () => {
        this.isLoading = false;
        this.toasterMessageService.showError('Update failed');
      }
    });
  }



  handleFieldDelete(payload: UpdateFieldRequest): void {
    this.isLoading = true;
    this.customFieldsService.deleteCustomFieldValue(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.loadCustomValues();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // Legacy property for backward compatibility with template
  get employeeData() {
    if (!this.employee) {
      return {
        id: 0,
        name: "",
        employeeStatus: "",
        accountStatus: "inactive" as 'active' | 'inactive' | 'pending' | 'disabled',
        jobTitle: "",
        branch: "",
        joinDate: ""
      };
    }
    return {
      id: this.employee.id,
      name: this.employee.contact_info.name,
      employeeStatus: this.employee.employee_status,
      accountStatus: this.getAccountStatus(this.employee.employee_active),
      jobTitle: this.employee.job_info.job_title.name,
      branch: this.employee.job_info.branch.name,
      joinDate: this.employee.job_info.start_contract
    };
  }

  // Helper method to convert string employee_active to account status
  private getAccountStatus(employeeActive: string): 'active' | 'inactive' | 'pending' | 'disabled' {
    switch (employeeActive?.toLowerCase()) {
      case 'active':
        return 'active';
      case 'pending':
        return 'pending';
      case 'disabled':
        return 'disabled';
      case 'inactive':
      default:
        return 'inactive';
    }
  }

  // Check if employee is active
  get isEmployeeActive(): boolean {
    return this.employee?.employee_active?.toLowerCase() === 'active';
  }

  // Check if employee is pending
  get isEmployeePending(): boolean {
    return this.employee?.employee_active?.toLowerCase() === 'pending';
  }

  // Check if employee is disabled
  get isEmployeeDisabled(): boolean {
    return this.employee?.employee_active?.toLowerCase() === 'disabled';
  }

  // Check if employee is inactive
  get isEmployeeInactive(): boolean {
    const status = this.employee?.employee_active?.toLowerCase();
    return status === 'inactive' || !status;
  }

  // Determine employee status based on contract dates and status
  private getEmployeeStatus(employee: Employee): string {
    const today = new Date();
    const startDate = new Date(employee.job_info.start_contract);
    const daysDiff = (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

    if (daysDiff < 0) {
      return 'New Joiner'; // Contract hasn't started yet
    } else if (daysDiff <= 90) {
      return 'New Employee'; // Within first 90 days
    } else {
      return 'Employed'; // More than 90 days
    }
  }

  // Tab management method
  setCurrentTab(tab: 'attendance' | 'requests' | 'documents' | 'contracts' | 'leave-balance' | 'custom-info' | 'devices'): void {
    if (tab === 'devices') {
      this.loadEmployeeDevices(!this.devicesAttempted);
    }
    this.currentTab = tab;
  }

  loadEmployeeDevices(force = false, page: number = this.devicesPage, perPage: number = this.devicesPerPage): void {
    if (!this.employeeId) {
      return;
    }

    if (this.devicesLoading) {
      return;
    }

    const isSameQuery = page === this.devicesPage && perPage === this.devicesPerPage;
    if (!force && this.devicesLoaded && isSameQuery) {
      return;
    }

    this.devicesLoading = true;
    this.devicesAttempted = true;

    this.employeeService.getEmployeeDevices(this.employeeId, page, perPage).subscribe({
      next: (response) => {
        const items = response.data?.list_items ?? [];
        this.devices = items;
        this.devicesTotal = response.data?.total_items ?? items.length;
        this.devicesPage = response.data?.page ?? page;
        this.devicesPerPage = perPage;
        this.devicesTotalPages = response.data?.total_pages ?? Math.max(1, Math.ceil(this.devicesTotal / perPage || 1));
        this.devicesLoaded = true;
        this.devicesLoading = false;
      },
      error: (error) => {
        console.error('Error loading employee devices:', error);
        this.devicesLoading = false;
      }
    });
  }

  onDevicesPageChange(newPage: number): void {
    if (newPage === this.devicesPage && this.devicesLoaded) {
      return;
    }
    this.devicesLoaded = false;
    this.loadEmployeeDevices(true, newPage, this.devicesPerPage);
  }

  onDevicesPerPageChange(perPage: number): void {
    if (perPage === this.devicesPerPage) {
      return;
    }
    this.devicesPerPage = perPage;
    this.devicesPage = 1;
    this.devicesLoaded = false;
    this.loadEmployeeDevices(true, this.devicesPage, this.devicesPerPage);
  }

  // popups
  deactivateOpen = false;
  activateOpen = false;
  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }

  // Action loading flags
  resetLoading = false;
  activateLoading = false;
  deactivateLoading = false;
  clearSessionLoading = false;
  clearSessionOpen = false;

  confirmDeactivate() {
    this.deactivateLoading = true;
    this.deactivateOpen = false;

    if (this.employee) {
      this.employeeService.updateEmployeeStatus(this.employee.id, false).subscribe({
        next: (response: any) => {
          this.toasterMessageService.showSuccess('Employee deactivated successfully');
          if (this.employee) this.employee.employee_active = 'Disabled';
          this.deactivateLoading = false;
        },
        error: (error: any) => {
          console.error('Error deactivating employee:', error);
          this.toasterMessageService.showError('Error deactivating employee');
          this.deactivateLoading = false;
        }
      });
    }
  }
  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }
  confirmActivate() {
    this.activateLoading = true;
    this.activateOpen = false;

    if (this.employee) {
      this.employeeService.updateEmployeeStatus(this.employee.id, true).subscribe({
        next: (response: any) => {
          this.toasterMessageService.showSuccess('Employee activated successfully');
          if (this.employee) this.employee.employee_active = 'Active';
          this.activateLoading = false;
        },
        error: (error: any) => {
          console.error('Error activating employee:', error);
          this.toasterMessageService.showError('Error activating employee');
          this.activateLoading = false;
        }
      });
    }
  }

  // Resend activation link to employee email
  resendLoading = false;
  resendActiveLink(): void {
    if (this.employee) {
      this.resendLoading = true;
      this.employeeService.resendActiveLink(this.employee.id).subscribe({
        next: (response) => {
          this.toasterMessageService.showSuccess('Activation link resent successfully');
          this.resendLoading = false;
        },
        error: (error) => {
          console.error('Error resending active link:', error);
          this.resendLoading = false;
        }
      });
    }
  }

  // Reset password for inactive employee email
  resetPassword(): void {
    if (this.employee) {
      this.resetLoading = true;
      this.employeeService.resetPassword(this.employee.id).subscribe({
        next: (response) => {
          this.toasterMessageService.showSuccess('Password reset successfully');
          this.resetLoading = false;
        },
        error: (error) => {
          console.error('Error resetting password:', error);
          this.toasterMessageService.showError('Error resetting password');
          this.resetLoading = false;
        }
      });
    }
  }

  // Helper method to check subscription permissions
  hasEmployeePermission(action: string): boolean {
    if (!this.subscription) return false;

    const personnelFeature = this.subscription.features.find(f => f.main.name === 'Personnel');
    if (!personnelFeature || !personnelFeature.is_support) return false;

    const employeeSub = personnelFeature.sub_list.find(s => s.sub.name === 'Employees');
    if (!employeeSub || !employeeSub.is_support) return false;

    const allowedAction = employeeSub.allowed_actions.find(a => a.name === action);
    return allowedAction ? allowedAction.status : false;
  }

  // Helper method to get remaining action count
  getEmployeeActionCount(action: string): number {
    if (!this.subscription) return 0;

    const personnelFeature = this.subscription.features.find(f => f.main.name === 'Personnel');
    if (!personnelFeature) return 0;

    const employeeSub = personnelFeature.sub_list.find(s => s.sub.name === 'Employees');
    if (!employeeSub) return 0;

    const allowedAction = employeeSub.allowed_actions.find(a => a.name === action);
    return allowedAction ? allowedAction.count : 0;
  }

  // Helper method to check if action has infinite usage
  hasInfiniteEmployeePermission(action: string): boolean {
    if (!this.subscription) return false;

    const personnelFeature = this.subscription.features.find(f => f.main.name === 'Personnel');
    if (!personnelFeature) return false;

    const employeeSub = personnelFeature.sub_list.find(s => s.sub.name === 'Employees');
    if (!employeeSub) return false;

    const allowedAction = employeeSub.allowed_actions.find(a => a.name === action);
    return allowedAction ? allowedAction.infinity : false;
  }

  formatDeviceDate(dateString?: string | null): string {
    if (!dateString) {
      return 'N/A';
    }
    const normalized = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (isNaN(parsed.getTime())) {
      return 'N/A';
    }
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openClearSession(): void {
    if (!this.employee?.device) {
      return;
    }
    this.clearSessionOpen = true;
  }

  closeClearSession(): void {
    this.clearSessionOpen = false;
  }

  confirmClearSession(): void {
    if (!this.employee?.device) {
      return;
    }
    this.clearSessionLoading = true;
    this.clearSessionOpen = false;
    this.employeeService.clearEmployeeSession(this.employee.device.id, this.employee.id).subscribe({
      next: () => {
        this.toasterMessageService.showSuccess('Session cleared successfully');
        this.clearSessionLoading = false;
        this.loadEmployeeData();
      },
      error: (error) => {
        console.error('Error clearing session', error);
        this.toasterMessageService.showError('Error clearing session');
        this.clearSessionLoading = false;
      }
    });
  }

  // File upload handling for documents
  selectedDocumentKey: string | null = null;
  // Track upload progress per document
  uploadProgress: { [key: string]: number } = {};

  onUpload(docKey: string, fileInput: HTMLInputElement): void {
    this.selectedDocumentKey = docKey;
    fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.selectedDocumentKey && this.employee) {
      const file = input.files[0];
      const docKey = this.selectedDocumentKey;
      this.employeeService.uploadEmployeeDocument(this.employee.id, docKey, file).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const percentDone = Math.round(100 * (event.loaded / (event.total || 1)));
          this.uploadProgress[docKey] = percentDone;
        } else if (event.type === HttpEventType.Response) {
          // upload complete
          const doc = this.documentsRequired.find(d => d.key === docKey);
          if (doc) {
            doc.uploaded = true;
          }
          delete this.uploadProgress[docKey];
          this.loadEmployeeDocuments();
          // this.toasterMessageService.showSuccess(`${docKey} uploaded successfully`);

        }
      }, error => {
        console.error('Error uploading document', error);
        delete this.uploadProgress[docKey];
        // this.toasterMessageService.showError(`Error uploading ${docKey}`);
      });
    }
    // reset input and selected key
    input.value = '';
    this.selectedDocumentKey = null;
  }

  /** Delete an uploaded document */
  // onDelete(docKey: string): void {
  //   this.isLoading = true;
  //   const doc = this.documentsRequired.find(d => d.key === docKey);
  //   if (doc?.id) {
  //     this.employeeService.deleteEmployeeDocument(doc.id, this.employee!.id).subscribe({
  //       next: () => {
  //         doc.uploaded = false;
  //         delete doc.url;
  //         delete doc.id;
  //         // this.toasterMessageService.showSuccess(`${docKey} deleted successfully`);
  //       },
  //       error: (error) => {
  //         console.error('Error deleting document', error);
  //         // this.toasterMessageService.showError(`Error deleting ${docKey}`);
  //       }
  //     });
  //   }
  // }

  onDelete(docKey: string): void {
    const doc = this.documentsRequired.find(d => d.key === docKey);

    if (!doc || !doc.id || doc.isLoading) {
      if (!doc?.id) {
        console.warn('Cannot delete document, missing ID.');
      }
      return;
    }

    doc.isLoading = true;

    this.documentsRequired = [...this.documentsRequired];

    this.employeeService.deleteEmployeeDocument(doc.id, this.employee!.id).subscribe({
      next: () => {
        doc.uploaded = false;
        delete doc.url;
        delete doc.id;
        doc.isLoading = false;
        doc.isDeleteModalOpen = false;

        this.documentsRequired = [...this.documentsRequired];

        // this.toasterMessageService.showSuccess(`${docKey} deleted successfully`);
      },
      error: (error) => {
        console.error('Error deleting document', error);

        doc.isLoading = false;
        doc.isDeleteModalOpen = false;

        this.documentsRequired = [...this.documentsRequired];

        // this.toasterMessageService.showError(`Error deleting ${docKey}`);
      }
    });
  }

  // Message for deactivate popup
  get deactivateMessage(): string {
    return `Are you sure you want to deactivate the Employee "${this.employee?.contact_info?.name || ''}"?`;
  }

  // Message for activate popup
  get activateMessage(): string {
    return `Are you sure you want to Activate the Employee "${this.employee?.contact_info?.name || ''}"?`;
  }
}
