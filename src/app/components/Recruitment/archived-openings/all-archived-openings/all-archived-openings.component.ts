import { Component, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { TableComponent } from '../../../shared/table/table.component';
import { debounceTime, filter, Subject, Subscription, take } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ArchivedOpeningsService } from '../../../../core/services/recruitment/archived-openings/archived-openings.service';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-all-archived-openings',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, RouterLink, FormsModule, ReactiveFormsModule, PopupComponent],
  providers: [DatePipe],
  templateUrl: './all-archived-openings.component.html',
  styleUrl: './all-archived-openings.component.css'
})
export class AllArchivedOpeningsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private toasterMessageService = inject(ToasterMessageService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);
  private archivedOpeningsService = inject(ArchivedOpeningsService);

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

  loadData: boolean = false;
  filterForm!: FormGroup;
  archivedOpenings: any[] = [];

  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;

  // Date filter properties
  dateFrom: string = '';
  dateTo: string = '';

  // Unarchive confirmation modal
  isUnarchiveModalOpen: boolean = false;
  selectedJobIdToUnarchive: number | null = null;


  ngOnInit(): void {
    this.initializeForm();

    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      this.loadArchivedOpenings();
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });
        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.currentPage = 1;
      this.loadArchivedOpenings();
    });
  }

  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
    this.searchSubject.complete();
  }

  initializeForm(): void {
    this.filterForm = this.fb.group({
      dateFrom: [''],
      dateTo: ['']
    });
  }

  loadArchivedOpenings(): void {
    // Prevent duplicate calls if already loading
    if (this.loadData) {
      return;
    }

    this.loadData = true;

    const filters: any = {};
    if (this.searchTerm.trim()) {
      filters.search = this.searchTerm.trim();
    }
    if (this.dateFrom) {
      filters.date_from = this.dateFrom;
    }
    if (this.dateTo) {
      filters.date_to = this.dateTo;
    }

    this.archivedOpeningsService.getAllArchivedOpenings(
      this.currentPage,
      this.itemsPerPage,
      filters
    ).subscribe({
      next: (response) => {
        if (response.data && response.data.list_items) {
          this.archivedOpenings = response.data.list_items;
          this.totalItems = response.data.total_items || 0;
        }
        this.loadData = false;
      },
      error: (error) => {
        console.error('Error loading archived openings:', error);
        this.toastr.error('Failed to load archived openings');
        this.loadData = false;
      }
    });
  }


  resetFilterForm(): void {
    this.filterForm.reset();
    this.dateFrom = '';
    this.dateTo = '';
    this.filterBox.closeOverlay();
    this.currentPage = 1;
    this.loadArchivedOpenings();
  }

  applyFilters(): void {
    this.dateFrom = this.filterForm.get('dateFrom')?.value || '';
    this.dateTo = this.filterForm.get('dateTo')?.value || '';
    this.filterBox.closeOverlay();
    this.currentPage = 1;
    this.loadArchivedOpenings();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.loadArchivedOpenings();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadArchivedOpenings();
  }

  openUnarchiveModal(jobId: number): void {
    this.selectedJobIdToUnarchive = jobId;
    this.isUnarchiveModalOpen = true;
  }

  closeUnarchiveModal(): void {
    this.isUnarchiveModalOpen = false;
    this.selectedJobIdToUnarchive = null;
  }

  confirmUnarchive(): void {
    if (this.selectedJobIdToUnarchive) {
      this.archivedOpeningsService.unarchiveJobOpening(this.selectedJobIdToUnarchive).subscribe({
        next: (response) => {
          this.toastr.success('Job opening unarchived successfully');
          this.closeUnarchiveModal();
          this.loadArchivedOpenings(); // Reload the list
        },
        error: (error) => {
          console.error('Error unarchiving job opening:', error);
          this.toastr.error('Failed to unarchive job opening');
          this.closeUnarchiveModal();
        }
      });
    }
  }
}
