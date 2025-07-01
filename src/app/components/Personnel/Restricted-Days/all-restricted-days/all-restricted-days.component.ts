import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { CommonModule } from '@angular/common';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-all-restricted-days',
  imports: [PageHeaderComponent, TableComponent, CommonModule, OverlayFilterBoxComponent, RouterLink, FormsModule],
  templateUrl: './all-restricted-days.component.html',
  styleUrl: './all-restricted-days.component.css'
})
export class AllRestrictedDaysComponent {
  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;


restrictedDays = [
  {
    id: 1,
    name: "New Year's Day",
    dateRange: "2025-01-01",
    restrictionType: "Holiday",
    createdAt: "2024-12-15T08:00:00Z",
    updatedAt: "2024-12-20T10:00:00Z"
  },
  {
    id: 2,
    name: "Labor Day",
    dateRange: "2025-05-01",
    restrictionType: "Holiday",
    createdAt: "2024-12-16T08:00:00Z",
    updatedAt: "2024-12-21T10:00:00Z"
  },
  {
    id: 3,
    name: "Maintenance Window",
    dateRange: "2025-02-10",
    restrictionType: "System",
    createdAt: "2024-11-20T09:30:00Z",
    updatedAt: "2024-11-25T11:45:00Z"
  },
  {
    id: 4,
    name: "Power Outage",
    dateRange: "2025-03-05",
    restrictionType: "Infrastructure",
    createdAt: "2024-11-10T10:00:00Z",
    updatedAt: "2024-11-15T12:00:00Z"
  },
  {
    id: 5,
    name: "IT Upgrade",
    dateRange: "2025-06-01",
    restrictionType: "System",
    createdAt: "2025-01-01T09:00:00Z",
    updatedAt: "2025-01-02T13:00:00Z"
  },
  {
    id: 6,
    name: "Eid al-Fitr",
    dateRange: "2025-04-10",
    restrictionType: "Religious",
    createdAt: "2024-10-01T08:30:00Z",
    updatedAt: "2024-10-05T09:00:00Z"
  },
  {
    id: 7,
    name: "Eid al-Adha",
    dateRange: "2025-06-15",
    restrictionType: "Religious",
    createdAt: "2024-10-01T08:30:00Z",
    updatedAt: "2024-10-05T09:00:00Z"
  },
  {
    id: 8,
    name: "Network Upgrade",
    dateRange: "2025-03-20",
    restrictionType: "System",
    createdAt: "2024-12-05T09:15:00Z",
    updatedAt: "2024-12-10T11:30:00Z"
  },
  {
    id: 9,
    name: "Database Migration",
    dateRange: "2025-07-01",
    restrictionType: "System",
    createdAt: "2025-02-10T10:00:00Z",
    updatedAt: "2025-02-12T12:00:00Z"
  },
  {
    id: 10,
    name: "Server Downtime",
    dateRange: "2025-08-15",
    restrictionType: "System",
    createdAt: "2025-03-01T09:00:00Z",
    updatedAt: "2025-03-05T10:00:00Z"
  },
  {
    id: 11,
    name: "National Day",
    dateRange: "2025-12-02",
    restrictionType: "Holiday",
    createdAt: "2025-06-20T08:00:00Z",
    updatedAt: "2025-06-25T09:00:00Z"
  },
  {
    id: 12,
    name: "System Audit",
    dateRange: "2025-12-05",
    restrictionType: "Security",
    createdAt: "2025-05-01T08:30:00Z",
    updatedAt: "2025-05-03T10:15:00Z"
  },
  {
    id: 13,
    name: "Internal Workshop",
    dateRange: "2025-11-10",
    restrictionType: "Training",
    createdAt: "2025-04-15T09:00:00Z",
    updatedAt: "2025-04-18T11:00:00Z"
  }
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
    this.route.queryParams.subscribe(params => {
      // this.currentPage = +params['page'] || 1;
      // this.getAllDepartment(this.currentPage);
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
    this.restrictedDays = this.restrictedDays.sort((a, b) => {
      const dateA = new Date(a.dateRange).getTime();
      const dateB = new Date(b.dateRange).getTime();
      if (this.sortDirection === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
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
  onPageChange(page: number): void {
    this.currentPage = page;
    // this.getAllDepartment(this.currentPage);
  }

}
