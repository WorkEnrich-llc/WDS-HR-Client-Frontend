import { Component, inject, Input, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminUsersService } from 'app/core/services/admin-settings/users/admin-users.service';
import { IUser } from 'app/core/models/users';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { UserStatus } from '@app/enums';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-view-user',
  imports: [PageHeaderComponent, PopupComponent, CommonModule, RouterLink],
  templateUrl: './view-user.component.html',
  styleUrl: './view-user.component.css'
})
export class ViewUserComponent implements OnInit {

  @Input() isEditMode!: boolean;

  private usersService = inject(AdminUsersService);
  private toasterService = inject(ToasterMessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  userId!: number;
  // userInfo!: IUser;
  userInfo: any;
  // userInfo: Partial<IUser> = {};
  createDate: string = '';
  updatedDate: string = '';
  deactivateOpen = false;
  activateOpen = false;
  removeUserOpen = false;
  isStatusUpdating = false;
  isUserLoading = false;
  isRemovingUser = false;

  userStatus = UserStatus;

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadUserData();
  }



  private loadUserData(): void {
    this.isUserLoading = true;
    this.usersService.getUserById(this.userId)
      .pipe(finalize(() => {
        this.isUserLoading = false;
      }))
      .subscribe({
        next: (data) => {
          this.userInfo = {
            id: data.id,
            name: data.user?.name,
            code: data.user?.code,
            email: data.user?.email,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at,
            is_active: data.is_active,
            roles: (data.permissions ?? []).map((p: any) => ({
              id: p.role?.id,
              name: p.role?.name
            }))
          };

          this.createDate = this.userInfo?.created_at
            ? new Date(this.userInfo.created_at).toLocaleDateString('en-GB')
            : '';
          this.updatedDate = this.userInfo?.updated_at
            ? new Date(this.userInfo.updated_at).toLocaleDateString('en-GB')
            : '';
        }
      });
  }

  private mapUserData(data: any) {
    return {
      ...data,
      permissions: (data.permissions ?? []).map((p: any) => p.role?.id)
      // component_type: data.component_type?.name ?? '',
      // classification: data.classification?.name ?? '',
    };
  }

  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }


  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }


  editUser(): void {
    this.router.navigate(['/users/add-user', 1]);
  }

  confirmDeactivate() {
    if (this.isStatusUpdating) {
      return;
    }
    this.isStatusUpdating = true;
    this.deactivateOpen = false;
    const userStatus = {
      request_data: {
        status: false
      }
    };
    this.usersService.updateUserStatus(this.userId, userStatus).pipe(
      finalize(() => {
        this.isStatusUpdating = false;
      })
    ).subscribe({
      next: () => {
        this.toasterService.showSuccess('User deactivated successfully');
        this.refreshUserDetails();
      },
      error: (err) => console.error('Failed to update status', err)
    });
  }

  confirmActivate() {
    if (this.isStatusUpdating) {
      return;
    }
    this.isStatusUpdating = true;
    this.activateOpen = false;
    const userStatus = {
      request_data: {
        status: true
      }
    };
    this.usersService.updateUserStatus(this.userId, userStatus).pipe(
      finalize(() => {
        this.isStatusUpdating = false;
      })
    ).subscribe({
      next: () => {
        this.toasterService.showSuccess('User activated successfully');
        this.refreshUserDetails();
      },
      error: (err) => console.error('Failed to update status', err)
    });
  }


  resendInvitation(): void {
    this.usersService.searchUser(this.userInfo?.email).subscribe({
      next: (res) => {
        this.toasterService.showSuccess('Invitation resent successfully (search done)');
      },
      error: (err) => {
        console.error('Failed to search user', err);
        this.toasterService.showError('Failed to resend invitation');
      }
    });
  }

  openRemoveUser(): void {
    this.removeUserOpen = true;
  }

  closeRemoveUser(): void {
    this.removeUserOpen = false;
  }

  confirmRemoveUser(): void {
    if (this.isRemovingUser) {
      return;
    }
    this.isRemovingUser = true;
    this.removeUserOpen = false;
    // waiting for backend api
    this.usersService.deleteRole(this.userInfo?.email).pipe(
      finalize(() => {
        this.isRemovingUser = false;
      })
    ).subscribe({
      next: () => {
        this.toasterService.showSuccess('User removed successfully');
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error('Failed to remove user', err);
        this.toasterService.showError('Failed to remove user');
      }
    });
  }


  // confirmDeactivate() {
  //   this.deactivateOpen = false;
  //   this.usersService.updateUserStatus(this.userId, { is_active: false }).subscribe({
  //     next: () => this.loadUserData(),
  //     error: err => console.error('Deactivate failed', err)
  //   });
  // }

  // confirmActivate() {
  //   this.activateOpen = false;
  //   this.usersService.updateUserStatus(this.userId, { is_active: true }).subscribe({
  //     next: () => this.loadUserData(),
  //     error: err => console.error('Activate failed', err)
  //   });
  // }

  private refreshUserDetails(): void {
    this.loadUserData();
  }
}
