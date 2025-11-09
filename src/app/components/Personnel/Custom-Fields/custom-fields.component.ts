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
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  totalPages: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  isModalOpen = false;
  isDeleteModalOpen: boolean = false;
  isLoading: boolean = false;
  selectedField: number | null = null;

  ngOnInit(): void {
    this.getAllCustomFields(this.currentPage);
    this.activateRoute.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || 1;
      this.currentPage = pageFromUrl;
      this.paginationState.setPage('custom-fields/all-custom-fields', this.currentPage);
      this.getAllCustomFields(this.currentPage);
    });

    this.searchSubject.pipe(debounceTime(600)).subscribe(value => {
      this.getAllCustomFields(this.currentPage, value);
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
    const filters: CustomFieldFilters = {
      is_active: true
    };
    this.customFieldService.getAllCustomFields(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
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
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }

  onSearchChange() {
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

  openDeleteModal(id: number): void {
    this.selectedField = id;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedField = null;
  }

  confirmRemove(): void {
    console.log('Deleting :', this.selectedField);
    if (!this.selectedField) {
      return;
    }
    console.log('Deleting field with ID:', this.selectedField);

    this.isLoading = true;
    const fieldIdToDelete = this.selectedField;

    this.customFieldService.updateCustomFieldStatus(fieldIdToDelete, false).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.toasterService.showSuccess('Deleted successfully');
        this.isLoading = false;
        this.getAllCustomFields(this.currentPage);
      },
      error: (err) => {
        this.isLoading = false;
        this.closeDeleteModal();
        this.toasterService.showError('Failed to delete');
        console.error(err);
      }
    });
  }



}




