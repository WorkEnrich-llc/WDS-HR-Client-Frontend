import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { RouterLink } from '@angular/router';
import { PermissionsService } from '../../../../core/services/attendance/permissions/permissions.service';
import { CommonModule } from '@angular/common';
import { OverlayFilterBoxComponent } from 'app/components/shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  selector: 'app-permission',
  imports: [PageHeaderComponent, RouterLink, CommonModule,OverlayFilterBoxComponent],
  templateUrl: './permission.component.html',
  styleUrl: './permission.component.css',
  encapsulation:ViewEncapsulation.None
})
export class PermissionComponent implements OnInit {
    @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;


  constructor(private _PermissionsService: PermissionsService) { }
  permissions: any;
  ngOnInit(): void {
    this.getpermissions();

  }

  getpermissions() {
    this._PermissionsService.getPermissions().subscribe({
      next: (data) => {
        this.permissions = data.data.object_info;
      },
      error: (error) => {
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
    
    this.filterBox.closeOverlay();
  }
}
