import { Component, EventEmitter, OnInit, Output, signal, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { SmartGridSheetComponent, TableColumn } from '../../shared/smart-grid-sheet/smart-grid-sheet.component';
import { SystemCloudService } from '../../../core/services/system-cloud/system-cloud.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BreadcrumbService } from 'app/core/services/system-cloud/breadcrumb.service';
import { CommonModule } from '@angular/common';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { interval, Subscription, switchMap, takeWhile, timer } from 'rxjs';


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
  imports: [PageHeaderComponent, SmartGridSheetComponent, CommonModule, PopupComponent],
  templateUrl: './system-file.component.html',
  styleUrl: './system-file.component.css',
  encapsulation: ViewEncapsulation.None
})
export class SystemFileComponent implements OnInit {
  constructor(
    private _systemCloudService: SystemCloudService,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private router: Router
  ) { }

  errMsg: string = '';
  isLoading = false;
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

  isImported: boolean = false;
  private collectTimer: any = null;
  private lastCollectedData: any[] = [];
  isAllLoaded = false;
  syncStatus: 'synced' | 'syncing' | 'error' = 'synced';


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

  onCellInput() {
    this.triggerCollectFilledRows();
  }

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

    this._systemCloudService.updateSheet(this.SystemFileId!, finalData).subscribe({
      next: (response) => {
        // console.log(response.data.object_info);
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
        console.log(this.systemFileData);
        this.fileEditable = this.systemFileData.file.editable;
        // console.log('File editable:', this.fileEditable);
        if (this.systemFileData.header) {
          this.customColumns = this.generateCustomColumnsFromHeaders(this.systemFileData.header);
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


  generateCustomColumnsFromHeaders(headers: HeaderItem[]): TableColumn[] {
    return headers.map(header => {
      let type: 'input' | 'select' | 'date' | 'time' = 'input';

      const validators: ValidatorFn[] = [];
      let options: { value: any, label: string }[] | undefined;
      let errorMessage = '';

      if (header.required) {
        validators.push(Validators.required);
        errorMessage = 'This field is required';
      }

      switch (header.type) {
        case 'dropdown':
          type = 'select';

          options = header.reliability ? [] : header.data.map(opt => ({
            value: opt.id,
            label: opt.name
          }));

          validators.push((control: { value: number }) => {
            return control.value === 0 ? { required: true } : null;
          });

          errorMessage = 'Please select a valid option';
          break;

        case 'email':
          validators.push(Validators.email);
          errorMessage = 'Please enter a valid email address';
          break;

        case 'phone':
          validators.push(Validators.pattern(/^\d+$/));
          errorMessage = 'Please enter a valid phone number (digits only)';
          break;

        case 'int':
          validators.push(Validators.pattern(/^(0|[1-9][0-9]*)$/));
          errorMessage = 'Please enter a valid integer (no leading zeros)';
          break;

        case 'double':
          validators.push(Validators.pattern(/^(0|[1-9][0-9]*)\.[0-9]+$/));
          errorMessage = 'Please enter a valid decimal number (e.g. 12.34, not starting with zero)';
          break;

        case 'BigInt':
        case 'number':
          validators.push(Validators.pattern(/^\d+(\.\d+)?$/));
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
        editable: this.fileEditable ? header.editable : false,
        ...(options ? { options } : {}),
        reliability: header.reliability ?? undefined,
        rawData: header.data
      };
    });
  }



  // add to system
  activeTab: 'failed' | 'imported' = 'failed';

  switchTab(tab: 'failed' | 'imported') {
    this.activeTab = tab;
  }
  importedColumns: TableColumn[] = [];
  importedRows: any[] = [];

  failedColumns: TableColumn[] = [];
  failedRows: any[] = [];

  addTosystemPOP: boolean = false;
  showUploadPopup: boolean = false;
  addMissingPopup: boolean = false;
  showMissingPopup: boolean = false;
  openModalAddtosystem() {
    this.addTosystemPOP = true;
  }

  closeModalAddtosystem() {
    this.addTosystemPOP = false;
  }
  openModalMissing() {
    this.addMissingPopup = true;
  }

  closeModalMissing() {
    this.addMissingPopup = false;
  }

  addingTosystem(): void {
    this.errMsg = '';

    const formData = new FormData();
    formData.append('id', this.SystemFileId ?? '');
    formData.append('file_type', '1');

    this._systemCloudService.addToSyatem(formData).subscribe({
      next: (response) => {
        // console.log('Added successfully:', response);
        this.addTosystemPOP = false;
        this.showUploadPopup = true;
        if (this.SystemFileId) {
          this.startUploadTracking(this.SystemFileId);
        }
      },
      error: (err) => {
        console.log(err.error?.details);
        this.errMsg = err.error?.details || 'An error occurred while adding to system.';
      }
    });
  }

  startUploadTracking(id: string): void {
    this.uploadSub = timer(0, 3000)
      .pipe(
        switchMap(() => this._systemCloudService.uploadStatus(id)),
        takeWhile((res: any) => res?.data?.object_info?.upload_type !== 'Completed', true)
      )
      .subscribe({
        next: (res: any) => {
          console.log(res?.data?.object_info);
          const percentage = res?.data?.object_info?.percentage ?? 0;
          const uploadType = res?.data?.object_info?.upload_type ?? 'Pending';

          // console.log('🔎 Extracted values ->', percentage, uploadType);

          this.percentage = percentage;
          this.uploadType = uploadType;


          if (this.percentage >= 100 && this.uploadType === 'Completed') {
            this.isCompleted = true;
            this.isImported = true;
            setTimeout(() => {
              this.showUploadPopup = false;
            }, 1500);

            this.stopUploadTracking();
            // if (this.systemFileData.Imported?.header) {
            //   this.importedColumns = this.generateCustomColumnsFromHeaders(this.systemFileData.Imported.header);
            // }
            // if (this.systemFileData.Imported?.body) {
            //   this.importedRows = this.systemFileData.Imported.body;
            // }

            // if (this.systemFileData.Failed?.header) {
            //   this.failedColumns = this.generateCustomColumnsFromHeaders(this.systemFileData.Failed.header);
            // }
            // if (this.systemFileData.Failed?.body) {
            //   this.failedRows = this.systemFileData.Failed.body;
            // }
          }
        },
        error: (err) => {
          console.error('Error:', err.error?.details);
          this.stopUploadTracking();
        }
      });
  }

  stopUploadTracking(): void {
    if (this.uploadSub) {
      this.uploadSub.unsubscribe();
    }
  }
  updateMissing(): void {

  }
  cancelUpload(): void {
    if (!this.SystemFileId) return;

    const formData = new FormData();
    formData.append('id', this.SystemFileId);

    this._systemCloudService.cancelUpload(formData).subscribe({
      next: (res) => {
        console.log('Upload canceled:', res);
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



}
