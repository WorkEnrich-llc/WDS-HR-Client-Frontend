import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { OverlayFilterBoxComponent } from 'app/components/shared/overlay-filter-box/overlay-filter-box.component';
import { TableComponent } from 'app/components/shared/table/table.component';
import { debounceTime, filter, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-roles',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, FormsModule, CommonModule],
  providers: [DatePipe],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent {


  filterForm!: FormGroup;
  toasterSubscription: any;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

  roles = [
    {
      id: 1,
      role: "Admin",
      added_date: "2025-08-01",
      status: "active"
    },
    {
      id: 2,
      role: "Editor",
      added_date: "2025-08-05",
      status: "inactive"
    },
    {
      id: 3,
      role: "Viewer",
      added_date: "2025-08-10",
      status: "pending"
    }
  ];
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalpages: number = 0;
  loadData: boolean = false;
  private searchSubject = new Subject<string>();


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      // this.getAllWorkSchedule(this.currentPage);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      // this.getAllWorkSchedule(this.currentPage, value);
    });
    // this.getAllDepartment(1);
    this.filterForm = this.fb.group({
      department: '',
      schedules_type: '',
      work_schedule_type: ''
    });
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.roles = this.roles.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id - b.id;
      } else {
        return b.id - a.id;
      }
    });
  }


  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }
  resetFilterForm(): void {
    this.filterForm.reset({
      department: '',
      schedules_type: '',
      work_schedule_type: ''
    });

    this.filterBox.closeOverlay();

    const filters = {
      department: undefined,
      schedules_type: undefined,
      work_schedule_type: undefined
    };

    // this.getAllWorkSchedule(this.currentPage, '', filters);
  }
  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        department: rawFilters.department || undefined,
        schedules_type: rawFilters.schedules_type || undefined,
        work_schedule_type: rawFilters.work_schedule_type || undefined
      };


      console.log('Filters submitted:', filters);
      this.filterBox.closeOverlay();
      // this.getAllWorkSchedule(this.currentPage, '', filters);
    }
  }


  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    // this.getAllWorkSchedule(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    // this.getAllWorkSchedule(this.currentPage);
  }
}
