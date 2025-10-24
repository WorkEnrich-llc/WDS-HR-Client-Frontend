import { Component, inject, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { TableComponent } from '../../../shared/table/table.component';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-all-leave-types',
  imports: [PageHeaderComponent, CommonModule, RouterLink, OverlayFilterBoxComponent, TableComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './all-leave-types.component.html',
  styleUrl: './all-leave-types.component.css'
})
export class AllLeaveTypesComponent {


  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private fb: FormBuilder, private _LeaveTypeService: LeaveTypeService) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;


  filterForm!: FormGroup;
  leaveTypes: any[] = [];
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;
  private paginationState = inject(PaginationStateService);
  private router = inject(Router)


  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('leave-types/all-leave-types') || 1;
      this.currentPage = pageFromUrl;
      this.getAllJobTitles(pageFromUrl);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllJobTitles(this.currentPage, value);
    });

    this.filterForm = this.fb.group({
      employment_type: ['']
    });
  }

  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.leaveTypes = this.leaveTypes.sort((a, b) => {
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


  resetFilterForm(): void {
    this.filterForm.reset({
      employment_type: ''
    });
    this.filterBox.closeOverlay();
    this.getAllJobTitles(this.currentPage);
  }



  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        employment_type: rawFilters.employment_type || undefined
      };

      // console.log('Filters submitted:', filters);
      this.filterBox.closeOverlay();
      this.getAllJobTitles(this.currentPage, '', filters);
    }
  }

  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  loadData: boolean = true;
  getAllJobTitles(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      employment_type?: string;
    }
  ) {
    this._LeaveTypeService.getAllLeavetypes(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.leaveTypes = response.data.list_items;
        // console.log(this.leaveTypes);
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
        this.loadData = false;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }


  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllJobTitles(this.currentPage);
  }
  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.getAllJobTitles(this.currentPage);
  // }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationState.setPage('leave-types/all-leave-types', page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }



  navigateToEdit(componentId: number): void {
    this.paginationState.setPage('leave-types/all-leave-types', this.currentPage);
    this.router.navigate(['/leave-types/update-leave-types', componentId]);
  }


  navigateToView(componentId: number): void {
    this.paginationState.setPage('leave-types/all-leave-types', this.currentPage);
    this.router.navigate(['/leave-types/view-leave-types', componentId]);
  }

}
