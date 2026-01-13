import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';

import { SmartGridSheetComponent, TableColumn } from '../../shared/smart-grid-sheet/smart-grid-sheet.component';
import { SystemCloudService } from '../../../core/services/system-cloud/system-cloud.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from 'app/core/services/system-cloud/breadcrumb.service';

import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { Subscription, switchMap, takeWhile, timer } from 'rxjs';
import { NgClass } from '@angular/common';


export interface HeaderItem {
  label: string;
  key: string;
  type: string;
  data: any[];
  reliability?: string | null;
  required?: boolean;
  editable?: boolean;
}

@Component({
  selector: 'app-system-file',
  imports: [PageHeaderComponent, SmartGridSheetComponent, PopupComponent, NgClass],
  templateUrl: './system-file.component.html',
  styleUrl: './system-file.component.css',
  encapsulation: ViewEncapsulation.None
})
export class SystemFileComponent implements OnInit {
  constructor(
    private _systemCloudService: SystemCloudService,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }
  @ViewChild('smartGrid') smartGrid!: SmartGridSheetComponent;
  @ViewChild('mainGrid') mainGrid!: SmartGridSheetComponent;
  @ViewChild('failedGrid') failedGrid!: SmartGridSheetComponent;

  errMsg: string = '';
  isLoading = false;
  isUpdatingStructure = false;
  uploadSub!: Subscription;
  percentage: number = 0;
  uploadType: string = 'Pending';
  isCompleted: boolean = false;
  breadcrumb: { id: string, name: string }[] = [];
  systemFileData: any = { sections: [] };
  SystemFileId: string | null = null;
  loadData: boolean = false;
  customColumns: TableColumn[] = [];
  rowsData: any[] = [];
  bodyRows: any[] = [];
  upLoading: boolean = false;

  isImported: boolean = false;
  private collectTimer: any = null;
  private lastCollectedData: any[] = [];
  isAllLoaded = false;
  syncStatus: 'synced' | 'syncing' | 'error' = 'synced';
  showSystemMenu: boolean = false;


  onRowsChanged(updatedRows: any[]) {
    this.rowsData = updatedRows;
    this.collectFilledRows();
    this.triggerCollectFilledRows();
  }

  triggerCollectFilledRows() {
    if (this.collectTimer) {
      clearTimeout(this.collectTimer);
    }

    this.collectTimer = setTimeout(() => {
      this.collectFilledRows();
    }, 3000);
  }

  toggleSystemMenu(event?: any) {
    if (event && event.stopPropagation) event.stopPropagation();
    this.showSystemMenu = !this.showSystemMenu;
  }

  onUpdateBasic(): void {
    // placeholder - no operation for now
  }

  // onCellInput() {
  //   this.triggerCollectFilledRows();
  // }

  ngOnInit(): void {
    this.SystemFileId = this.route.snapshot.paramMap.get('id');

    this.breadcrumb = this.breadcrumbService.getBreadcrumb();


    if (this.SystemFileId) {
      this.getSystemFileData(this.SystemFileId);
    }
  }


  goToFolder(crumb: any) {
    const index = this.breadcrumb.findIndex(c => c.id === crumb.id);
    const newBreadcrumb = this.breadcrumb.slice(0, index + 1);

    this.breadcrumbService.setBreadcrumb(newBreadcrumb);
    this.breadcrumbService.setCurrentFolder(crumb);

    this.breadcrumbService.setReturnFolderId(crumb.id);

    this.router.navigate(['/cloud/cloud-system']);
  }





  collectFilledRows() {
    if (!this.rowsData || this.rowsData.length === 0) return;

    let firstIndex = -1;
    let lastIndex = -1;

    this.rowsData.forEach((row, index) => {
      const hasValue = Object.values(row).some(value => value !== null && value !== '');
      if (hasValue) {
        if (firstIndex === -1) firstIndex = index;
        lastIndex = index;
      }
    });

    if (firstIndex === -1 || lastIndex === -1) return;

    const body = this.rowsData.slice(firstIndex, lastIndex + 1).map(row => {
      const normalizedRow: any = {};
      this.customColumns.forEach(col => {
        normalizedRow[col.key] = row[col.key] ?? null;
      });
      return normalizedRow;
    });

    const hasChanged = JSON.stringify(body) !== JSON.stringify(this.lastCollectedData);
    if (!hasChanged) return;

    this.lastCollectedData = body;
    const finalData = {
      request_data: {
        body
      }
    };

    this.syncStatus = 'syncing';
    // console.log(finalData);
    this._systemCloudService.updateSheet(this.SystemFileId!, finalData).subscribe({
      next: (response) => {
        this.syncStatus = 'synced';
      },
      error: (err) => {
        console.error(err.error?.details);
        this.syncStatus = 'error';
      }
    });
  }



