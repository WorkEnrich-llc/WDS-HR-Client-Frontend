import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';

import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { RestrictedService } from '../../../../core/services/attendance/restricted-days/restricted.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-all-restricted-days',
  imports: [PageHeaderComponent, TableComponent, ReactiveFormsModule, OverlayFilterBoxComponent, RouterLink, FormsModule, DatePipe],
  providers: [DatePipe],
  templateUrl: './all-restricted-days.component.html',
  styleUrl: './all-restricted-days.component.css'
})
export class AllRestrictedDaysComponent {
  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private _RestrictedService: RestrictedService, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;


  restrictedDays: any[] = [];
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalpages: number = 0;
  loadData: boolean = true;
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      this.getAllResterictedDays(this.currentPage);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllResterictedDays(this.currentPage, value);
    });
    this.filterForm = this.fb.group({
      restriction_type: ''
    });
  }

  getAllResterictedDays(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      restriction_type?: string;
    }
  ) {
    this._RestrictedService.getAllRestrictedDays(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.restrictedDays = response.data.list_items;
        this.restrictedDays.forEach((item: any) => {
          if (item.all_dates && item.all_dates.length > 0) {
            const sortedDates = item.all_dates.sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());
            item.earliest_date = sortedDates[0];
            item.latest_date = sortedDates[sortedDates.length - 1];
          } else {
            item.earliest_date = null;
            item.latest_date = null;
          }
        });
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
        this.loadData = false;
      },
      error: (err) => {
        console.error(err.error?.details);
        this.loadData = false;
      }
    });
  }


  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';

    this.restrictedDays = this.restrictedDays.sort((a, b) => {
      const dateA = new Date(a.earliest_date).getTime();
      const dateB = new Date(b.earliest_date).getTime();

      if (this.sortDirection === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }


  resetFilterForm(): void {
    this.filterForm.reset({
      restriction_type: ''
    });
    this.filterBox.closeOverlay();
    this.getAllResterictedDays(this.currentPage);
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        restriction_type: rawFilters.restriction_type || undefined
      };

      this.filterBox.closeOverlay();
      this.getAllResterictedDays(this.currentPage, '', filters);
    }
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllResterictedDays(this.currentPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllResterictedDays(this.currentPage);
  }

}
