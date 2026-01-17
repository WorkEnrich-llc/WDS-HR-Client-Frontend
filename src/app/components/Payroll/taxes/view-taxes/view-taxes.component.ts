import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { TableComponent } from '../../../shared/table/table.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TaxesService } from 'app/core/services/payroll/taxes/taxes.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-view-taxes',
  imports: [PageHeaderComponent, PopupComponent, TableComponent, RouterLink, DecimalPipe],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './view-taxes.component.html',
  styleUrl: './view-taxes.component.css'
})
export class ViewTaxesComponent implements OnInit {

  deactivateOpen = false;
  activateOpen = false;
  private taxesService = inject(TaxesService);
  private toasterMessageService = inject(ToasterMessageService);
  private route = inject(ActivatedRoute);
  id!: number;
  tax: any = null;
  isLoading: boolean = true;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTax();
  }

  private loadTax(): void {
    this.isLoading = true;
    this.taxesService.getById(this.id).subscribe({
      next: (data) => {
        // Service already extracts object_info, so data is the tax object directly
        this.tax = data || null;
        if (this.tax) {
          // Extract main_salary fields
          this.tax.minimum = this.tax.main_salary?.minimum || 0;
          this.tax.maximum = this.tax.main_salary?.maximum || 0;
          this.tax.exemption = this.tax.main_salary?.exemption || 0;
          // Ensure brackets is an array
          this.tax.brackets = this.tax.brackets || [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tax', err);
        this.tax = null;
        this.isLoading = false;
      }
    });
  }

  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }

  confirmDeactivate() {
    if (!this.id) return;

    this.taxesService.updateStatus(this.id, false).subscribe({
      next: () => {
        this.loadTax();
        this.toasterMessageService.showSuccess("Tax Updated successfully", "Status Updated");
        this.closeDeactivate();
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.closeDeactivate();
      }
    });
  }

  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }

  confirmActivate() {
    if (!this.id) return;

    this.taxesService.updateStatus(this.id, true).subscribe({
      next: () => {
        this.loadTax();
        this.toasterMessageService.showSuccess("Tax Updated successfully", "Status Updated");
        this.closeActivate();
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.closeActivate();
      }
    });
  }

  getDeactivateMessage(): string {
    return `Are you sure you want to Deactivate the Tax "${this.tax?.name || ''}"?`;
  }

  getActivateMessage(): string {
    return `Are you sure you want to Activate the Tax "${this.tax?.name || ''}"?`;
  }

}
