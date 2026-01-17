import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TaxesService } from 'app/core/services/payroll/taxes/taxes.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-all-taxes',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, RouterLink, FormsModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './all-taxes.component.html',
  styleUrl: './all-taxes.component.css',
  providers: [DatePipe],
})
export class AllTaxesComponent implements OnInit {
  private taxesService = inject(TaxesService);
  private fb = inject(FormBuilder);
  private paginationState = inject(PaginationStateService);
  private router = inject(Router);

  constructor(
    private route: ActivatedRoute,
    private toasterMessageService: ToasterMessageService,
    private toastr: ToastrService,
  ) { }

  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

  loadData: boolean = false;
  filterForm!: FormGroup;
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  taxes: any[] = [];

  totalPages: number = 0;

  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || 1;
      this.currentPage = pageFromUrl;
      this.paginationState.setPage('taxes/all-taxes', this.currentPage);
      this.getAllTaxes(this.currentPage);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });
        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(600)).subscribe(value => {
      this.getAllTaxes(this.currentPage, value);
    });

    this.filterForm = this.fb.group({
      status: [''],
      createdFrom: [''],
    });
  }

  getAllTaxes(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      status?: string;
      created_from?: string;
    }
  ) {
    this.loadData = true;
    this.taxesService.getAll(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.page || pageNumber);
        this.totalItems = response.total_items || 0;
        this.totalPages = response.total_pages || 0;
        this.taxes = (response.list_items || response.items || []).map((item: any) => ({
          id: item.id,
          code: item.code || '',
          name: item.name,
          minimum: item.main_salary?.minimum || 0,
          maximum: item.main_salary?.maximum || 0,
          exemption: item.main_salary?.exemption || 0,
          is_active: item.is_active ?? item.status ?? true,
          status: item.is_active ?? item.status ? 'Active' : 'Inactive',
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
        this.loadData = false;
      },
      error: (err) => {
        console.error(err.error?.details);
        this.taxes = [];
        this.loadData = false;
      }
    });
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.taxes.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      if (this.sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        status: rawFilters.status || undefined,
        created_from: rawFilters.createdFrom || undefined,
      };
      this.filterBox.closeOverlay();
      this.getAllTaxes(this.currentPage, '', filters);
    }
  }

  resetFilterForm(): void {
    this.filterBox.closeOverlay();
    this.filterForm.reset();
    this.searchTerm = '';
    this.getAllTaxes(1);
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllTaxes(this.currentPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationState.setPage('taxes/all-taxes', page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  navigateToEdit(taxId: number): void {
    this.paginationState.setPage('taxes/all-taxes', this.currentPage);
    this.router.navigate(['/taxes/manage-taxes', taxId]);
  }

}
