import { Component, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PayrollRunService } from 'app/core/services/payroll/payroll-run.service';

import { FormGroup, FormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-all-payroll-runs',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, FormsModule],
  templateUrl: './all-payroll-runs.component.html',
  styleUrl: './all-payroll-runs.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AllPayrollRunsComponent implements OnDestroy {
  days: number[] = Array.from({ length: 28 }, (_, i) => i + 1);
  private subscriptions: Subscription[] = [];
  private apiSub?: Subscription;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  @ViewChild('configureBox') configureBox!: OverlayFilterBoxComponent;
  @ViewChild('importBox') importBox!: OverlayFilterBoxComponent;
  private paginationState: PaginationStateService;
  private router: Router;

  loadData: boolean = false;
  filterForm!: FormGroup;
  payrollRuns: any[] = [];
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private searchSubject = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private toasterMessageService: ToasterMessageService,
    private toastr: ToastrService,
    private payrollRunService: PayrollRunService,
    paginationState: PaginationStateService,
    router: Router
  ) {
    this.paginationState = paginationState;
    this.router = router;
  }
  closeOverlays(): void {
    this.importBox?.closeOverlay();
  }
  closeconfigureBoxOverlays(): void {
    this.configureBox?.closeOverlay();
  }
  // ...existing code...


  ngOnInit(): void {
    const sub = this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('payroll-runs/payroll-runs') || 1;
      this.currentPage = pageFromUrl;
      this.fetchPayrollRuns();
    });
    this.subscriptions.push(sub);
  }

  ngAfterViewInit(): void {
    const toasterSub = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });
        this.toasterMessageService.clearMessage();
      });
    this.subscriptions.push(toasterSub);

    const searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      // this.getAllDepartment(this.currentPage, value);
    });
    this.subscriptions.push(searchSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    if (this.apiSub) {
      this.apiSub.unsubscribe();
    }
  }

  fetchPayrollRuns() {
    this.loadData = true;
    if (this.apiSub) {
      this.apiSub.unsubscribe();
    }
    this.apiSub = this.payrollRunService.getAllPayrollRuns(this.currentPage, this.itemsPerPage).subscribe({
      next: (response: any) => {
        const items = response?.data?.list_items ?? [];
        this.payrollRuns = items.map((item: any) => ({
          month: item.start_date ? `${item.start_date}` : '',
          cycle: item.start_date && item.end_date ? `${item.start_date} – ${item.end_date}` : '',
          numOfEmp: item.employees_cont ?? 0,
          Status: item.status ?? '',
          id: item.id
        }));
        this.totalItems = response?.data?.total_items ?? 0;
        this.loadData = false;
      },
      error: () => {
        this.toastr.error('Failed to load payroll runs');
        this.loadData = false;
      }
    });
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.payrollRuns = this.payrollRuns.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);

      if (this.sortDirection === 'asc') {
        return dateA > dateB ? 1 : (dateA < dateB ? -1 : 0);
      } else {
        return dateA < dateB ? 1 : (dateA > dateB ? -1 : 0);
      }
    });
  }

  // import
  selectedFile: File | null = null;

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

  resetFilterForm(): void {

    this.filterBox.closeOverlay();
    // this.getAllDepartment(this.currentPage);
  }
  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchPayrollRuns();
  }
  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   // this.getAllDepartment(this.currentPage);
  // }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationState.setPage('...', page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
    this.fetchPayrollRuns();
  }

  navigateToEdit(runsId: number): void {
    this.paginationState.setPage('payroll-runs/payroll-runs', this.currentPage);
    this.router.navigate(['/payroll-runs/edit-payroll-run', runsId]);
  }


  navigateToView(runsId: number): void {
    this.paginationState.setPage('payroll-runs/payroll-runs', this.currentPage);
    this.router.navigate(['/payroll-runs/view-payroll-run', runsId]);
  }

  selectedStartDay: number | null = null;

  savePayrollConfiguration(): void {
    if (!this.selectedStartDay) {
      this.toastr.error('Please select a start day');
      return;
    }

    const formData = new FormData();
    formData.append('start_in', this.selectedStartDay.toString());

    this.payrollRunService.configurePayroll(formData).subscribe({
      next: () => {
        this.toastr.success('Payroll configuration saved successfully');
        this.closeconfigureBoxOverlays();
        this.selectedStartDay = null;
        this.fetchPayrollRuns();
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Failed to save payroll configuration');
      }
    });
  }
}