import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';

interface Branch {
  id: number;
  name: string;
  location: string;
  maxEmployees: number;
  createdAt: string;
  updatedAt: string;
  status: string;
}

@Component({
  selector: 'app-all-branches',
  imports: [PageHeaderComponent, CommonModule, FormsModule, NgxPaginationModule, TableComponent, OverlayFilterBoxComponent, RouterLink, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './all-branches.component.html',
  styleUrls: ['./all-branches.component.css']
})

export class AllBranchesComponent implements OnInit {

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;


  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private _BranchesService: BranchesService, private datePipe: DatePipe, private fb: FormBuilder) { }

  branches: any[] = [];
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      this.getAllBranches(this.currentPage);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllBranches(this.currentPage, value);
    });


    this.filterForm = this.fb.group({
      status: [''],
      updatedFrom: [''],
      updatedTo: [''],
      createdFrom: [''],
      createdTo: [''],
      min_employees: [''],
      max_employees: [''],
      branch: [''],
    });
  }


  resetFilterForm(): void {
    this.filterForm.reset({
      status: '',
      updatedFrom: '',
      updatedTo: '',
      createdFrom: '',
      createdTo: '',
      min_employees: '',
      max_employees: '',
      branch: ''
    });
    this.filterBox.closeOverlay();
    this.getAllBranches(this.currentPage);
  }

  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.branches = this.branches.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (this.sortDirection === 'asc') {
        return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
      } else {
        return nameA < nameB ? 1 : (nameA > nameB ? -1 : 0);
      }
    });
  }


  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }


  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        status: rawFilters.status || undefined,
        updated_from: rawFilters.updatedFrom || undefined,
        updated_to: rawFilters.updatedTo || undefined,
        created_from: rawFilters.createdFrom || undefined,
        created_to: rawFilters.createdTo || undefined,
        min_employees: rawFilters.min_employees || undefined,
        max_employees: rawFilters.max_employees || undefined,
        branch: rawFilters.branch || undefined,
      };

      // console.log('Filters submitted:', filters);
      this.filterBox.closeOverlay();
      this.getAllBranches(this.currentPage, '', filters);
    }
  }



  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  getAllBranches(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      status?: string;
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
      min_employees?: string;
      max_employees?: string;
    }
  ) {
    this._BranchesService.getAllBranches(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        // console.log(response);
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.branches = response.data.list_items.map((item: any) => ({
          id: item.id,
          name: item.name,
          location: item.location,
          max_employee: item.max_employee ?? null,
          createdAt: this.datePipe.transform(item.created_at, 'dd/MM/yyyy'),
          updatedAt: this.datePipe.transform(item.updated_at, 'dd/MM/yyyy'),
          status: item.is_active ? 'Active' : 'Inactive',
        }));
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';

        this.sortBy();
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }



  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllBranches(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllBranches(this.currentPage);
  }
}
