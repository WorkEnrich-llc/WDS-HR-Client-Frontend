import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PayrollComponentsService } from 'app/core/services/payroll/payroll-components/payroll-components.service';
import { PayrollComponent } from 'app/core/models/payroll';
import { DatePipe } from '@angular/common';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';


@Component({
  selector: 'app-view-payroll-component',
  imports: [PageHeaderComponent, PopupComponent, RouterLink, DatePipe],
  templateUrl: './view-payroll-component.component.html',
  styleUrl: './view-payroll-component.component.css'
})
export class ViewPayrollComponentComponent implements OnInit {

  deactivateOpen = false;
  activateOpen = false;
  private payrollService = inject(PayrollComponentsService);
  private toasterMessageService = inject(ToasterMessageService);
  private route = inject(ActivatedRoute);
  id!: number;
  componentData!: PayrollComponent;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadComponentData();
  }

  private loadComponentData(): void {
    this.payrollService.getComponentById(this.id).subscribe({
      next: (data) => {
        this.componentData = this.mapComponentData(data);
      },
      error: (err) => console.error('Failed to load component', err)
    });
  }

  private mapComponentData(data: any) {
    return {
      ...data,
      component_type: data.component_type?.name ?? '',
      classification: data.classification?.name ?? '',
    };
  }

  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }

  confirmDeactivate() {
    this.deactivateOpen = false;

    const compStatus = {
      request_data: {
        status: false
      }
    };
    this.payrollService.updateComponentStatus(this.id, compStatus).subscribe({
      next: () => {
        this.loadComponentData();
        this.toasterMessageService.showSuccess("Payroll Component Updated successfully","Status Updated");
      },
      error: (err) => console.error('Failed to update status', err)
    });
  }

  confirmActivate() {
    this.activateOpen = false;
    const compStatus = {
      request_data: {
        status: true
      }
    };
    this.payrollService.updateComponentStatus(this.id, compStatus).subscribe({
      next: () => {
        this.loadComponentData();
         this.toasterMessageService.showSuccess("Payroll Component Updated successfully","Status Updated");
      },
      error: (err) => console.error('Failed to update status', err)
    });
  }

  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }




}
