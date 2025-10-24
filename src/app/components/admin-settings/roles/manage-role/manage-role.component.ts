import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OverlayFilterBoxComponent } from 'app/components/shared/overlay-filter-box/overlay-filter-box.component';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { TableComponent } from 'app/components/shared/table/table.component';
import { Employee, EmployeesResponse } from 'app/core/interfaces/employee';
import { ActionType, ModulePermission, Roles, RoleUser, SubModulePermission } from 'app/core/models/roles';
import { ISearchParams, IUserApi, IUser } from 'app/core/models/users';
import { AdminRolesService } from 'app/core/services/admin-settings/roles/admin-roles.service';
import { AdminUsersService } from 'app/core/services/admin-settings/users/admin-users.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';
import { RolesService } from 'app/core/services/roles/roles.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { Subject } from 'rxjs';

interface AllowedAction {
  name: string;
  status: boolean;
}

interface SubFeature {
  sub: { id: number; name: string; code: number };
  is_support?: boolean;
  allowed_actions?: AllowedAction[];
}

interface FeatureData {
  code: number,
  name: string;
  sub_list: SubFeature[];
}


@Component({
  selector: 'app-manage-role',
  imports: [PageHeaderComponent, PopupComponent, CommonModule, ReactiveFormsModule, TableComponent, OverlayFilterBoxComponent, FormsModule],
  templateUrl: './manage-role.component.html',
  styleUrl: './manage-role.component.css'
})
export class ManageRoleComponent implements OnInit {
  @ViewChild('usersOverlay') usersOverlay!: OverlayFilterBoxComponent;
  createRoleForm!: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private adminRolesService = inject(AdminRolesService);
  private toasterService = inject(ToasterMessageService);
  private employeesService = inject(EmployeeService);
  private paginationState = inject(PaginationStateService);
  removedUsers: number[] = [];

  isEditMode = false;
  id?: number;
  roleId!: number;
  createDate: string = '';
  updatedDate: string = '';

  totalItems: number = 0;
  itemsPerPage: number = 10;
  totalPages: number = 0;

  addedTotalUsers = 0;
  addedPage = 1;
  addedItemsPerPage = 10;
  currentPage: number = 1;

  allUsers: IUser[] = [];
  originalUsers: IUser[] = [];
  addedUsers: (IUser & { isNew?: boolean })[] = [];
  paginatedAddedUsers: (IUser & { isNew?: boolean })[] = [];
  selectAllUsers: boolean = false;
  selectAllOverlay: boolean = false;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private pendingSelections = new Map<number, IUser>();

  constructor(
    // private router: Router,
    private rolesService: RolesService,
  ) { }
  private userService = inject(AdminUsersService);
  errMsg = '';
  isLoading: boolean = false;




  mappedData: Record<string, FeatureData> = {};
  selectedMain: FeatureData | null = null;
  selectedSub: SubFeature | null = null;

  private getSubKey(sub: { code?: number; id?: number }): string {
    return String(sub.code ?? sub.id);
  }

  get hasSelectedUsers(): boolean {
    return this.addedUsers?.some(user => user.isSelected);
  }


  selectedActionsMap = new Map<string, Set<string>>();

