import { Component, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { RouterLink } from '@angular/router';
import { PermissionsService } from '../../../../core/services/attendance/permissions/permissions.service';

import { OverlayFilterBoxComponent } from 'app/components/shared/overlay-filter-box/overlay-filter-box.component';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-permission',
  imports: [PageHeaderComponent, RouterLink, OverlayFilterBoxComponent, FormsModule, DecimalPipe],
  templateUrl: './permission.component.html',
  styleUrl: './permission.component.css',
  encapsulation: ViewEncapsulation.None
})
export class PermissionComponent implements OnInit {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  private toasterService = inject(ToasterMessageService);

  permissions: any;
  tempIsShared: boolean = false;
  isLoading = false;

  constructor(private _PermissionsService: PermissionsService) { }
  ngOnInit(): void {
    this.getPermissions();

  }

  getPermissions() {
    this.isLoading = true;
    this._PermissionsService.getPermissions().subscribe({
      next: (data) => {
        this.permissions = data.data.object_info;
        this.tempIsShared = this.permissions.is_shared_minutes;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching permissions:', error);
      }
    });
  }


  getTime(totalMinutes: number | undefined) {
    if (totalMinutes == null) return { hours: 0, minutes: 0 };

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  }

  discardChanges(): void {
    if (this.permissions) {
      this.tempIsShared = this.permissions.is_shared_minutes;
    }
    this.filterBox.closeOverlay();
  }

  // discardChanges(): void {
  //   this.tempIsShared = this.permissions?.is_shared_minutes;
  //   this.filterBox.closeOverlay();
  // }


  // discardChanges(): void {

  //   this.filterBox.closeOverlay();
  // }

  saveSetting() {
    if (this.permissions) {
      this.permissions.is_shared_minutes = this.tempIsShared;
    }
    this.filterBox.closeOverlay();
  }


  saveSettings() {
    this.isLoading = true;

    const late = this.permissions?.late_arrive || {};
    const early = this.permissions?.early_leave || {};
    const shared = this.permissions?.shared_minutes || {};

    const formData = new FormData();

    formData.append('is_shared_minutes', this.tempIsShared ? 'true' : 'false');

    formData.append('late_arrive_minutes', late.minutes ? late.minutes.toString() : '');
    formData.append('late_arrive_note', late.note || '');
    formData.append('late_arrive_status', late.minutes || late.note ? 'true' : 'false');

    formData.append('early_leave_minutes', early.minutes ? early.minutes.toString() : '');
    formData.append('early_leave_note', early.note || '');
    formData.append('early_leave_status', early.minutes || early.note ? 'true' : 'false');


    formData.append('shared_minutes', shared.minutes ? shared.minutes.toString() : '');
    formData.append('shared_note', shared.note || '');
    formData.append('shared_status', shared.minutes || shared.note ? 'true' : 'false');


    this._PermissionsService.updatePermission(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.permissions.is_shared_minutes = this.tempIsShared;

        this.toasterService.showSuccess('Settings updated successfully', "Updated Successfully");
        this.filterBox.closeOverlay();

      },
      error: (err) => {
        this.isLoading = false;
        this.toasterService.showError('Failed to update settings');
        console.error(err);
      }
    });
  }




}
