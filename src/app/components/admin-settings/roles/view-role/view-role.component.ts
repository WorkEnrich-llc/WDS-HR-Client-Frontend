import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminRolesService } from 'app/core/services/admin-settings/roles/admin-roles.service';
import { ModulePermission, Roles } from 'app/core/models/roles';
import { finalize } from 'rxjs';
import { TableComponent } from 'app/components/shared/table/table.component';

interface PermissionRow {
  moduleName: string;
  serviceName: string;
  actions: string[];
}

@Component({
  selector: 'app-view-role',
  standalone: true,
  imports: [PageHeaderComponent, CommonModule, RouterLink, FormsModule, TableComponent],
  templateUrl: './view-role.component.html',
  styleUrl: './view-role.component.css'
})
export class ViewRoleComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rolesService = inject(AdminRolesService);

  roleId!: number;
  roleDetails: Roles | null = null;
  isLoading = false;

  selectedTab: 'permissions' | 'users' = 'permissions';
  permissionsSearch = '';
  usersSearch = '';

  get currentSearch(): string {
    return this.selectedTab === 'permissions' ? this.permissionsSearch : this.usersSearch;
  }

  set currentSearch(value: string) {
    if (this.selectedTab === 'permissions') {
      this.permissionsSearch = value;
    } else {
      this.usersSearch = value;
    }
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = Number(idParam);

    if (!idParam || Number.isNaN(parsedId)) {
      this.router.navigate(['/roles/all-role']);
      return;
    }

    this.roleId = parsedId;
    this.loadRoleDetails();
  }

  private loadRoleDetails(): void {
    this.isLoading = true;
    this.rolesService.getRoleById(this.roleId)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (role) => {
          if (!role) {
            this.router.navigate(['/roles/all-role']);
            return;
          }

          this.roleDetails = role;
        },
        error: () => {
          this.router.navigate(['/roles/all-role']);
        }
      });
  }

  formatDate(date?: string, includeTime = false): string {
    if (!date) {
      return '';
    }

    const options: Intl.DateTimeFormatOptions = includeTime
      ? {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
      : {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      };

    return new Date(date).toLocaleString('en-GB', options);
  }

  onEditRole(): void {
    if (!this.roleId) {
      return;
    }
    this.router.navigate(['/roles/edit-role', this.roleId]);
  }

  trackByModule = (_index: number, module: Roles['permissions'][number]) => module.moduleCode ?? module.moduleName ?? _index;

  trackBySubModule = (_index: number, subModule: Roles['permissions'][number]['subModules'][number]) => subModule.code ?? subModule.subName ?? _index;

  trackByUser = (_index: number, user: NonNullable<Roles['users']>[number]) => user.id ?? _index;

  getUserAddedDate(user: NonNullable<Roles['users']>[number]): string | null {
    const value = (user as any)?.added_date;
    return typeof value === 'string' ? value : null;
  }

  get activeModulesCount(): number {
    return this.roleDetails?.permissions?.length ?? 0;
  }

  get permissionsCount(): number {
    if (!this.roleDetails?.permissions) {
      return 0;
    }
    return this.roleDetails.permissions.reduce((total, module) => {
      return total + module.subModules.reduce((subTotal, sub) => {
        return subTotal + (sub.actions?.length ?? (sub.activeActions?.filter(a => a.status).length ?? 0));
      }, 0);
    }, 0);
  }

  get totalUsersCount(): number {
    return this.roleDetails?.total_users ?? this.roleDetails?.users?.length ?? 0;
  }

  get activeUsersCount(): number {
    if (!this.roleDetails?.users) {
      return 0;
    }
    return this.roleDetails.users.filter(user => (user as any)?.is_active ?? true).length;
  }

  get mainInformation(): { label: string; value: string | number }[] {
    return [
      { label: 'Role ID', value: this.roleDetails?.id ?? '—' },
      { label: 'Role Name', value: this.roleDetails?.name || '—' },
      { label: 'Active Modules', value: this.activeModulesCount },
      { label: 'Allowed Permissions', value: this.permissionsCount },
      { label: 'Active Users', value: this.activeUsersCount },
      { label: 'Total Users', value: this.totalUsersCount }
    ];
  }

  onSelectTab(tab: 'permissions' | 'users'): void {
    this.selectedTab = tab;
  }

  get permissionRows(): PermissionRow[] {
    if (!this.roleDetails?.permissions) {
      return [];
    }

    const rows: PermissionRow[] = [];

    this.roleDetails.permissions.forEach((module: ModulePermission) => {
      module.subModules.forEach(sub => {
        const actions = this.getAllowedActions(sub);
        rows.push({
          moduleName: module.moduleName || `Module ${module.moduleCode ?? ''}`,
          serviceName: sub.subName || `Service ${sub.code ?? ''}`,
          actions
        });
      });
    });

    return rows;
  }

  get filteredPermissionRows(): PermissionRow[] {
    const term = this.permissionsSearch.trim().toLowerCase();
    if (!term) {
      return this.permissionRows;
    }
    return this.permissionRows.filter(row =>
      row.moduleName.toLowerCase().includes(term) ||
      row.serviceName.toLowerCase().includes(term) ||
      row.actions.some(action => action.toLowerCase().includes(term))
    );
  }

  get filteredUsers(): NonNullable<Roles['users']>[number][] {
    const users = this.roleDetails?.users ?? [];
    const term = this.usersSearch.trim().toLowerCase();
    if (!term) {
      return users;
    }
    return users.filter(user => {
      const name = user.name?.toLowerCase() ?? '';
      const email = user.email?.toLowerCase() ?? '';
      return name.includes(term) || email.includes(term);
    });
  }

  formatUserId(user: NonNullable<Roles['users']>[number]): string {
    const id = user.id ?? '';
    return id.toString().padStart(2, '0');
  }

  getUserEmail(user: NonNullable<Roles['users']>[number]): string {
    return user.email || '—';
  }

  getAllowedActions(subModule: Roles['permissions'][number]['subModules'][number]): string[] {
    if (!subModule) {
      return [];
    }
    if (subModule.actions?.length) {
      return subModule.actions;
    }
    return (subModule.activeActions || [])
      .filter(action => action.status)
      .map(action => action.name);
  }

  getUserStatusBadge(user: NonNullable<Roles['users']>[number]): 'success' | 'neutral' | 'danger' {
    const status = (user as any)?.status?.toString().toLowerCase();
    if (status === 'active') {
      return 'success';
    }
    if (status === 'inactive' || status === 'not active' || status === 'pending') {
      return 'neutral';
    }
    if (status === 'expired') {
      return 'danger';
    }

    if ((user as any)?.is_active) {
      return 'success';
    }

    return 'neutral';
  }

  getUserStatusLabel(user: NonNullable<Roles['users']>[number]): string {
    return (user as any)?.status ?? ((user as any)?.is_active ? 'Active' : 'Inactive');
  }

  getUserBadgeClass(user: NonNullable<Roles['users']>[number]): string {
    const badge = this.getUserStatusBadge(user);
    if (badge === 'success') {
      return 'badge-success';
    }
    if (badge === 'neutral') {
      return 'badge-gray';
    }
    return 'badge-danger';
  }
}