  fileEditable: boolean = false;
  getSystemFileData(fileId: string) {
    this.loadData = true;

    this._systemCloudService.getSystemFileData(fileId).subscribe({
      next: (response) => {
        this.systemFileData = response.data.object_info;
        this.fileEditable = this.systemFileData.file.editable;
        // console.log(this.systemFileData)
        if (!this.fileEditable) {
          this.isImported = true;
          this.startUploadTracking(this.systemFileData.file.id);
          return;
        }

        if (this.systemFileData.header) {
          this.customColumns = this.generateCustomColumnsFromHeaders(this.systemFileData.header, false);
        }

        this.bodyRows = this.systemFileData.body;

        this.loadData = false;
        this.isAllLoaded = true;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
        this.isAllLoaded = true;
      }
    });
  }



  generateCustomColumnsFromHeaders(headers: HeaderItem[], isFailedTable: boolean = false): TableColumn[] {
    const skipIfBackendError = (validator: ValidatorFn): ValidatorFn => {
      return (control: AbstractControl) => {
        if (control.errors && control.errors['backend']) return null;
        return validator(control);
      };
    };

    return headers.map(header => {
      let type: 'input' | 'select' | 'date' | 'time' = 'input';
      const validators: ValidatorFn[] = [];
      let options: { value: any, label: string }[] | undefined;
      let errorMessage = '';

      if (header.required) {
        validators.push(skipIfBackendError(Validators.required));
        errorMessage = 'This field is required';
      }

      switch (header.type) {
        case 'dropdown':
          type = 'select';
          options = header.reliability ? [] : header.data.map(opt => ({
            value: opt.id,
            label: opt.name
          }));
          validators.push(skipIfBackendError((control: AbstractControl) =>
            control.value === 0 ? { required: true } : null
          ));
          errorMessage = 'Please select a valid option';
          break;

        case 'email':
          validators.push(skipIfBackendError(Validators.email));
          errorMessage = 'Please enter a valid email address';
          break;

        case 'phone':
          validators.push(skipIfBackendError(Validators.pattern(/^\d+$/)));
          errorMessage = 'Please enter a valid phone number (digits only)';
          break;

        case 'int':
        case 'BigInt':
          validators.push(skipIfBackendError(Validators.pattern(/^(0|[1-9][0-9]*)$/)));
          errorMessage = 'Please enter a valid integer (no leading zeros)';
          break;

        case 'double':
        case 'float':
        case 'number':
          validators.push(skipIfBackendError(Validators.pattern(/^\d+(\.\d+)?$/)));
          errorMessage = 'Please enter a valid number';
          break;

        case 'date':
          type = 'date';
          break;

        case 'time':
          type = 'time';
          break;
      }

      return {
        key: header.key,
        name: header.key,
        label: header.label,
        type,
        validators,
        errorMessage,
        required: !!header.required,
        editable: isFailedTable ? true : (this.fileEditable ? header.editable : false),
        ...(options ? { options } : {}),
        reliability: header.reliability ?? undefined,
        rawData: header.data,
      };
    });
  }


  private showErrorToast(message: string) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.background = '#b83d4a';
    toast.style.color = 'white';
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    toast.style.zIndex = '9999';
    toast.style.fontSize = '16px';
    toast.style.fontWeight = '600';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // private validateBeforeAction(rowsArray: any[]): boolean {
  //   if (!rowsArray || rowsArray.length === 0) return true;

  //   const gridIsValid = (this.smartGrid as any)?.validateFilledRows?.() ?? true;
  //   if (!gridIsValid) {
  //     this.showErrorToast('Please correct the errors first');
  //     return false;
  //   }

  //   let hasBackendErrors = false;
  //   rowsArray.forEach((row: any, rowIndex: number) => {
  //     if (row.__errors && Object.keys(row.__errors).length > 0) {
  //       hasBackendErrors = true;
  //       if (this.smartGrid && typeof (this.smartGrid as any).applyBackendErrors === 'function') {
  //         (this.smartGrid as any).applyBackendErrors(rowIndex, row.__errors);
  //       }
  //     }
  //   });

