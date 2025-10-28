import { Component, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-all-payroll-runs',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, CommonModule],
  templateUrl: './all-payroll-runs.component.html',
  styleUrl: './all-payroll-runs.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AllPayrollRunsComponent {
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private fb: FormBuilder) { }

  // @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  @ViewChild('configureBox') configureBox!: OverlayFilterBoxComponent;
  @ViewChild('importBox') importBox!: OverlayFilterBoxComponent;
  private paginationState = inject(PaginationStateService);
  private router = inject(Router);
  closeOverlays(): void {
    this.importBox?.closeOverlay();
  }
  closeconfigureBoxOverlays(): void {
    this.configureBox?.closeOverlay();
  }
  loadData: boolean = false;
  filterForm!: FormGroup;

  payrollRuns = [
    {
      id: 1,
      month: 'April 2025',
      cycle: '1 March – 31 March',
      numOfEmp: 93,
      Status: 'Pending'
    },
    {
      id: 2,
      month: 'March 2025',
      cycle: '1 February – 28 February',
      numOfEmp: 93,
      Status: 'Draft'
    },
    {
      id: 3,
      month: 'January 2025',
      cycle: '25 January – 31 January',
      numOfEmp: 93,
      Status: 'Completed'
    },
  ];

  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;


  ngOnInit(): void {
    // this.route.queryParams.subscribe(params => {
    //   // this.currentPage = +params['page'] || 1;
    //   // this.getAllDepartment(this.currentPage);
    // });

    this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('payroll-runs/payroll-runs') || 1;
      this.currentPage = pageFromUrl;
      // this.getAllPayrollRuns(pageFromUrl);
    });


    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      // this.getAllDepartment(this.currentPage, value);
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
    // this.getAllDepartment(this.currentPage);
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
  }

  navigateToEdit(runsId: number): void {
    this.paginationState.setPage('payroll-runs/payroll-runs', this.currentPage);
    this.router.navigate(['/payroll-runs/edit-payroll-run', runsId]);
  }


  navigateToView(runsId: number): void {
    this.paginationState.setPage('payroll-runs/payroll-runs', this.currentPage);
    this.router.navigate(['/payroll-runs/view-payroll-run', runsId]);
  }
}
