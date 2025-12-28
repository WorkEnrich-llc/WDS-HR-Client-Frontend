
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BonusDeductionsService } from '../bonus-deductions.service';
import { map, switchMap, filter } from 'rxjs/operators';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TableComponent } from "app/components/shared/table/table.component";
import { PopupComponent } from "app/components/shared/popup/popup.component";
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
    selector: 'app-view-bonus-deduction',
    templateUrl: './view-bonus-deduction.component.html',
    styleUrls: ['./view-bonus-deduction.component.css'],
    standalone: true,
    providers: [DatePipe],
    imports: [PageHeaderComponent, FormsModule, DatePipe, TableComponent, RouterLink, PopupComponent]
})
export class ViewBonusDeductionComponent implements OnInit {
    bonusDeduction: any = null;
    isLoading = true;
    recipientSearch = '';
    recipients: Array<{ id: string | number, name: string }> = [];
    recipientsPage = 1;
    recipientsPerPage = 10;
    isLoadingRecipients = false;
    breadcrumbs = [
        { label: 'Payroll', link: '/payroll-components' },
        { label: 'Bonus & Deductions', link: '/bonus-deductions/all-bonus-deductions' },
        { label: 'View Bonus/Deduction' }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private bonusDeductionsService: BonusDeductionsService,
        private toaster: ToasterMessageService
    ) { }

    ngOnInit(): void {
        this.isLoading = true;
        this.route.paramMap.pipe(
            map(params => params.get('id')),
            filter((id): id is string => id !== null),
            switchMap(id => this.bonusDeductionsService.getBonusDeductionById(id))
        ).subscribe(data => {
            this.bonusDeduction = data?.data?.object_info || null;
            this.recipients = Array.isArray(this.bonusDeduction?.sub_related)
                ? this.bonusDeduction.sub_related.map((emp: any) => ({
                    id: emp.id,
                    name: emp.name
                }))
                : [];
            this.isLoading = false;
        }, () => {
            this.isLoading = false;
        });
    }

    get filteredRecipients() {
        let filtered = this.recipients;
        if (this.recipientSearch) {
            const search = this.recipientSearch.toLowerCase();
            filtered = filtered.filter(emp =>
                String(emp.id).toLowerCase().includes(search) || (emp.name || '').toLowerCase().includes(search)
            );
        }
        const start = (this.recipientsPage - 1) * this.recipientsPerPage;
        return filtered.slice(start, start + this.recipientsPerPage);
    }

    get totalRecipients() {
        if (!this.recipientSearch) return this.recipients.length;
        const search = this.recipientSearch.toLowerCase();
        return this.recipients.filter(emp =>
            String(emp.id).toLowerCase().includes(search) || (emp.name || '').toLowerCase().includes(search)
        ).length;
    }

    onRecipientsPageChange(page: number) {
        this.recipientsPage = page;
    }

    onRecipientsPerPageChange(perPage: number) {
        this.recipientsPerPage = perPage;
        this.recipientsPage = 1;
    }

    removeOpen = false;

    openRemove() {
        this.removeOpen = true;
    }

    closeRemove() {
        this.removeOpen = false;
    }

    confirmRemove() {
        if (!this.bonusDeduction?.id) {
            return;
        }

        this.bonusDeductionsService.deleteBonusDeduction(this.bonusDeduction.id).subscribe({
            next: () => {
                this.closeRemove();
                this.router.navigate(['/bonus-deductions/all-bonus-deductions']);
            },
            error: (error) => {
                this.toaster.showError('Failed to remove Bonus/Deduction.');
                console.error('Error removing Bonus/Deduction:', error);
            }
        });
    }
}
