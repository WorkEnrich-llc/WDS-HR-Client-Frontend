import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { TableComponent } from 'app/components/shared/table/table.component';
import { CustomField, CustomFieldFilters, CustomFieldObject } from 'app/core/models/custom-field';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';
import { CustomFieldsService } from 'app/core/services/personnel/custom-fields/custom-fields.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-custom-fields',
  imports: [PageHeaderComponent, TableComponent, CommonModule,
    RouterLink, FormsModule, ReactiveFormsModule, PopupComponent],
  templateUrl: './custom-fields.component.html',
  styleUrl: './custom-fields.component.css'
})
export class CustomFieldsComponent implements OnInit {

  private router = inject(Router);
  private activateRoute = inject(ActivatedRoute);
  private customFieldService = inject(CustomFieldsService);
  private paginationState = inject(PaginationStateService);
  private toasterService = inject(ToasterMessageService);

  customFields: CustomFieldObject[] = [];
  private searchSubject = new Subject<string>();

  loadData: boolean = false;
  searchTerm: string = '';
  private trimmedSearchTerm: string = ''; // Track the last valid trimmed search term
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  totalPages: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  isModalOpen = false;
  isActivateModalOpen: boolean = false;
  isLoading: boolean = false;
  selectedField: number | null = null;
  // fieldIdToDelete: number | null = null;
  modalTitle: string = '';
  modalMessage: string = '';
  modalMessage2: string = '';
  modalButtonText: string = '';
  targetStatus: boolean = false;
  // selectedFieldId: number | null = null;

  ngOnInit(): void {
    this.getAllCustomFields(this.currentPage);
    this.activateRoute.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || 1;
      this.currentPage = pageFromUrl;
      this.paginationState.setPage('custom-fields/all-custom-fields', this.currentPage);
      this.getAllCustomFields(this.currentPage);
    });

    this.searchSubject.pipe(debounceTime(600)).subscribe(() => {
      // Only trigger search if the trimmed search term has actually changed
      const trimmedValue = this.searchTerm.trim();
      if (trimmedValue !== this.trimmedSearchTerm) {
        this.trimmedSearchTerm = trimmedValue;
        this.currentPage = 1;
        this.getAllCustomFields(this.currentPage, this.trimmedSearchTerm);
      }
    });

  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.customFields = [...this.customFields].sort((a, b) => {
      const nameA = a.input_option.label?.toLowerCase() || '';
      const nameB = b.input_option.label?.toLowerCase() || '';
      if (this.sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }




  private getAllCustomFields(pageNumber: number, searchTerm: string = ''): void {
    this.loadData = false;
    // const filters: CustomFieldFilters = {
    //   is_active: true
    // };
    this.customFieldService.getAllCustomFields(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      // ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalPages = response.data.total_pages;
        this.customFields = response.data.list_items;
        this.sortDirection = 'desc';
        this.currentSortColumn = 'name';
        this.sortBy();
        this.loadData = false;
      },
      error: (err) => {
        console.error(err.error?.details);
        this.loadData = false;
      }
    });
  }

  /**
   * Handle search input change
   * Trims whitespace and only triggers search if the trimmed value has changed
   */
  onSearchChange() {
    // Update the searchTerm model directly from the input
    // The debounce will handle when to actually trigger the search
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllCustomFields(this.currentPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationState.setPage('...', page);
    this.router.navigate([], {
      relativeTo: this.activateRoute,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  navigateToEdit(customFieldId: number): void {
    this.paginationState.setPage('custom-fields', this.currentPage);
    this.router.navigate(['/custom-fields/manage-custom-fields', customFieldId]);
  }


  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  openActivateModal(id: number): void {
    this.selectedField = id;
    this.isActivateModalOpen = true;
  }

  closeActivateModal(): void {
    this.isActivateModalOpen = false;
    this.selectedField = null;
  }


  openToggleModal(id: number, currentStatus: boolean): void {
    this.selectedField = id;
    this.targetStatus = !currentStatus;
    this.isActivateModalOpen = true;
    if (this.targetStatus) {
      this.modalTitle = 'Activate Field';
      this.modalMessage = 'Are you sure you want to Activate this field?';
      this.modalMessage2 = 'You will be able to use this field after activation';
      this.modalButtonText = 'Activate';
    } else {
      this.modalTitle = 'Deactivate Field';
      this.modalMessage = 'Are you sure you want to Deactivate this field?';
      this.modalMessage2 = 'This field will become inactive and unusable';
      this.modalButtonText = 'Deactivate';
    }
  }


  confirmToggleStatus(): void {
    if (!this.selectedField) return;

    this.isLoading = true;
    const idField = this.selectedField;
    const newStatus = this.targetStatus;

    this.customFieldService.updateCustomFieldStatus(idField, newStatus).subscribe({
      next: () => {
        this.isLoading = false;
        this.closeActivateModal();
        this.customFields = this.customFields.map(field => {
          if (field.id === idField) {
            return { ...field, status: newStatus };
          }
          return field;
        });
        this.toasterService.showSuccess(`Field ${newStatus ? 'Activated' : 'Deactivated'} Successfully`);
        this.getAllCustomFields(this.currentPage);
      },
      error: (err) => {
        this.isLoading = false;
        this.closeActivateModal();
        this.toasterService.showError('Failed to update status');
        console.error(err);
      }
    });
  }



}




