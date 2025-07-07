import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { WorkSchaualeService } from '../../../../core/services/personnel/work-schaduale/work-schauale.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';

@Component({
  selector: 'app-work-schedule',
  imports: [PageHeaderComponent, CommonModule, TableComponent, FormsModule, OverlayFilterBoxComponent, RouterLink,ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './work-schedule.component.html',
  styleUrl: './work-schedule.component.css'
})
export class WorkScheduleComponent {

  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute,private _DepartmentsService:DepartmentsService, private _WorkSchaualeService: WorkSchaualeService, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;


  workschaduale: any[] = [];
  departments: any[] = [];
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
      this.getAllWorkSchedule(this.currentPage);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllWorkSchedule(this.currentPage, value);
    });
    this.getAllDepartment(1);
    this.filterForm = this.fb.group({
      department: '',
      schedules_type: '',
      work_schedule_type: ''
    });
  }


  getAllWorkSchedule(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      department?: string;
      schedules_type?: string;
      work_schedule_type?: string;
    }
  ) {
    this._WorkSchaualeService.getAllWorkSchadule(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.workschaduale = response.data.list_items;
        console.log(this.workschaduale);
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


getAllDepartment(pageNumber: number, searchTerm: string = '') {
    this._DepartmentsService.getAllDepartment(pageNumber, 10000, {
      search: searchTerm || undefined,
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.departments = response.data.list_items;
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.workschaduale = this.workschaduale.sort((a, b) => {
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
    this.getAllWorkSchedule(this.currentPage);
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        department: rawFilters.department || undefined,
        schedules_type: rawFilters.schedules_type || undefined,
        work_schedule_type: rawFilters.work_schedule_type || undefined
      };

      // console.log('Filters submitted:', filters);
      this.filterBox.closeOverlay();
      this.getAllWorkSchedule(this.currentPage, '', filters);
    }
  }
  


  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllWorkSchedule(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllWorkSchedule(this.currentPage);
  }

}