  //   if (hasBackendErrors) {
  //     this.showErrorToast('Please correct the errors first');
  //     return false;
  //   }

  //   return true;
  // }
  private validateBeforeAction(rowsArray: any[]): boolean {
    if (!rowsArray || rowsArray.length === 0) return true;

    const gridIsValid = (this.smartGrid as any)?.validateFilledRows?.() ?? true;
    if (!gridIsValid) {
      this.showErrorToast('Please correct the errors first');
      return false;
    }

    let hasBackendErrors = false;
    rowsArray.forEach((row: any, rowIndex: number) => {
      if (row.__errors && Object.keys(row.__errors).length > 0 && !row.__backendFixed) {
        hasBackendErrors = true;
        if (this.smartGrid && typeof (this.smartGrid as any).applyBackendErrors === 'function') {
          (this.smartGrid as any).applyBackendErrors(rowIndex, row.__errors);
        }
      }
    });

    if (hasBackendErrors) {
      this.showErrorToast('Please correct the errors first');
      return false;
    }

    return true;
  }
  onCellInput(): void {
    this.triggerCollectFilledRows();

    this.failedRows.forEach(row => {
      if (row.__errors && Object.keys(row.__errors).length > 0) {
        row.__errors = {};
        row.__backendFixed = true;
      }
    });
  }


  openModalAddtosystem() {
    const isGridValid = this.mainGrid?.validateFilledRows?.() ?? true;
    const isBodyRowsValid = this.validateBeforeAction(this.bodyRows);

    if (isGridValid && isBodyRowsValid) {
      this.addTosystemPOP = true;
    } else {
      this.showErrorToast('Please fix highlighted errors before continuing.');
    }
  }

  closeModalAddtosystem() {
    this.addTosystemPOP = false;
  }

  // openModalMissing() {
  //   // const isGridValid = this.failedGrid?.validateFilledRows?.() ?? true;
  //   const isFailedValid = this.validateBeforeAction(this.failedRows);

  //   if (isFailedValid) {
  //     this.addMissingPopup = true;
  //   } else {
  //     this.showErrorToast('Please fix highlighted errors before continuing.');
  //   }
  // }
  openModalMissing() {
    const isFailedValid = this.validateBeforeAction(this.failedRows);


    if (isFailedValid) {
      this.addMissingPopup = true;
    } else {
      this.showErrorToast('Please fix highlighted errors before continuing.');
    }
  }
  applyBackendErrorsToFailedGrid() {
    if (!this.failedGrid) return;

    this.failedRows.forEach((row, rowIndex) => {
      if (row.__errors && Object.keys(row.__errors).length > 0) {
        this.failedGrid.applyBackendErrors(rowIndex, row.__errors);
      }
    });
  }


  closeModalMissing() {
    this.addMissingPopup = false;
  }


  // add to system
  activeTab: 'failed' | 'imported' = 'failed';

  switchTab(tab: 'failed' | 'imported') {
    this.activeTab = tab;

    if (tab === 'failed') {
      setTimeout(() => {
        this.applyBackendErrorsToFailedGrid();
      });
    }
  }

  importedColumns: TableColumn[] = [];
  importedRows: any[] = [];

  failedColumns: TableColumn[] = [];
  failedRows: any[] = [];

  addTosystemPOP: boolean = false;
  showUploadPopup: boolean = false;
  addMissingPopup: boolean = false;
  showMissingPopup: boolean = false;
  // re-update confirmation popup
  reupdatePOP: boolean = false;
  reupdateType: string = '';


  gridsEditable: boolean = true;

