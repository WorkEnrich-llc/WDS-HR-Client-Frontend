import { Component, EventEmitter, OnInit, Output, signal, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { SmartGridSheetComponent, TableColumn } from '../../shared/smart-grid-sheet/smart-grid-sheet.component';
import { SystemCloudService } from '../../../core/services/system-cloud/system-cloud.service';
import { ActivatedRoute, RouterLink } from '@angular/router';


export interface HeaderItem {
  label: string;
  key: string;
  type: string;
  data: any[];
  reliability?: string | null;
}

@Component({
  selector: 'app-system-file',
  imports: [PageHeaderComponent, SmartGridSheetComponent,RouterLink],
  templateUrl: './system-file.component.html',
  styleUrl: './system-file.component.css',
  encapsulation: ViewEncapsulation.None
})
export class SystemFileComponent implements OnInit {
  constructor(private _systemCloudService: SystemCloudService, private route: ActivatedRoute) { }

  systemFileData: any = { sections: [] };
  SystemFileId: string | null = null;
  loadData: boolean = false;
  customColumns: TableColumn[] = [];
  rowsData: any[] = [];
  bodyRows: any[] = [];
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

    if (this.SystemFileId) {
      this.getSystemFileData(this.SystemFileId);
    }
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




  getSystemFileData(fileId: string) {
    this.loadData = true;

    this._systemCloudService.getSystemFileData(fileId).subscribe({
      next: (response) => {
        this.systemFileData = response.data.object_info;
        // console.log(this.systemFileData);

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
      let type: 'input' | 'select' | 'date' = 'input';

      const validators: ValidatorFn[] = [Validators.required];
      let options: { value: any, label: string }[] | undefined;
      let errorMessage = 'This field is required';

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
          errorMessage = 'Please enter a valid phone number';
          break;

        case 'BigInt':
        case 'number':
          validators.push(Validators.pattern(/^\d+$/));
          errorMessage = 'Please enter a valid number';
          break;
        case 'date':
          type = 'date';
          break;
      }

      return {
        key: header.key,
        name: header.key,
        label: header.label,
        type,
        validators,
        errorMessage,
        ...(options ? { options } : {}),
        reliability: header.reliability ?? undefined,
        rawData: header.data
      };
    });
  }


}
