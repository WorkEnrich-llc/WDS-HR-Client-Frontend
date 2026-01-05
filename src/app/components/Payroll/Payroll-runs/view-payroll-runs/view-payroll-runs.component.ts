
import { Component, ViewChild, OnDestroy } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { PayrollRunService } from 'app/core/services/payroll/payroll-run.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { RouterLink } from '@angular/router';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-view-payroll-runs',
  imports: [PageHeaderComponent, TableComponent, RouterLink, OverlayFilterBoxComponent, PopupComponent, DecimalPipe, DatePipe],
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

  constructor(private route: ActivatedRoute, private payrollRunService: PayrollRunService) { }

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

  ngOnInit(): void {
    this.loadData = true;
    const id = this.route.snapshot.paramMap.get('id');
    this.payrollRunId = id;
    if (id) {
      const sub = this.payrollRunService.getPayrollRunById(id).subscribe({
        next: (data) => {
          this.payRollRunData = data;
          this.loadData = false;
        },
        error: () => {
          this.loadData = false;
        }
      });
      this.subscriptions.push(sub);
    }
    this.fetchEmployees();
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
    if (!this.selectedSheetId) {
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
    formData.append('sheet_id', this.selectedSheetId);

    const sub = this.payrollRunService.startPayrollRun(formData).subscribe({
      next: (data) => {
        this.showConfirmation = false;
        this.isStartingPayroll = false;
        // Handle success - you can add a toast notification here
      },
      error: (error) => {
        this.isStartingPayroll = false;
        // Handle error - you can add a toast notification here
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
    const selectedSheet = this.employees.find(e => e.id === this.selectedSheetId);
    return selectedSheet?.name || 'Unknown';
  }
}
