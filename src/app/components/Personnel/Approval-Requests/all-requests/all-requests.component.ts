import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ApprovalRequestsService } from '../service/approval-requests.service';
import { ApprovalRequestItem, ApprovalRequestFilters } from '../../../../core/interfaces/approval-request';

@Component({
  selector: 'app-all-requests',
  imports: [PageHeaderComponent, TableComponent, CommonModule, OverlayFilterBoxComponent, RouterLink, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './all-requests.component.html',
  styleUrl: './all-requests.component.css'
})
export class AllRequestsComponent {
  filterForm!: FormGroup;
  constructor(
    private route: ActivatedRoute, 
    private toasterMessageService: ToasterMessageService, 
    private toastr: ToastrService,
    private fb: FormBuilder,
    private approvalRequestsService: ApprovalRequestsService
  ) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

  approvalRequests: ApprovalRequestItem[] = [];
  loading: boolean = false;
  filters: ApprovalRequestFilters = {};

  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadApprovalRequests();

    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      this.loadApprovalRequests();
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });
        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.filters.search = value;
      this.currentPage = 1;
      this.loadApprovalRequests();
    });
  }

  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      status: [''],
      employee_id: [''],
      leave_type: [''],
      from_date: [''],
      to_date: [''],
      created_from: [''],
      created_to: ['']
    });
  }

  loadApprovalRequests(): void {
    this.loading = true;
    
    this.approvalRequestsService.getAllApprovalRequests(
      this.currentPage,
      this.itemsPerPage,
      this.filters
    ).subscribe({
      next: (response) => {
        // debugger
        const temp =  [
            {
                "id": 4,
                "code": "LT-1212y34",
                "name": "Sick Leave",
                "employee_info": {
                    "id": 5,
                    "name": "Ahmad Ibrahim El-Sayed Mohammed",
                    "job_title": "Senior Python"
                },
                "reason": {
                    "status": {
                        "id": 1,
                        "name": "Pending"
                    },
                    "note": "",
                    "mandatory": false
                },
                "dates": {
                    "from_date": "2025-08-25",
                    "to_date": "2025-08-25",
                    "total": 1
                },
                "document_url": {
                    "image_url": "20250708_170825_images_2.jpeg",
                    "generate_signed_url": "https://storage.googleapis.com/work_enrich_test/20250708_170825_images_2.jpeg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=workenrich-backend-access%40principal-iris-451803-a5.iam.gserviceaccount.com%2F20250708%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250708T170826Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=4add67d16a2e82b879b78f5cc3783275d0b89e30e80eeaa4f81b8c6db9cf126a9829422e5c37be772911b7dbe31a36121bc387108b6f2422dff39c8b033569703cb31aa155a27625a9ecfb3cbf2b83c2aef3241cc843145ad2d9a4bd7df0b3b04c851796c75a4c0c093584560c4a24d56ec61d26367df511e4bfd74a5a09bfe54e78c66c132ece1220ef6f90dd9068e04b7dcd19b9cf2c500ef5dd18f20c77758a6824cca880f078ae916c53486f5af4b25fdd6778aa816b9814735cf1a8ea74672142bb113a51ae9fa4942b248aec1b8fcdd94830f5bd0d1fa7c66bf86e8e2cdd4d6b07abd0cdccd2321706125445c7fbd5e1e17d0870d3042be7aa589d77ea"
                },
                "status": {
                    "id": 1,
                    "name": "Pending"
                },
                "created_at": "2025-07-08T17:08:26.162238Z",
                "updated_at": "2025-07-08T17:08:26.162266Z"
            },
            {
                "id": 5,
                "code": "L-B-1",
                "name": "Boredom leave",
                "employee_info": {
                    "id": 5,
                    "name": "Ahmad Ibrahim El-Sayed Mohammed",
                    "job_title": "Senior Python"
                },
                "reason": {
                    "status": {
                        "id": 1,
                        "name": "Pending"
                    },
                    "note": "",
                    "mandatory": false
                },
                "dates": {
                    "from_date": "2025-07-31",
                    "to_date": "2025-08-02",
                    "total": 3
                },
                "document_url": {
                    "image_url": "20250709_182846_IMG_6902.jpg",
                    "generate_signed_url": "https://storage.googleapis.com/work_enrich_test/20250709_182846_IMG_6902.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=workenrich-backend-access%40principal-iris-451803-a5.iam.gserviceaccount.com%2F20250709%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250709T182848Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=8d78a70455cf6d822cf86c6eb2971d6be5f2d2b4528d14109101f7f158c00fd398bc6cd124f6fa76393853d7ff37eecc813fb0de4033917c043fee24102964319166efacb18de14d6c34cc872886f750b3213810c8b931200dac627e738453058fb86be53a4c5ed05b82b673ffe0c3f792cccd65ee0112875bfdb612a4595c6107876021073f2b1ff84b5f2b751283a1165d3831c2fb3efb00680a420ed1434be701521af2f2d144d188bab40649b151bcf31cd142f00346d5f73bed10b9b855d033c786ede13d1de2fc7bc417f6f6bf3c2b99c68ad8d85e1eee3ffcad208208f98f3463e2bd18d9e176e742e6a28be28ee9bc5513011a01aeb9c372b58869d5"
                },
                "status": {
                    "id": 5,
                    "name": "Expired"
                },
                "created_at": "2025-07-09T18:28:48.139746Z",
                "updated_at": "2025-07-12T21:21:58.246064Z"
            },
            {
                "id": 6,
                "code": "L-B-1",
                "name": "Boredom leave",
                "employee_info": {
                    "id": 6,
                    "name": "محمد ابراهيم السيد محمد",
                    "job_title": "Mid Level Python"
                },
                "reason": {
                    "status": {
                        "id": 1,
                        "name": "Pending"
                    },
                    "note": "",
                    "mandatory": false
                },
                "dates": {
                    "from_date": "2025-07-12",
                    "to_date": "2025-07-12",
                    "total": 1
                },
                "document_url": {
                    "image_url": "20250709_185509_IMG_6902.jpg",
                    "generate_signed_url": "https://storage.googleapis.com/work_enrich_test/20250709_185509_IMG_6902.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=workenrich-backend-access%40principal-iris-451803-a5.iam.gserviceaccount.com%2F20250709%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250709T185510Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=8126f6afefc9c7f4555e69c0520e9252f0bc457edb3192475f9cdea6cc9cc478796c5154df24a63a7d4d2d2ef76a1b4daaad98ad35f4341ff22214b8dfe53a63fd4fce03850d807deb83a02b1c5df8e6f93c3c54baa0ca191b3250aa7e6376c4b4c7d6fd82f6de8161bfd5784c0107699d1ac04e4ae3fe5937dac632e54d6d42de90bd6cf24bc88181ff13812c41efa86b1087ae07669f56eb393b8cf3925bffd34dc3fd05af88e79a6ac7077432cf12c61aed4a6604475d19ba6e4083648cf523181ba363a9bdc8996b552d7e4d0ada3492e03b14e407b4365e5bb407dd77b75294a2b8435c4cc01f1bc8829533a43f78795cc813afff71f52722539f8576ba"
                },
                "status": {
                    "id": 3,
                    "name": "Rejected"
                },
                "created_at": "2025-07-09T18:55:10.798021Z",
                "updated_at": "2025-07-10T18:51:14.993082Z"
            }
        ]
         this.approvalRequests = temp;
        // this.approvalRequests = response.data.list_items;
        this.totalItems = response.data.total_items;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading approval requests:', error);
        this.toastr.error('Failed to load approval requests', 'Error');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filters = { ...this.filterForm.value };
    // Remove empty values
    Object.keys(this.filters).forEach(key => {
      if (!this.filters[key as keyof ApprovalRequestFilters]) {
        delete this.filters[key as keyof ApprovalRequestFilters];
      }
    });
    
    this.currentPage = 1;
    this.loadApprovalRequests();
    this.filterBox.closeOverlay();
  }

  sortBy(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.approvalRequests = this.approvalRequests.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      if (this.sortDirection === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }

  resetFilterForm(): void {
    this.filterForm.reset();
    this.filters = {};
    this.currentPage = 1;
    this.loadApprovalRequests();
    this.filterBox.closeOverlay();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.loadApprovalRequests();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApprovalRequests();
  }

  // Helper methods to access nested properties for template
  getEmployeeName(request: ApprovalRequestItem): string {
    return request.employee_info?.name || 'N/A';
  }

  getEmployeeJobTitle(request: ApprovalRequestItem): string {
    return request.employee_info?.job_title || 'N/A';
  }

  getStatusName(request: ApprovalRequestItem): string {
    return request.status?.name || 'N/A';
  }

  getReasonStatusName(request: ApprovalRequestItem): string {
    return request.reason?.status?.name || 'N/A';
  }

  getDateRange(request: ApprovalRequestItem): string {
    if (request.dates?.from_date && request.dates?.to_date) {
      return `${request.dates.from_date} - ${request.dates.to_date}`;
    }
    return 'N/A';
  }

  getFormattedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
