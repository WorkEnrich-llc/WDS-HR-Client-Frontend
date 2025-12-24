

import { Component, OnInit } from '@angular/core';
import { PageHeaderComponent } from "app/components/shared/page-header/page-header.component";
import { BonusDeductionsService } from './bonus-deductions.service';
import { TableComponent } from 'app/components/shared/table/table.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
    selector: 'app-bonus-deductions',
    templateUrl: './bonus-deductions.component.html',
    styleUrls: ['./bonus-deductions.component.css'],
    standalone: true,
    imports: [PageHeaderComponent, TableComponent, FormsModule, RouterLink, DatePipe, CommonModule, PopupComponent]
})
export class BonusDeductionsComponent implements OnInit {
    filteredList: any[] = [];
    paginatedList: any[] = [];
    isLoading = false;
    totalItems = 0;
    itemsPerPage = 10;
    currentPage = 1;
    searchTerm = '';

    // Delete confirmation
    showDeleteConfirmation = false;
    itemToDelete: any = null;

    constructor(
        private bonusDeductionsService: BonusDeductionsService,
        private toaster: ToasterMessageService
    ) { }

    ngOnInit(): void {
        this.fetchData();
    }

    fetchData(): void {
        this.isLoading = true;
        this.bonusDeductionsService.getBonusDeductions(this.currentPage, this.itemsPerPage).subscribe({
            next: (res) => {
                const list = res?.data?.list_items || [];
                this.paginatedList = list;
                this.filteredList = list;
                this.totalItems = res?.data?.total_items || list.length;
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                this.filteredList = [];
                this.paginatedList = [];
                this.totalItems = 0;
                console.error('Failed to load Bonus & Deductions:', err);
            }
        });
    }

    onSearchChange(): void {
        this.currentPage = 1;
        this.fetchData();
    }

    // Filtering is now handled server-side via API pagination

    onPageChange(page: number): void {
        this.currentPage = page;
        this.fetchData();
    }

    onItemsPerPageChange(count: number): void {
        this.itemsPerPage = count;
        this.currentPage = 1;
        this.fetchData();
    }

    openDeleteConfirmation(item: any): void {
        this.itemToDelete = item;
        this.showDeleteConfirmation = true;
    }

    closeDeleteConfirmation(): void {
        this.showDeleteConfirmation = false;
        this.itemToDelete = null;
    }

    confirmDelete(): void {
        if (!this.itemToDelete) {
            return;
        }

        this.bonusDeductionsService.deleteBonusDeduction(this.itemToDelete.id).subscribe({
            next: () => {
                this.closeDeleteConfirmation();
                this.fetchData();
            },
            error: (error) => {
                this.toaster.showError('Failed to delete Bonus/Deduction.');
                console.error('Error deleting Bonus/Deduction:', error);
            }
        });
    }
}
