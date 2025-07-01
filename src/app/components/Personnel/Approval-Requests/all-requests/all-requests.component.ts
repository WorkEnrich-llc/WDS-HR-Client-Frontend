import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-all-requests',
  imports: [PageHeaderComponent, TableComponent, CommonModule, OverlayFilterBoxComponent, RouterLink, FormsModule],
  providers: [DatePipe],
  templateUrl: './all-requests.component.html',
  styleUrl: './all-requests.component.css'
})
export class AllRequestsComponent {
  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

  approvalRequests = [
    {
      id: 101,
      name: 'Ali Hassan',
      requestedAt: new Date('2025-06-01'),
      currentStep: 'Direct Manager’s Approval',
      leaveType: 'Sick Leave',
      dateRange: {
        from: new Date('2025-06-05'),
        to: new Date('2025-06-07'),
      },
      status: 'Pending',
    },
    {
      id: 102,
      name: 'Sara Mohamed',
      requestedAt: new Date('2025-06-03'),
      currentStep: 'HR Approval',
      leaveType: 'Annual Leave',
      dateRange: {
        from: new Date('2025-06-10'),
        to: new Date('2025-06-15'),
      },
      status: 'Accepted',
    },
    {
      id: 103,
      name: 'Ahmed Youssef',
      requestedAt: new Date('2025-06-04'),
      currentStep: 'Direct Manager’s Approval',
      leaveType: 'Sick Leave',
      dateRange: {
        from: new Date('2025-06-06'),
        to: new Date('2025-06-06'),
      },
      status: 'Rejected',
    },
    {
      id: 104,
      name: 'Laila Nasser',
      requestedAt: new Date('2025-06-02'),
      currentStep: 'HR Approval',
      leaveType: 'Maternity Leave',
      dateRange: {
        from: new Date('2025-06-15'),
        to: new Date('2025-07-15'),
      },
      status: 'Pending',
    },
    {
      id: 105,
      name: 'Mohamed Adel',
      requestedAt: new Date('2025-06-05'),
      currentStep: 'Direct Manager’s Approval',
      leaveType: 'Emergency Leave',
      dateRange: {
        from: new Date('2025-06-07'),
        to: new Date('2025-06-08'),
      },
      status: 'Pending',
    },
    {
      id: 106,
      name: 'Yara Samir',
      requestedAt: new Date('2025-06-06'),
      currentStep: 'HR Approval',
      leaveType: 'Sick Leave',
      dateRange: {
        from: new Date('2025-06-09'),
        to: new Date('2025-06-10'),
      },
      status: 'Accepted',
    },
    {
      id: 107,
      name: 'Hassan Ali',
      requestedAt: new Date('2025-06-07'),
      currentStep: 'Finance Approval',
      leaveType: 'Unpaid Leave',
      dateRange: {
        from: new Date('2025-06-20'),
        to: new Date('2025-06-25'),
      },
      status: 'Rejected',
    },
    {
      id: 108,
      name: 'Nourhan Gamal',
      requestedAt: new Date('2025-06-08'),
      currentStep: 'Direct Manager’s Approval',
      leaveType: 'Annual Leave',
      dateRange: {
        from: new Date('2025-06-12'),
        to: new Date('2025-06-18'),
      },
      status: 'Pending',
    },
    {
      id: 109,
      name: 'Khaled Essam',
      requestedAt: new Date('2025-06-09'),
      currentStep: 'HR Approval',
      leaveType: 'Sick Leave',
      dateRange: {
        from: new Date('2025-06-10'),
        to: new Date('2025-06-12'),
      },
      status: 'Accepted',
    },
    {
      id: 110,
      name: 'Mai Tarek',
      requestedAt: new Date('2025-06-10'),
      currentStep: 'Direct Manager’s Approval',
      leaveType: 'Emergency Leave',
      dateRange: {
        from: new Date('2025-06-11'),
        to: new Date('2025-06-11'),
      },
      status: 'Pending',
    },
    {
      id: 111,
      name: 'Omar Fathy',
      requestedAt: new Date('2025-06-11'),
      currentStep: 'HR Approval',
      leaveType: 'Sick Leave',
      dateRange: {
        from: new Date('2025-06-13'),
        to: new Date('2025-06-14'),
      },
      status: 'Rejected',
    },
    {
      id: 112,
      name: 'Dina ElSayed',
      requestedAt: new Date('2025-06-05'),
      currentStep: 'Finance Approval',
      leaveType: 'Annual Leave',
      dateRange: {
        from: new Date('2025-06-20'),
        to: new Date('2025-06-25'),
      },
      status: 'Accepted',
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
    this.approvalRequests = this.approvalRequests.sort((a, b) => {
      const dateA = new Date(a.requestedAt).getTime();
      const dateB = new Date(b.requestedAt).getTime();
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
