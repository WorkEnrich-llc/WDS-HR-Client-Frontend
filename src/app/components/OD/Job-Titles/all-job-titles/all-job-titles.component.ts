import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from './../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from './../../../shared/overlay-filter-box/overlay-filter-box.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-all-job-titles',
  imports: [PageHeaderComponent, RouterLink, TableComponent,FormsModule, OverlayFilterBoxComponent, CommonModule],
  providers: [DatePipe],
  templateUrl: './all-job-titles.component.html',
  styleUrl: './all-job-titles.component.css'
})
export class AllJobTitlesComponent {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;


  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private _JobsService: JobsService, private fb: FormBuilder) { }

  jobTitles: any[] = [];
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;



  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      this.getAllJobTitles(this.currentPage);
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
      status: [''],
      updatedFrom: [''],
      updatedTo: [''],
      createdFrom: [''],
      createdTo: ['']
    });
  }


  resetFilterForm(): void {
    this.filterForm.reset({
      status: '',
      updatedFrom: '',
      updatedTo: '',
      createdFrom: '',
      createdTo: ''
    });
    this.filterBox.closeOverlay();
    this.getAllJobTitles(this.currentPage);
  }

  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.jobTitles = this.jobTitles.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
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
      };

      // console.log('Filters submitted:', filters);
      this.filterBox.closeOverlay();
      this.getAllJobTitles(this.currentPage, '', filters);
    }
  }

  currentPage: number = 1;
  totalPages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;

  getAllJobTitles(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
      management_level?: string;
      department?: string;
      section?: string;
      status?: string;
      request_in?: string;
    }
  ) {
    this._JobsService.getAllJobTitles(pageNumber, this.itemsPerPage, {
      // search: searchTerm || undefined,
      request_in: 'all',
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalPages = response.data.total_pages;
        this.jobTitles = response.data.list_items;
        // console.log(this.jobTitles);
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }
}
