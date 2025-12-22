import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
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
import { OnboardingChecklistComponent, OnboardingListItem } from 'app/components/shared/onboarding-checklist/onboarding-checklist.component';
import { Contract } from 'app/core/interfaces/contract';



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
    TableComponent,
    OnboardingChecklistComponent
  ],
  templateUrl: './view-employee.component.html',
  styleUrl: './view-employee.component.css'
})
export class ViewEmployeeComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private route = inject(ActivatedRoute);
  private toasterMessageService = inject(ToasterMessageService);
  private customFieldsService = inject(CustomFieldsService);
  private changeDetector = inject(ChangeDetectorRef);
  @ViewChild(ContractsTabComponent) contractsTabComponent?: ContractsTabComponent;
  employee: Employee | null = null;
  subscription: Subscription | null = null;
  loading = false;
  employeeId: number = 0;
  isLoading = false;
  customFieldValues: CustomFieldValueItem[] = [];
  readonly app_name = 'personnel';

  // Onboarding modal state
  isOnboardingModalOpen = false;
  loadingChecklistItemTitle: string | null = null;

  // Contact Info collapse state
  contactInfoExpanded = false;



  contractsList: Contract[] = [];
  firstContractDate: string | null = null;
  lastContractDate: string | null = null;
  employeeDisplayStatus: string = '';

  isNewJoinerView: boolean = false;

  private loadEmployeeContracts(): void {
    if (!this.employeeId) return;
    this.employeeService.getEmployeeContracts(this.employeeId).subscribe({
      next: (response) => {
        const list = response.data.list_items || response.data;
        this.contractsList = list;
        this.calculateDates(list);
        // const currentStatus = this.getEmployeeStatus(this.firstContractDate, this.lastContractDate);
        // this.employeeDisplayStatus = currentStatus;


        this.calculateDates(this.contractsList);
        this.updateEmployeeStatus(this.contractsList);

      },
      error: (error) => {
        console.error('Error loading contracts:', error);
      }
    });
  }

  calculateDates(list: any[]) {
    if (!list || list.length === 0) {
      this.firstContractDate = 'N/A';
      this.lastContractDate = 'N/A';
      return;
    }

    const sorted = [...list].sort((a, b) => new Date(a.start_contract).getTime() - new Date(b.start_contract).getTime());

    this.firstContractDate = sorted[0].start_contract;
    this.lastContractDate = sorted[sorted.length - 1].start_contract;
  }

  // private getEmployeeStatus(firstContractDate: string | null, lastContractStatus: string | null): string {

  //   if (!firstContractDate) return 'N/A';

  //   const inactiveStatuses = ['Terminated', 'Resigned', 'Cancelled'];

  //   if (lastContractStatus && inactiveStatuses.includes(lastContractStatus)) {
  //     return lastContractStatus;
  //   }

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   const startDate = new Date(firstContractDate);
  //   startDate.setHours(0, 0, 0, 0);


  //   if (isNaN(startDate.getTime())) return 'Invalid Date';

  //   if (startDate > today) {
  //     return 'New Joiner';
  //   } else if (startDate.getTime() === today.getTime()) {
  //     return 'Joining Today';
  //   } else {

  //     const diffTime = today.getTime() - startDate.getTime();
  //     const daysDiff = diffTime / (1000 * 3600 * 24);

  //     if (daysDiff <= 90) {
  //       return 'New Employee';
  //     } else {
  //       return 'Employed';
  //     }
  //   }
  // }

  // private getEmployeeStatus(firstContractDate: string | null, lastContractStatus: string | null): string {

  //   if (!firstContractDate) return 'N/A';
  //   const statusToCheck = lastContractStatus ? lastContractStatus.trim() : '';

  //   const inactiveStatuses = ['Terminate', 'Resigned', 'Cancelled', 'Expired'];

  //   if (lastContractStatus && inactiveStatuses.includes(lastContractStatus)) {
  //     return lastContractStatus;
  //   }

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   const startDate = new Date(firstContractDate);
  //   startDate.setHours(0, 0, 0, 0);

  //   if (isNaN(startDate.getTime())) return 'Invalid Date';


  //   if (startDate > today) {
  //     return 'New Joiner';
  //   } else if (startDate.getTime() === today.getTime()) {
  //     return 'Joining Today';
  //   } else {

  //     const diffTime = today.getTime() - startDate.getTime();
  //     const daysDiff = diffTime / (1000 * 3600 * 24);

  //     if (daysDiff <= 90) {
  //       return 'Probation';
  //     } else if (daysDiff <= 365) {
  //       return 'New Employee';
  //     } else {
  //       return 'Employed';
  //     }
  //   }
  // }

  // calculateEmployeeStatus(list: any[]) {
  //   if (!list || list.length === 0) return;

  //   const sortedContracts = [...list].sort((a, b) => {
  //     const dateA = new Date(a.start_contract).getTime();
  //     const dateB = new Date(b.start_contract).getTime();

  //     if (dateA !== dateB) {
  //       return dateA - dateB;
  //     }

  //     const getPriority = (status: string) => {
  //       const s = status ? status.toLowerCase().trim() : '';
  //       if (s === 'terminate' || s === 'terminated') return 2;
  //       if (s === 'resigned') return 2;
  //       if (s === 'expired') return 1;
  //       return 0;
  //     };

  //     return getPriority(a.status) - getPriority(b.status);
  //   });

  //   const firstContract = sortedContracts[0];
  //   const lastContract = sortedContracts[sortedContracts.length - 1];


  //   console.log('Selected Last Contract Status:', lastContract.status);

  //   this.employeeDisplayStatus = this.getEmployeeStatus(
  //     firstContract.start_contract,
  //     lastContract.status
  //   );
  // }

  private updateEmployeeStatus(contracts: any[]) {
    if (!contracts || contracts.length === 0) {
      this.employeeDisplayStatus = 'N/A';
      return;
    }

    const sortedContracts = this.sortContracts(contracts);
    const firstContract = sortedContracts[0];

    const activeContract = contracts.find(c =>
      c.status?.trim().toLowerCase() === 'active'
    );

    if (activeContract) {
      this.employeeDisplayStatus = this.getTimeBasedStatus(firstContract.start_contract);

    } else {
      this.employeeDisplayStatus = this.getLastEffectiveStatus(sortedContracts);
    }

    // console.log('Final Status Displayed:', this.employeeDisplayStatus);
  }

  // calculateEmployeeStatus(contracts: any[]) {
  //   if (!contracts || contracts.length === 0) {
  //     this.employeeDisplayStatus = 'N/A';
  //     return;
  //   }

  //   const sortedContracts = [...contracts].sort((a, b) => {
  //     const dateA = new Date(a.start_contract).getTime();
  //     const dateB = new Date(b.start_contract).getTime();

  //     if (dateA !== dateB) return dateA - dateB;

  //     return a.id - b.id;
  //   });

  //   const firstContract = sortedContracts[0];

  //   const activeContract = contracts.find(c =>
  //     c.status?.trim().toLowerCase() === 'active'
  //   );

  //   if (activeContract) {
  //     this.employeeDisplayStatus = this.getTimeBasedStatus(firstContract.start_contract);

  //   } else {
  //     const lastContract = this.getLastEffectiveContract(sortedContracts);

  //     this.employeeDisplayStatus = lastContract.status;
  //   }
  // }

  private getTimeBasedStatus(startDateString: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(startDateString);
    startDate.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime())) return 'Invalid Date';

    if (startDate > today) {
      return 'New Joiner';
    }

    if (startDate.getTime() === today.getTime()) {
      return 'Joining Today';
    }

    const diffTime = today.getTime() - startDate.getTime();
    const daysDiff = diffTime / (1000 * 3600 * 24);

    if (daysDiff <= 90) {
      return 'Probation';
    } else if (daysDiff <= 365) {
      return 'New Employee';
    } else {
      return 'Employed';
    }
  }

  // private getLastEffectiveContract(sortedContracts: any[]): any {
  //   const reversed = [...sortedContracts].reverse();

  //   const lastContract = reversed[0];
  //   const lastDate = new Date(lastContract.start_contract).getTime();

  //   const sameDateContracts = reversed.filter(c =>
  //     new Date(c.start_contract).getTime() === lastDate
  //   );

  //   if (sameDateContracts.length > 1) {
  //     const priorityStatus = ['Terminate', 'Terminated', 'Resigned', 'Cancelled'];

  //     const criticalContract = sameDateContracts.find(c =>
  //       priorityStatus.some(s => c.status?.trim().toLowerCase().includes(s.toLowerCase()))
  //     );

  //     if (criticalContract) return criticalContract;
  //   }

  //   return lastContract;
  // }

  private getLastEffectiveStatus(sortedContracts: any[]): string {
    const reversed = [...sortedContracts].reverse();

    const lastContract = reversed[0];
    const lastDate = new Date(lastContract.start_contract).getTime();

    const sameDateContracts = reversed.filter(c =>
      new Date(c.start_contract).getTime() === lastDate
    );

    if (sameDateContracts.length > 1) {
      const priorityStatus = ['Terminate', 'Resign', 'Cancelled', 'Expired'];

      const criticalContract = sameDateContracts.find(c =>
        c.status && priorityStatus.some(s => c.status.toLowerCase().includes(s.toLowerCase()))
      );

      if (criticalContract) return criticalContract.status;
    }

    return lastContract.status || 'N/A';
  }

  private sortContracts(contracts: any[]) {
    return [...contracts].sort((a, b) => {
      const dateA = new Date(a.start_contract).getTime();
      const dateB = new Date(b.start_contract).getTime();

      if (dateA !== dateB) return dateA - dateB;

      return a.id - b.id;
    });
  }



  // private calculateAndEmitSummary() {
  //   if (!this.contractsList || this.contractsList.length === 0) {
  //     this.contractsSummaryLoaded.emit({ first: null, last: null });
  //     return;
  //   }

  //   const result = this.contractsList.reduce((acc, current) => {
  //     const currentStart = new Date(current.start_contract).getTime();
  //     const minStart = new Date(acc.first.start_contract).getTime();
  //     const maxStart = new Date(acc.last.start_contract).getTime();

  //     return {
  //       first: currentStart < minStart ? current : acc.first,
  //       last: currentStart > maxStart ? current : acc.last
  //     };
  //   }, { first: this.contractsList[0], last: this.contractsList[0] });

  //   this.contractsSummaryLoaded.emit({
  //     first: result.first.start_contract,
  //     last: result.last.end_contract
  //   });
  // }

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


  // profile picture
  @ViewChild('fileInput') fileInput!: ElementRef;
  readonly defaultImage: string = './images/profile-defult.jpg';
  profileImage: string = this.defaultImage;



  // onImageSelected(event: any) {
  //   const file = event.target.files[0];
  //   if (!file) return;

  //   const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  //   if (!allowed.includes(file.type)) {
  //     alert('Only JPG, PNG, WEBP images are allowed!');
  //     return;
  //   }

  //   const reader = new FileReader();
  //   reader.onload = () => {
  //     this.profileImage = reader.result as string;
  //   };
  //   reader.readAsDataURL(file);
  // }
  triggerUpload() {
    this.fileInput.nativeElement.click();
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      // this.toasterMessageService.showError('Only JPG, PNG, WEBP images are allowed!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.profileImage = reader.result as string;
    };
    reader.readAsDataURL(file);

    this.uploadImage(file);
  }

  uploadImage(file: File) {
    this.employeeService.changeEmployeePicture(this.employeeId, file, false).subscribe({
      next: (response) => {
        this.updateProfileImageFromResponse(response);
      },
      error: (err) => console.error(err)
    });
  }


  updateProfileImageFromResponse(response: any) {
    const pictureData = response?.data?.object_info?.picture;
    if (pictureData?.generate_signed_url) {
      this.profileImage = pictureData.generate_signed_url;
    }
    else if (pictureData?.image_url) {
      this.profileImage = pictureData.image_url;
    }
    else {
      this.profileImage = this.defaultImage;
    }
  }

  get hasProfilePicture(): boolean {
    return this.profileImage !== this.defaultImage;
  }

  handleImageError() {
    this.profileImage = this.defaultImage;
  }

  removeImage(event: Event) {
    event.stopPropagation();
    this.employeeService.changeEmployeePicture(this.employeeId, null, true).subscribe({
      next: () => {
        this.profileImage = this.defaultImage;
      },
      error: (err) => console.error('Failed to remove image', err)
    });
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

  // Documents checklist - now managed by documents-tab component
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
    isEditable?: boolean;
    isCustom?: boolean;
  }> = [];


  addNewDocument() {
    const uniqueId = Date.now();
    this.documentsRequired.push({
      name: '',
      key: `custom_doc_${uniqueId}`,
      uploaded: false,
      isEditable: true,
      isCustom: true,
      isDeleteModalOpen: false
    });
  }


  // Load existing documents for employee
  loadEmployeeDocuments(): void {
    if (!this.employee) return;
    this.employeeService.getEmployeeDocuments(this.employee.id).subscribe({
      next: (res) => {
        const items = res.data.list_items || [];
        items.forEach((item: any) => {
          const existingDoc = this.documentsRequired.find(d => d.key === item.name);

          const serverDocData = {
            uploaded: true,
            url: item.document_url,
            id: item.id,
            uploadDate: item.created_at,
            fileName: item.info?.file_name,
            size: item.info?.file_size_kb,
            fileExt: item.info?.file_ext,
            fileType: item.info?.file_type,
            isLoading: false,

          };
          if (existingDoc) {
            Object.assign(existingDoc, serverDocData);

          } else {
            this.documentsRequired.push({
              name: item.name || 'Untitled Document',
              key: item.name,
              isCustom: true,
              isEditable: false,
              isDeleteModalOpen: false,
              ...serverDocData
            });

          }
          // if (doc) {
          //   doc.uploaded = true;
          //   doc.url = item.document_url;
          //   doc.id = item.id;
          //   doc.uploadDate = item.created_at;
          //   doc.fileName = item.info?.file_name;
          //   doc.size = item.info?.file_size_kb;
          //   doc.fileExt = item.info?.file_ext;
          //   doc.fileType = item.info?.file_type;
          // }
        });
        // this.documentsRequired.forEach(d => d.isLoading = false);
        // this.changeDetector.detectChanges();
        this.documentsRequired.forEach(d => {
          if (!d.uploaded) d.isLoading = false;
        });

        this.changeDetector.detectChanges();
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
    this.loadEmployeeContracts();
  }

  get onboardingCompleted(): number {
    if (!this.employee?.onboarding_list) return 0;
    return this.employee.onboarding_list.filter(item => item.status === true).length;
  }

  get onboardingTotal(): number {
    if (!this.employee?.onboarding_list) return 0;
    return this.employee.onboarding_list.length;
  }

  get onboardingProgress(): number {
    if (this.onboardingTotal === 0) return 0;
    return (this.onboardingCompleted / this.onboardingTotal) * 100;
  }

  openOnboardingModal(): void {
    this.isOnboardingModalOpen = true;
  }

  closeOnboardingModal(): void {
    this.isOnboardingModalOpen = false;
  }

  onChecklistItemClick(item: OnboardingListItem): void {
    this.updateChecklistItem(item);
  }

  updateChecklistItem(item: { title: string; status: boolean }): void {
    // Don't update if no employee or currently loading (explicit null check)
    if (!this.employee || this.loadingChecklistItemTitle !== null) {
      return;
    }

    // Set loading state for the clicked item IMMEDIATELY to prevent other clicks
    this.loadingChecklistItemTitle = item.title;

    // Toggle the clicked item status, keep all others as they were
    const newStatus = !item.status;
    const updatedOnboardingList = (this.employee.onboarding_list || []).map(listItem => {
      if (listItem.title === item.title) {
        return { ...listItem, status: newStatus };
      }
      return listItem; // Keep all other items as they were (true or false)
    });

    // Build job_details payload matching manage-employee structure
    const managementLevelId = this.employee.job_info.management_level?.id;
    const jobDetailsPayload: any = {
      years_of_experience: this.employee.job_info.years_of_experience || 0,
      management_level: managementLevelId ? parseInt(String(managementLevelId), 10) : null,
      work_schedule_id: this.employee.job_info.work_schedule?.id ? parseInt(String(this.employee.job_info.work_schedule.id), 10) : null,
      activate_attendance_rules: this.employee.job_info.activate_attendance_rules ?? false
    };

    // Add job_title_id if exists
    if (this.employee.job_info.job_title?.id) {
      jobDetailsPayload.job_title_id = parseInt(String(this.employee.job_info.job_title.id), 10);
    }

    // Add branch/department/section based on management level (matching manage-employee logic)
    if (managementLevelId === 2) {
      if (this.employee.job_info.branch?.id) {
        jobDetailsPayload.branch_id = parseInt(String(this.employee.job_info.branch.id), 10);
      }
    }
    if (managementLevelId === 3) {
      if (this.employee.job_info.branch?.id) {
        jobDetailsPayload.branch_id = parseInt(String(this.employee.job_info.branch.id), 10);
      }
      if (this.employee.job_info.department?.id) {
        jobDetailsPayload.department_id = parseInt(String(this.employee.job_info.department.id), 10);
      }
    }
    if (managementLevelId === 5 || managementLevelId === 4) {
      if (this.employee.job_info.branch?.id) {
        jobDetailsPayload.branch_id = parseInt(String(this.employee.job_info.branch.id), 10);
      }
      if (this.employee.job_info.department?.id) {
        jobDetailsPayload.department_id = parseInt(String(this.employee.job_info.department.id), 10);
      }
      if (this.employee.job_info.section?.id) {
        jobDetailsPayload.section_id = parseInt(String(this.employee.job_info.section.id), 10);
      }
    }

    // Format date for API (YYYY-M-D format)
    const formatDateForAPI = (dateStr: string): string => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    };

    // Build contract_details payload matching manage-employee structure
    const contractDetailsPayload: any = {
      employment_type: this.employee.job_info.employment_type.id,
      work_mode: this.employee.job_info.work_mode.id,
      days_on_site: this.employee.job_info.days_on_site ? parseInt(String(this.employee.job_info.days_on_site), 10) : 0,
      insurance_salary: this.employee.job_info.insurance_salary ? parseFloat(String(this.employee.job_info.insurance_salary)) : 0,
      gross_insurance: this.employee.job_info.gross_insurance ? parseFloat(String(this.employee.job_info.gross_insurance)) : 0
    };

    // Build the complete employee update payload matching manage-employee structure
    const requestData: any = {
      main_information: {
        code: this.employee.code,
        name_english: this.employee.contact_info.name,
        name_arabic: this.employee.contact_info.name_arabic || '',
        gender: this.employee.contact_info.gender.id,
        mobile: {
          country_id: this.employee.contact_info.mobile.country.id,
          number: parseInt(String(this.employee.contact_info.mobile.number), 10)
        },
        personal_email: this.employee.contact_info.email,
        marital_status: this.employee.contact_info.marital_status.id,
        date_of_birth: formatDateForAPI(this.employee.contact_info.date_of_birth),
        address: this.employee.contact_info.address || ''
      },
      job_details: jobDetailsPayload,
      contract_details: contractDetailsPayload,
      onboarding_list: updatedOnboardingList
    };

    const payload = {
      request_data: {
        id: this.employee.id,
        ...requestData
      }
    };

    this.employeeService.updateEmployee(payload).subscribe({
      next: (response: any) => {
        this.toasterMessageService.showSuccess('Checklist item updated successfully');
        // Reload employee data to get the updated checklist from server
        // This ensures we have the latest data after all related APIs (department update, etc.) complete
        this.employeeService.getEmployeeById(this.employeeId).subscribe({
          next: (employeeResponse) => {
            // Update employee data with fresh data from server
            this.employee = employeeResponse.data.object_info;
            this.changeDetector.detectChanges();
            // Clear loading state only after employee data (including checklist) is reloaded
            this.loadingChecklistItemTitle = null;
          },
          error: (reloadError) => {
            console.error('Error reloading employee data:', reloadError);
            // Even if reload fails, update local data and clear loading
            if (this.employee) {
              this.employee.onboarding_list = updatedOnboardingList;
            }
            this.loadingChecklistItemTitle = null;
          }
        });
      },
      error: (error: any) => {
        console.error('Error updating checklist item:', error);
        this.toasterMessageService.showError('Failed to update checklist item');
        // Revert the local change on error
        if (this.employee) {
          const revertedList = (this.employee.onboarding_list || []).map(listItem => {
            if (listItem.title === item.title) {
              return { ...listItem, status: item.status }; // Revert to original status
            }
            return listItem;
          });
          this.employee.onboarding_list = revertedList;
        }
        // Clear loading state on error
        this.loadingChecklistItemTitle = null;
      }
    });
  }

  loadEmployeeData(reloadContractsTab: boolean = false, keepTab: string | null = null): void {
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
        this.updateProfileImageFromResponse(response);
        this.subscription = response.data.subscription;
        this.loading = false;
        // Restore tab if it was set before loading
        if (keepTab) {
          this.setCurrentTab(keepTab as any);
        }
        // Reload contracts tab if requested (after employee data is loaded)
        if (reloadContractsTab && this.contractsTabComponent && this.employee?.id) {
          this.contractsTabComponent.loadEmployeeContracts();
        }
      },
      error: (error) => {
        console.error('Error loading employee:', error);
        this.loading = false;
        // Restore tab even on error
        if (keepTab) {
          this.setCurrentTab(keepTab as any);
        }
      }
    });
  }

  onContractsDataUpdated(): void {
    // Keep the contracts tab open - set it before loading data
    this.setCurrentTab('contracts');
    // Pass true to reload contracts tab after employee data is loaded
    // Pass 'contracts' to keepTab to ensure it stays on contracts tab after reload
    this.loadEmployeeData(true, 'contracts');
    // Also refresh contracts list for the summary display
    this.loadEmployeeContracts();
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
  // private getEmployeeStatus(employee: Employee): string {
  //   const today = new Date();
  //   const startDate = new Date(employee.job_info.start_contract);
  //   const daysDiff = (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

  //   if (daysDiff < 0) {
  //     return 'New Joiner'; // Contract hasn't started yet
  //   } else if (daysDiff <= 90) {
  //     return 'New Employee'; // Within first 90 days
  //   } else {
  //     return 'Employed'; // More than 90 days
  //   }
  // }

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

  onFileSelecteds(event: Event): void {
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
          this.loadEmployeeDocuments();
          this.loadEmployeeDetails();
          const doc = this.documentsRequired.find(d => d.key === docKey);
          if (doc) {
            doc.uploaded = true;
            doc.isLoading = false;
          }

          const spinnerHideDelay = 900;
          setTimeout(() => {
            delete this.uploadProgress[docKey];
          }, spinnerHideDelay);
          // delete this.uploadProgress[docKey];
          this.toasterMessageService.showSuccess(`${docKey} uploaded successfully`);
          input.value = '';
          this.selectedDocumentKey = null;

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


  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0 || !this.selectedDocumentKey || !this.employee) {
      return;
    }

    const file = input.files[0];
    const docKey = this.selectedDocumentKey;

    const currentDoc = this.documentsRequired.find(d => d.key === docKey);

    if (currentDoc && currentDoc.isEditable && (!currentDoc.name || currentDoc.name.trim() === '')) {
      this.toasterMessageService.showError('Add File Name before selecting a file');
      input.value = '';
      this.selectedDocumentKey = null;
      return;
    }
    let fileNameToSend = docKey;
    if (currentDoc?.isEditable) {
      currentDoc.key = currentDoc.name;

      fileNameToSend = currentDoc.name;
    }

    this.employeeService.uploadEmployeeDocument(this.employee.id, fileNameToSend, file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const percentDone = Math.round(100 * (event.loaded / (event.total || 1)));
          this.uploadProgress[docKey] = percentDone;
        }
        else if (event.type === HttpEventType.Response) {

          this.loadEmployeeDocuments();
          this.loadEmployeeDetails();

          const responseData = event.body as any;
          const serverId = responseData?.data?.id || responseData?.id;
          const serverUrl = responseData?.data?.document_url || responseData?.document_url;

          if (currentDoc) {
            currentDoc.uploaded = true;
            currentDoc.isLoading = false;
            currentDoc.isEditable = false;

            currentDoc.fileName = file.name;
            currentDoc.size = file.size / 1024;
            currentDoc.uploadDate = new Date().toISOString();

            if (serverId) currentDoc.id = serverId;
            if (serverUrl) currentDoc.url = serverUrl;
            currentDoc.isDeleteModalOpen = false;
          }

          this.documentsRequired = [...this.documentsRequired];
          this.changeDetector.detectChanges();

          const spinnerHideDelay = 900;
          setTimeout(() => {
            delete this.uploadProgress[docKey];
          }, spinnerHideDelay);

          this.toasterMessageService.showSuccess('Document uploaded successfully');

          input.value = '';
          this.selectedDocumentKey = null;
        }
      },
      error: (error) => {
        console.error('Error uploading document', error);

        delete this.uploadProgress[docKey];
        if (currentDoc) {
          currentDoc.isLoading = false;
        }
        this.toasterMessageService.showError('Error uploading document');
        input.value = '';
        this.selectedDocumentKey = null;
      }
    });
  }



  // onFileSelected(event: Event): void {
  //   const input = event.target as HTMLInputElement;



  //   if (!input.files || input.files.length === 0 || !this.selectedDocumentKey || !this.employee) {
  //     return;
  //   }

  //   const currentDoc = this.documentsRequired.find(d => d.key === this.selectedDocumentKey);

  //   if (currentDoc && currentDoc.isEditable && !currentDoc.name.trim()) {
  //     this.toasterMessageService.showError('Please enter document name before selecting a file');
  //     input.value = '';
  //     return;
  //   }

  //   const file = input.files[0];
  //   const docKey = this.selectedDocumentKey;





  //   // if (input.files && input.files.length > 0 && this.selectedDocumentKey && this.employee) {
  //   // const file = input.files[0];
  //   // const docKey = this.selectedDocumentKey;
  //   this.employeeService.uploadEmployeeDocument(this.employee.id, docKey, file).subscribe(event => {
  //     if (event.type === HttpEventType.UploadProgress) {
  //       const percentDone = Math.round(100 * (event.loaded / (event.total || 1)));
  //       this.uploadProgress[docKey] = percentDone;
  //     } else if (event.type === HttpEventType.Response) {
  //       // upload complete
  //       this.loadEmployeeDocuments();
  //       this.loadEmployeeDetails();
  //       const doc = this.documentsRequired.find(d => d.key === docKey);
  //       if (doc) {
  //         doc.uploaded = true;
  //         doc.isLoading = false;
  //       }

  //       const spinnerHideDelay = 900;
  //       setTimeout(() => {
  //         delete this.uploadProgress[docKey];
  //       }, spinnerHideDelay);
  //       // delete this.uploadProgress[docKey];
  //       this.toasterMessageService.showSuccess(`${docKey} uploaded successfully`);
  //       input.value = '';
  //       this.selectedDocumentKey = null;

  //     }

  //   }, error => {
  //     console.error('Error uploading document', error);
  //     delete this.uploadProgress[docKey];
  //     // this.toasterMessageService.showError(`Error uploading ${docKey}`);
  //   });
  //   // }
  //   // reset input and selected key
  //   input.value = '';
  //   this.selectedDocumentKey = null;
  // }

  loadEmployeeDetails(): void {
    if (!this.employee) return;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (res) => {
        this.employee = res.data.object_info;
        this.changeDetector.detectChanges();
      },
      error: (error) => console.error('Error loading employee details', error)
    });
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

  // onDeletes(docKey: string): void {
  //   const doc = this.documentsRequired.find(d => d.key === docKey);

  //   if (!doc || !doc.id || doc.isLoading) {
  //     if (!doc?.id) {
  //       console.warn('Cannot delete document, missing ID.');
  //     }
  //     return;
  //   }

  //   doc.isLoading = true;

  //   this.documentsRequired = [...this.documentsRequired];

  //   this.employeeService.deleteEmployeeDocument(doc.id, this.employee!.id).subscribe({
  //     next: () => {
  //       doc.uploaded = false;
  //       delete doc.url;
  //       delete doc.id;
  //       doc.isLoading = false;
  //       doc.isDeleteModalOpen = false;
  //       this.loadEmployeeDetails();

  //       this.documentsRequired = [...this.documentsRequired];

  //       // this.toasterMessageService.showSuccess(`${docKey} deleted successfully`);
  //     },
  //     error: (error) => {
  //       console.error('Error deleting document', error);

  //       doc.isLoading = false;
  //       doc.isDeleteModalOpen = false;

  //       this.documentsRequired = [...this.documentsRequired];

  //       // this.toasterMessageService.showError(`Error deleting ${docKey}`);
  //     }
  //   });
  // }


  onDelete(docKey: string): void {
    const docIndex = this.documentsRequired.findIndex(d => d.key === docKey);
    const doc = this.documentsRequired[docIndex];

    if (!doc) return;

    if (!doc.uploaded && doc.isEditable) {
      this.documentsRequired.splice(docIndex, 1);
      this.documentsRequired = [...this.documentsRequired];
      return;
    }

    if (!doc.id) return;

    doc.isLoading = true;
    this.employeeService.deleteEmployeeDocument(doc.id, this.employee!.id).subscribe({
      next: () => {
        if (doc.isCustom) {
          this.documentsRequired.splice(docIndex, 1);
        } else {
          doc.uploaded = false;
          delete doc.url;
          delete doc.id;
          doc.isLoading = false;
        }
        this.documentsRequired = [...this.documentsRequired];
        // Refresh the entire employee data after deleting a document
        this.loadEmployeeData();
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        doc.isLoading = false;
        console.error(err);
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