  addingTosystem(): void {
    this.errMsg = '';
    this.gridsEditable = false;
    this.addTosystemPOP = false;
    this.upLoading = true;
    const formData = new FormData();
    formData.append('id', this.SystemFileId ?? '');
    formData.append('file_type', '1');
    this.cdr.detectChanges();
    this._systemCloudService.addToSyatem(formData).subscribe({
      next: (response) => {
        // console.log('Added successfully:', response);
        // this.showUploadPopup = true;
        if (this.SystemFileId) {
          this.startUploadTracking(this.SystemFileId);

        }
      },
      error: (err) => {
        console.log(err.error?.details);
        this.errMsg = err.error?.details || 'An error occurred while adding to system.';
        this.gridsEditable = true;
        this.upLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openReupdateModal(type: 'structure' | 'basic' | 'components_value' | 'all') {
    // if any validation is needed before allowing operation, it can be added here
    this.reupdateType = type;
    this.reupdatePOP = true;
  }

  closeReupdateModal() {
    this.reupdatePOP = false;
  }

  confirmReupdate() {
    if (!this.SystemFileId) return;

    this.errMsg = '';
    this.reupdatePOP = false;
    this.upLoading = true;
    this.gridsEditable = false;
    this.cdr.detectChanges();

    this._systemCloudService.reUpdatePayroll(this.SystemFileId, this.reupdateType).subscribe({
      next: (response) => {
        // start tracking upload/status for the file
        if (this.SystemFileId) {
          this.startUploadTracking(this.SystemFileId);
        }
      },
      error: (err) => {
        console.error('Error re-updating payroll:', err);
        this.errMsg = err.error?.details || 'An error occurred while performing update.';
        this.gridsEditable = true;
        this.upLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getReupdateColor(): string {
    switch (this.reupdateType) {
      case 'structure':
        return '#3b82f6';
      case 'basic':
        return '#10b981';
      case 'components_value':
        return '#8b5cf6';
      case 'all':
        return 'var(--color-warning-500)';
      default:
        return '';
    }
  }



  startUploadTracking(id: string, isUpdateMissing: boolean = false): void {
    if (isUpdateMissing) {
      this.percentage = 0;
      this.uploadType = 'Pending';
      this.upLoading = true;
      this.gridsEditable = false;
    }

    let firstValidResponseSeen = false;

    this.uploadSub = timer(0, 2000).pipe(
      switchMap(() => this._systemCloudService.uploadStatus(id)),
      takeWhile((res: any) => {
        const type = res?.data?.object_info?.upload_type;
        return type !== 'Completed' && type !== 'Cancelled';
      }, true)
    )
      .subscribe({
        next: (res: any) => {
          const objectInfo = res?.data?.object_info;

          if (isUpdateMissing && !firstValidResponseSeen) {
            firstValidResponseSeen = true;
          }

          this.percentage = objectInfo?.percentage ?? 0;
          this.uploadType = objectInfo?.upload_type ?? 'Pending';
          this.cdr.detectChanges();

          if (this.percentage >= 100 && this.uploadType === 'Completed') {
            this.loadData = false;
            this.isCompleted = true;
            this.isImported = true;

            setTimeout(() => {
              this.upLoading = false;
              this.uploadType = 'Pending';
              this.percentage = 0;
              this.gridsEditable = true;
              this.cdr.detectChanges();
            }, 4000);

            this.stopUploadTracking();

            if (objectInfo?.main_data?.header) {
              this.importedColumns = this.generateCustomColumnsFromHeaders(objectInfo.main_data.header, false);
              this.failedColumns = this.generateCustomColumnsFromHeaders(objectInfo.main_data.header, true);
            }

            this.importedRows = objectInfo?.finished?.body ?? [];
            this.failedRows = this.markFailedRowsAsTouched(objectInfo?.missing?.body ?? []);
            this.missingRowsData = [...this.failedRows];
            this.isAllLoaded = true;
            this.cdr.detectChanges();

            setTimeout(() => {
              if (this.failedGrid) {
                this.failedRows.forEach((row, rowIndex) => {
                  if (row.__errors && Object.keys(row.__errors).length > 0) {
                    this.failedGrid.applyBackendErrors(rowIndex, row.__errors);
                    row.__backendErrorsApplied = true;
                  }
                });
                this.cdr.detectChanges();
              }
            }, 300);
          }

          if (this.uploadType === 'Cancelled') {
            this.upLoading = false;
            this.stopUploadTracking();

            if (objectInfo?.main_data?.header) {
              this.importedColumns = this.generateCustomColumnsFromHeaders(objectInfo.main_data.header, false);
              this.failedColumns = this.generateCustomColumnsFromHeaders(objectInfo.main_data.header, true);
            }

            this.importedRows = objectInfo?.finished?.body ?? [];
            this.failedRows = this.markFailedRowsAsTouched(objectInfo?.missing?.body ?? []);

            this.missingRowsData = [...this.failedRows];
            this.loadData = false;
            this.isAllLoaded = true;
            this.gridsEditable = true;
            this.cdr.detectChanges();

            setTimeout(() => {
              if (this.failedGrid) {
                this.failedRows.forEach((row, rowIndex) => {
                  if (row.__errors && Object.keys(row.__errors).length > 0) {
                    this.failedGrid.applyBackendErrors(rowIndex, row.__errors);
                    row.__backendErrorsApplied = true;
                  }
                });
                this.cdr.detectChanges();
              }
            }, 300);
          }
        },
        error: (err) => {
          console.error('Error:', err.error?.details);
          this.upLoading = false;
          this.stopUploadTracking();
          this.loadData = false;
          this.gridsEditable = true;
          this.isAllLoaded = true;
          this.cdr.detectChanges();
        }
      });
  }




  private markFailedRowsAsTouched(rows: any[]): any[] {
    return rows.map(row => {
      const newRow: any = { ...row };

      if (Array.isArray(row.errors)) {
        newRow.__errors = {};
        row.errors.forEach((err: any) => {
          if (err.key && err.error) {
            newRow.__errors[err.key] = err.error;
            // console.log(`Mark failed row: ${err.key} -> ${err.error}`);
          }
        });
      }

      const entries = Object.entries(row).filter(([key]) => key !== 'errors');
      const hasAnyValue = entries.some(([_, v]) => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string' && v.trim() === '') return false;
        return true;
      });

      if (hasAnyValue) {
        newRow.__forceTouched = true;
      }

      return newRow;
    });
  }







  stopUploadTracking(): void {
    if (this.uploadSub) {
      this.uploadSub.unsubscribe();
    }
  }

  missingRowsData: any[] = [];

  updateMissing(): void {
    this.addTosystemPOP = false;
    this.gridsEditable = false;
    this.upLoading = true;
    this.addMissingPopup = false;
    this.cdr.detectChanges();
    if (!this.missingRowsData || this.missingRowsData.length === 0) return;

    let firstIndex = -1;
    let lastIndex = -1;

    this.missingRowsData.forEach((row, index) => {
      const hasValue = Object.values(row).some(value => value !== null && value !== '');
      if (hasValue) {
        if (firstIndex === -1) firstIndex = index;
        lastIndex = index;
      }
    });

    if (firstIndex === -1 || lastIndex === -1) return;

    const body = this.missingRowsData
      .slice(firstIndex, lastIndex + 1)
      .filter(row => Object.values(row).some(value => value !== null && value !== ''))
      .map(row => {
        const normalizedRow: any = {};

        this.failedColumns.forEach(col => {
          let value = row[col.key] ?? null;

          if (value && col.type === 'date') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              value = `${year}-${month}-${day}`;
            }
          }

          normalizedRow[col.key] = value;
        });

        return normalizedRow;
      });


    if (body.length === 0) return;

    const finalData = {
      request_data: {
        id: this.SystemFileId,
        body
      }
    };

    // console.log('Missing Updated Data:', finalData);

    this._systemCloudService.updateMissing(finalData).subscribe({
      next: (response) => {
        this.percentage = 0;
        this.uploadType = 'Pending';
        this.upLoading = true;
        if (this.SystemFileId) {

          this.startUploadTracking(this.SystemFileId, true);

        }
      },
      error: (err) => {
        console.log(err.error?.details);
        this.errMsg = err.error?.details || 'An error occurred while adding to system.';
        this.gridsEditable = true;
        this.cdr.detectChanges();
      }
    });
  }

  getUploadBadge(uploadType: string): { class: string, label: string } {
    switch (uploadType) {
      case 'Checking':
        return { class: 'badge-warning', label: 'Checking' };
      case 'Creating':
        return { class: 'badge-gray', label: 'Creating' };
      case 'Sending emails':
        return { class: 'badge-warning', label: 'Sending emails' };
      case 'Completed':
        return { class: 'badge-success', label: 'Completed' };
      case 'Stopped':
        return { class: 'badge-gray', label: 'Stopped' };
      case 'Cancelled':
        return { class: 'badge-danger', label: 'Cancelled' };
      case 'Failure':
        return { class: 'badge-danger', label: 'Failure' };
      case 'Pending':
      default:
        return { class: 'badge-newjoiner', label: 'Pending' };
    }
  }

  cancelUpload(): void {
    this.upLoading = false;
    if (!this.SystemFileId) return;

    const formData = new FormData();
    formData.append('id', this.SystemFileId);

    this._systemCloudService.cancelUpload(formData).subscribe({
      next: (res) => {
        // console.log('Upload canceled:', res);
        this.stopUploadTracking();
        this.showUploadPopup = false;
      },
      error: (err) => {
        console.error('Error canceling upload:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopUploadTracking();
  }

  updateStructure(): void {
    // Defer to the confirmation modal flow to avoid duplicate API calls.
    this.openReupdateModal('structure');
  }

}