  ngOnInit() {
    this.initFormModels();
    this.getAllUsers();
    this.getAllRoles();
    this.updatePaginatedAddedUsers();
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.roleId = +id;
        this.loadRoleForEdit(this.roleId);
      }
    });

  }

  private initFormModels(): void {
    this.createRoleForm = this.fb.group({
      code: [''],
      name: ['', Validators.required],
      users: [[]],
      permissions: this.fb.array([])
    })
  }

  get permissions(): FormArray {
    return this.createRoleForm.get('permissions') as FormArray;
  }

  togglePermission(actionId: number, checked: boolean) {
    if (checked) {
      this.permissions.push(new FormControl(actionId));
    } else {
      const index = this.permissions.controls.findIndex(x => x.value === actionId);
      if (index >= 0) this.permissions.removeAt(index);
    }

    this.permissions.updateValueAndValidity();
  }

  // users
  openUsersOverlay() {
    this.searchTerm = '';
    this.usersOverlay.openOverlay();
  }




  private getAllUsers(filters?: ISearchParams): void {
    this.employeesService.getEmployeesForAddRoles(this.currentPage, this.itemsPerPage, filters?.search || '').subscribe({
      next: (response: EmployeesResponse) => {
        this.totalItems = response.data.total_items;
        this.totalPages = response.data.total_pages;
        this.currentPage = response.data.page ? Number(response.data.page) : this.currentPage;

        const users: IUser[] = response.data.list_items.map((e: Employee) => {
          if (this.pendingSelections.has(e.id)) {
            return this.pendingSelections.get(e.id)!;
          }
          const alreadyAdded = this.addedUsers.some((added: IUser) => added.id === e.id);
          return {
            id: e.id,
            name: e.contact_info?.name ?? '',
            email: e.contact_info?.email ?? '',
            code: e.contact_info?.mobile?.number?.toString() ?? '',
            created_at: e.created_at,
            updated_at: e.updated_at,
            status: e.employee_active,
            permissions: [],
            isSelected: alreadyAdded
          } as IUser;
        });

        this.originalUsers = users;
        this.allUsers = [...users];

        this.selectAllUsers = users.length > 0 && users.every(u => u.isSelected);
        this.updateSelectAllOverlayState();
      },
      error: (err: any) => {
        this.errMsg = err.error?.details ?? 'Failed to load employees';
      }
    });
  }

  private updateSelectAllOverlayState(): void {
    if (this.allUsers.length === 0) {
      this.selectAllOverlay = false;
      return;
    }
    this.selectAllOverlay = this.allUsers.every(u => u.isSelected);
  }

  onAddedPageChange(page: number) {
    this.addedPage = page;
    this.updatePaginatedAddedUsers();
  }

  onAddedItemsPerPageChange(perPage: number) {
    this.addedItemsPerPage = perPage;
    this.addedPage = 1;
    this.updatePaginatedAddedUsers();
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllUsers();
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllUsers();
  }

  private updatePaginatedAddedUsers(): void {
    const startIndex = (this.addedPage - 1) * this.addedItemsPerPage;
    const endIndex = startIndex + this.addedItemsPerPage;

    this.paginatedAddedUsers = this.addedUsers.slice(startIndex, endIndex);

    if (this.paginatedAddedUsers.length === 0 && this.addedPage > 1) {
      this.addedPage--;
      this.updatePaginatedAddedUsers();
    }
  }


  onSearchChange() {
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      this.allUsers = this.originalUsers.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.code.toLowerCase().includes(term)
      );
    } else {
      this.allUsers = [...this.originalUsers];
    }

    this.selectAllUsers = this.allUsers.length > 0 && this.allUsers.every(u => u.isSelected);
  }


  toggleSelectAllSelected(): void {
    this.addedUsers.forEach(user => (user.isSelected = this.selectAllUsers));
  }

  toggleUsers(user: IUser) {
    if (!user.isSelected) {
      this.selectAllUsers = false;
    } else if (this.addedUsers.length && this.addedUsers.every((u: IUser) => u.isSelected)) {
      this.selectAllUsers = true;
    }
  }



  toggleUsersOverlay(user: IUser): void {
    // if (!user.isSelected) {
    //   this.selectAllOverlay = false;
    // } else if (this.allUsers.length && this.allUsers.every(u => u.isSelected)) {
    //   this.selectAllOverlay = true;
    // }
    if (user.isSelected) {
      this.pendingSelections.set(user.id, user);
    } else {
      this.pendingSelections.delete(user.id);
    }
    this.updateSelectAllOverlayState();
  }

  toggleSelectAll() {
    // this.allUsers.forEach((user: IUser) => {
    //   user.isSelected = this.selectAllOverlay;
    // });
    this.allUsers.forEach((user: IUser) => {
      user.isSelected = this.selectAllOverlay;

      if (this.selectAllOverlay) {
        this.pendingSelections.set(user.id, user);
      } else {
        this.pendingSelections.delete(user.id);
      }
    });
  }


  // addSelectedUserss() {
  //   const selected = this.allUsers.filter(u => u.isSelected);

  //   selected.forEach(user => {
  //     if (!this.addedUsers.some(au => au.id === user.id)) {
  //       // this.addedUsers.push(user);
  //       this.addedUsers.push({ ...(user as IUser), isNew: true } as IUser & { isNew: boolean });
  //     }
  //   });

  //   this.createRoleForm.patchValue({
  //     users: this.addedUsers.map(u => u.id)
  //   });

  //   this.usersOverlay.closeOverlay();
  // }

  removeUser(user: IUser): void {
    this.addedUsers = this.addedUsers.filter(u => u.id !== user.id);
    this.pendingSelections.delete(user.id);
    const match = this.allUsers.find(u => u.id === user.id);
    if (match) {
      match.isSelected = false;
    }

    this.selectAllUsers = this.allUsers.length > 0 && this.allUsers.every(u => u.isSelected);
    this.createRoleForm.patchValue({
      users: this.addedUsers.map(u => u.id)
    });

    if (this.isEditMode && user.id && !this.removedUsers.includes(user.id)) {
      this.removedUsers.push(user.id);
    }
    this.updatePaginatedAddedUsers();
  }


  removeSelectedUsers(): void {
    this.addedUsers = this.addedUsers.filter(user => !user.isSelected);

    this.allUsers.forEach(user => {
      if (this.addedUsers.every(a => a.id !== user.id)) {
        user.isSelected = false;
      }
    });

    this.selectAllUsers = this.addedUsers.length > 0 && this.addedUsers.every(user => user.isSelected);
    this.updatePaginatedAddedUsers();
  }

  addSelectedUsers() {
    const selected = Array.from(this.pendingSelections.values());

    selected.forEach(user => {
      if (!this.addedUsers.some(au => au.id === user.id)) {
        this.addedUsers.push({ ...(user as IUser), isNew: true } as IUser & { isNew: boolean });
      }
    });

    this.pendingSelections.clear();

    this.createRoleForm.patchValue({
      users: this.addedUsers.map(u => u.id)
    });

    this.usersOverlay.closeOverlay();
    this.allUsers.forEach(user => {
      if (this.addedUsers.some(au => au.id === user.id)) {
        user.isSelected = true;
      }
    });
    this.updatePaginatedAddedUsers();
  }

  discardUsers(): void {
    this.pendingSelections.clear();
    this.allUsers.forEach(user => {
      user.isSelected = false;
    });
    this.addedUsers = this.addedUsers.filter(u => !u.isNew);
    this.selectAllOverlay = false;
    this.usersOverlay.closeOverlay();
    this.searchTerm = '';
  }


  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.addedUsers = this.addedUsers.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }


  // ------------
  getAllRoles() {
    this.rolesService.getroles().subscribe({
      next: (response) => {
        const orderedKeys = [
          "Admin Dashboard",
          "Operational Development",
          "Personnel",
          "Attendance",


          "Recruitment System",
          "Payroll",
          "Admin Settings"
        ];

        this.createDate = new Date().toLocaleDateString('en-GB');

        const features = response.data?.features ?? [];
        this.mappedData = {};

        orderedKeys.forEach((key) => {
          const feature = features.find((f: any) => f.main?.name === key);
          if (feature) {
            const cleanKey = key.replace(/\s+/g, "_");
            this.mappedData[cleanKey] = {
              code: feature.main?.code,
              name: feature.main?.name,
              sub_list: feature.sub_list || []
            };
          }
        });
        // console.log(this.mappedData);
      },
      error: (err) => {
        // console.log(err.error?.details);
        this.errMsg = err.error?.details;
      }
    });
  }

  selectMain(feature: FeatureData) {
    this.selectedMain = feature;
    this.selectedSub = null;
  }


  isSelected(sub: SubFeature, action: string): boolean {
    const key = this.getSubKey(sub.sub);
    return this.selectedActionsMap.get(key)?.has(action) ?? false;

  }

  toggleActionForSub(sub: SubFeature, action: string, event: Event) {
    const key = this.getSubKey(sub.sub);
    const set = this.selectedActionsMap.get(key) || new Set<string>();
    const input = event.target as HTMLInputElement;

    if (input.checked) {
      set.add(action);
    } else {
      set.delete(action);
    }
    this.selectedActionsMap.set(key, set);
  }

  isAllSelected(sub: SubFeature): boolean {
    const key = this.getSubKey(sub.sub);
    const set = this.selectedActionsMap.get(key) || new Set<string>();
    const supported = (sub.allowed_actions || []).filter(
      (a) => sub.is_support && a.status
    );
    return supported.length > 0 && supported.every((a) => set.has(a.name));
  }

  selectSub(sub: SubFeature) {
    this.selectedSub = sub;
  }


  toggleSelectAllForSub(sub: SubFeature, event: Event) {
    const key = this.getSubKey(sub.sub);
    const input = event.target as HTMLInputElement;
    const set = new Set<string>();

    if (input.checked) {
      (sub.allowed_actions || []).forEach((a) => {
        if (sub.is_support && a.status) set.add(a.name);
      });
    }
    this.selectedActionsMap.set(key, set);
  }

  getFilteredActions(selectedSub: any) {
    if (!selectedSub || !selectedSub.allowed_actions) return [];
    return selectedSub.allowed_actions.filter(
      (a: any) => selectedSub.is_support && a.status
    );
  }

  getSubProgress(sub: SubFeature): string {
    const key = this.getSubKey(sub.sub);
    const supported = (sub.allowed_actions || []).filter(
      (a) => (sub.is_support === undefined || sub.is_support) && a.status
    );
    const total = supported.length;
    if (total === 0) return "0/0";

    const selected = this.selectedActionsMap.get(key)?.size || 0;
    return `${selected}/${total}`;
  }

  getSelectedCount(sub: SubFeature): number {
    const key = this.getSubKey(sub.sub);
    return this.selectedActionsMap.get(key)?.size || 0;
  }

  getMainProgress(feature: FeatureData): string {
    let total = 0;
    let selected = 0;

    for (const sub of feature.sub_list) {
      const key = this.getSubKey(sub.sub);
      const supported = (sub.allowed_actions || []).filter(
        (a) => sub.is_support && a.status
      );
      total += supported.length;
      selected += this.selectedActionsMap.get(key)?.size || 0;
    }

    if (total === 0) return "0/0";
    return `${selected}/${total}`;
  }

  hasSelectedInMain(feature: FeatureData): boolean {
    return feature.sub_list.some(sub => {
      const key = this.getSubKey(sub.sub);
      return (this.selectedActionsMap.get(key)?.size || 0) > 0;
    });
  }

  hasAnySelected(sub: SubFeature): boolean {
    const key = this.getSubKey(sub.sub);
    return (this.selectedActionsMap.get(key)?.size || 0) > 0;
  }


  roleName: string = '';


  // load role for edit
  loadRoleForEdit(id: number) {
    this.adminRolesService.getRoleById(id).subscribe({
      next: (role) => {
        if (!role) return;
        this.createDate = new Date(role.createdAt ?? '').toLocaleDateString('en-GB');
        this.updatedDate = new Date(role.updatedAt ?? '').toLocaleDateString('en-GB');
        this.addedUsers = role.users || [];
        this.addedTotalUsers = role.total_users ?? this.addedUsers.length;

        this.createRoleForm.patchValue({
          code: role.code,
          name: role.name,
          users: this.addedUsers.map((u: IUser) => u.id)
        });
        this.getAllUsers();
        this.selectedActionsMap.clear();

        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach((modulePerm: ModulePermission) => {
            if (modulePerm.subModules && Array.isArray(modulePerm.subModules)) {
              modulePerm.subModules.forEach((sub: SubModulePermission) => {
                if (sub.actions && sub.actions.length > 0) {
                  const key = this.getSubKey(sub);
                  this.selectedActionsMap.set(key, new Set(sub.actions));
                }
              });
            }
          });

          const firstModuleWithPerms = role.permissions.find(
            (m) => m.subModules && m.subModules.length > 0
          );

          if (firstModuleWithPerms) {
            const feature = Object.values(this.mappedData).find(
              (f) => f.code === firstModuleWithPerms.moduleCode
            );
            if (feature) {
              this.selectMain(feature);
              if (feature.sub_list && feature.sub_list.length > 0) {
                const firstSub = feature.sub_list.find((s) => {
                  const key = this.getSubKey(s.sub);
                  return this.selectedActionsMap.has(key);
                });

                if (firstSub) {
                  this.selectSub(firstSub);
                }
              }
            }
          }
        }
        this.updatePaginatedAddedUsers();
      },
      error: (err) => {
        console.error("Error loading role", err);
      }
    });
  }

  // Build request body
  private buildRoleModel(): Roles {
    const { code, name } = this.createRoleForm.value;
    const permissions: ModulePermission[] = Object.values(this.mappedData)
      .map(feature => {
        const subModules: SubModulePermission[] = feature.sub_list
          .map(sub => {
            const key = this.getSubKey(sub.sub);
            const actions = Array.from(this.selectedActionsMap.get(key) || []);
            if (actions.length > 0) {
              return {
                code: sub.sub.code,
                actions: actions as ActionType[]
              };
            }
            return null;
          })
          .filter((s): s is SubModulePermission => s !== null);
        if (subModules.length > 0) {
          return {
            moduleCode: feature.code,
            subModules
          };
        }
        return null;
      })
      .filter((p): p is ModulePermission => p !== null);
    return {
      code,
      name,
      permissions,
      users: this.createRoleForm.value.users || [],
      remove_users: this.removedUsers || []
    };
  }

  // create Role
  createRole(): void {
    if (this.createRoleForm.invalid) {
      this.errMsg = "Please fill required fields";
      return;
    }
    const roleModel = this.buildRoleModel();
    console.log('Role model:', roleModel);
    this.isLoading = true;
    if (this.isEditMode) {
      roleModel.id = this.roleId;
      this.adminRolesService.updateRole(roleModel).subscribe({
        next: () => {
          this.removedUsers = [];
          this.isLoading = false;
          this.toasterService.showSuccess('Role updated successfully');
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error("Error updating role", err);
          this.errMsg = err.error?.message || "Error updating role";
        }
      });
    } else {
      this.adminRolesService.createRole(roleModel).subscribe({
        next: () => {
          this.isLoading = false;
          this.toasterService.showSuccess('Role created successfully');
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error("Error creating role", err);
          this.errMsg = err.error?.message || "Error creating role";
        }
      });
    }
  }

  // next and prev
  currentStep: number = 1;
  selectAll: boolean = false;

  goNext() {
    if (this.currentStep === 1 && this.createRoleForm.invalid) {
      this.createRoleForm.markAllAsTouched();
      return;
    }

    if (this.currentStep === 2 && !this.hasAnySelectedPermission()) {
      this.errMsg = 'Please select at least one permission.';
      return;
    }

    this.errMsg = '';

    this.currentStep++;

  }

  hasAnySelectedPermission(): boolean {
    return Array.from(this.selectedActionsMap.values())
      .some(set => set.size > 0);
  }

  goPrev() {
    this.currentStep--;
  }

  // discard popup
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    const currentPage = this.paginationState.getPage('roles/all-role');
    this.router.navigate(['/roles'], { queryParams: { page: currentPage } });
  }
}

