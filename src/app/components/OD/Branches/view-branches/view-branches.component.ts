import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { DatePipe } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';
import { GoogleMapsLocationComponent, LocationData } from 'app/components/shared/google-maps-location/google-maps-location.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

interface Department {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  sections: string;
  status: string;
}

@Component({
  selector: 'app-view-branches',
  imports: [PageHeaderComponent, TableComponent, PopupComponent, RouterLink, GoogleMapsModule, SkelatonLoadingComponent, DatePipe],
  providers: [DatePipe],
  templateUrl: './view-branches.component.html',
  styleUrls: ['./view-branches.component.css']
})
export class ViewBranchesComponent {


  constructor(private _BranchesService: BranchesService, private toasterMessageService: ToasterMessageService, private route: ActivatedRoute, private datePipe: DatePipe, private subService: SubscriptionService) { }
  departments: Department[] = [];
  branchData: any = { sections: [] };
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  branchId: string | null = null;
  latitude: number = 0;
  longitude: number = 0;
  loadData: boolean = false;
  branchSub: any;
  ngOnInit(): void {

    // subscription data
    this.subService.subscription$.subscribe(sub => {
      this.branchSub = sub?.Branches;
      // if (this.branchSub) {
      //   console.log("info:", this.branchSub.info);
      //   console.log("create:", this.branchSub.create);
      //   console.log("update:", this.branchSub.update);
      //   console.log("delete:", this.branchSub.delete);
      // }
    });


    this.branchId = this.route.snapshot.paramMap.get('id');
    // this.showBranch(Number(this.branchId));
    if (this.branchId) {
      this.showBranch(Number(this.branchId));
    }
  }

  showBranch(branchId: number) {
    this.loadData = true;
    this._BranchesService.showBranch(branchId).subscribe({
      next: (response) => {
        this.branchData = response.data.object_info;
        this.latitude = this.branchData?.latitude;
        this.longitude = this.branchData?.longitude;
        const created = this.branchData?.created_at;
        const updated = this.branchData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }
        this.loadData = false;
      },
      error: (err) => {
        console.error(err.error?.details);
        this.loadData = false;
      }
    });
  }


  openInGoogleMaps() {
    if (this.latitude && this.longitude) {
      const url = `https://www.google.com/maps?q=${this.latitude},${this.longitude}`;
      window.open(url, '_blank');
    }
  }


  sortDirection: string = 'asc';
  currentSortColumn: string = '';

  sortBy(column: string) {
    this.currentSortColumn = column;
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';

    if (this.branchData.departments && Array.isArray(this.branchData.departments)) {
      this.branchData.departments = [...this.branchData.departments].sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];

        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }


  deactivateOpen = false;
  activateOpen = false;
  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }

  confirmDeactivate() {
    this.deactivateOpen = false;

    const deptStatus = {
      request_data: {
        status: false
      }
    };

    this._BranchesService.updateBranchStatus(this.branchData.id, deptStatus).subscribe({
      next: (response) => {
        this.branchData = response.data.object_info;
        this.toasterMessageService.showSuccess("Branch Status Updated successfully", "Status Updated");
      },
      error: (err) => {
        console.error(err.error?.details);
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
    this.activateOpen = false;
    const deptStatus = {
      request_data: {
        status: true
      }
    };

    this._BranchesService.updateBranchStatus(this.branchData.id, deptStatus).subscribe({
      next: (response) => {
        this.branchData = response.data.object_info;
        this.toasterMessageService.showSuccess("Branch Status Updated successfully", "Status Updated");
      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
  }



}
