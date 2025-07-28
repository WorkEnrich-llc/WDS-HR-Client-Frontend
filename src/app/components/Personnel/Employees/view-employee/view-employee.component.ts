import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { HttpEventType } from '@angular/common/http';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { Employee, Subscription } from '../../../../core/interfaces/employee';

// Import tab components
import { AttendanceTabComponent } from './tabs/attendance-tab/attendance-tab.component';
import { RequestsTabComponent } from './tabs/requests-tab/requests-tab.component';
import { DocumentsTabComponent } from './tabs/documents-tab/documents-tab.component';
import { ContractsTabComponent } from './tabs/contracts-tab/contracts-tab.component';



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
    ContractsTabComponent
  ],
  templateUrl: './view-employee.component.html',
  styleUrl: './view-employee.component.css'
})
export class ViewEmployeeComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private route = inject(ActivatedRoute);
  private toasterMessageService = inject(ToasterMessageService);

  employee: Employee | null = null;
  subscription: Subscription | null = null;
  loading = false;
  employeeId: number = 0;

  // Tab management
  currentTab: 'attendance' | 'requests' | 'documents' | 'contracts' = 'attendance';

  // Documents checklist
  readonly documentsRequired: Array<{ 
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
  }

  loadEmployeeData(): void {
    this.loading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (response) => {
        this.employee = response.data.object_info;
        // fetch documents
        this.loadEmployeeDocuments();
        this.subscription = response.data.subscription;
        this.loading = false;
        console.log('Employee data loaded:', response);
      },
      error: (error) => {
        console.error('Error loading employee:', error);
        this.loading = false;
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
  setCurrentTab(tab: 'attendance' | 'requests' | 'documents' | 'contracts'): void {
    this.currentTab = tab;
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

  confirmDeactivate() {
    this.deactivateOpen = false;

    if (this.employee) {
      this.employeeService.updateEmployeeStatus(this.employee.id, false).subscribe({
        next: (response: any) => {
          console.log('Employee deactivated successfully:', response);
          // Update local employee status
          if (this.employee) {
            this.employee.employee_active = 'Disabled';
          }
        },
        error: (error: any) => {
          console.error('Error deactivating employee:', error);
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
    this.activateOpen = false;

    if (this.employee) {
      this.employeeService.updateEmployeeStatus(this.employee.id, true).subscribe({
        next: (response: any) => {
          console.log('Employee activated successfully:', response);
          // Update local employee status
          if (this.employee) {
            this.employee.employee_active = 'Active';
          }
        },
        error: (error: any) => {
          console.error('Error activating employee:', error);
        }
      });
    }
  }

  // Resend activation link to employee email
  resendActiveLink(): void {
    if (this.employee) {
      this.employeeService.resendActiveLink(this.employee.id).subscribe({
        next: (response) => {
          this.toasterMessageService.sendMessage('Activation link resent successfully');
          console.log('Resend active link successfully:', response);
        },
        error: (error) => {
          console.error('Error resending active link:', error);
        }
      });
    }
  }

  // Reset password for inactive employee email
  resetPassword(): void {
    if (this.employee) {
      this.employeeService.resetPassword(this.employee.id).subscribe({
        next: (response) => {
          console.log('Password reset successfully:', response);
        },
        error: (error) => {
          console.error('Error resetting password:', error);
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
          this.toasterMessageService.sendMessage(`${docKey} uploaded successfully`);
        }
      }, error => {
        console.error('Error uploading document', error);
        delete this.uploadProgress[docKey];
        this.toasterMessageService.sendMessage(`Error uploading ${docKey}`);
      });
    }
    // reset input and selected key
    input.value = '';
    this.selectedDocumentKey = null;
  }

  /** Delete an uploaded document */
  onDelete(docKey: string): void {
    const doc = this.documentsRequired.find(d => d.key === docKey);
    if (doc?.id) {
      this.employeeService.deleteEmployeeDocument(doc.id, this.employee!.id).subscribe({
        next: () => {
          doc.uploaded = false;
          delete doc.url;
          delete doc.id;
          this.toasterMessageService.sendMessage(`${docKey} deleted successfully`);
        },
        error: (error) => {
          console.error('Error deleting document', error);
          this.toasterMessageService.sendMessage(`Error deleting ${docKey}`);
        }
      });
    }
  }
}
