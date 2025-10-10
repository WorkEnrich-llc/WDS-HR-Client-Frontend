import { Component, inject, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-all-job-openings',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, RouterLink, CommonModule],
  templateUrl: './all-job-openings.component.html',
  styleUrl: './all-job-openings.component.css'
})
export class AllJobOpeningsComponent {

  private paginationState = inject(PaginationStateService);
  private router = inject(Router);
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  loadData: boolean = false;
  filterForm!: FormGroup;
  approvalRequests = [
    {
      jobId: 101,
      jobName: 'Job Name',
      branchId: 20,
      branchName: 'Brach Name',
      empType: 'Full-Time',
      numApplicant: 100,
      numApply: 47,
      numSchadule: 12,
      numRejected: 10,
      numAccepted: 2
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
      // const pageFromUrl = +params['page'] || this.paginationState.getPage('roles/all-role') || 1;
      // this.currentPage = pageFromUrl;
      // this.getAllApplicants(pageFromUrl);
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
    this.paginationState.setPage('job-openings/all-job-openings', page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
    // this.getAllDepartment(this.currentPage);
  }

  navigateToView(jobId: number): void {
    this.paginationState.setPage('job-openings/all-job-openings', this.currentPage);
    this.router.navigate(['/job-openings/view-job-openings', jobId]);
  }

}
