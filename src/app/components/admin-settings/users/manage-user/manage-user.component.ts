import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUsersService } from 'app/core/services/admin-settings/users/admin-users.service';
import { AdminRolesService } from 'app/core/services/admin-settings/roles/admin-roles.service';
import { Roles } from 'app/core/models/roles';
import { CloseDropdownDirective } from 'app/core/directives/close-dropdown.directive';
import { firstValueFrom } from 'rxjs';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { IPermission, IUser, IRole } from 'app/core/models/users';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

interface SelectedRole {
  id: number;
  name: string;
}

@Component({
  selector: 'app-add-user',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule, CloseDropdownDirective, CommonModule],
  providers: [DatePipe],
  templateUrl: './manage-user.component.html',
  styleUrl: './manage-user.component.css'
})
export class ManageUserComponent implements OnInit {

  public usersForm!: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private usersService = inject(AdminUsersService);
  private employeeService = inject(EmployeeService);
  private rolesService = inject(AdminRolesService);
  private toasterService = inject(ToasterMessageService);
  private paginationState = inject(PaginationStateService);
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  createDate: string = '';
  updatedDate: string = '';
  isEditMode = false;
  userRoles: Roles[] = [];
  selectedRoles: SelectedRole[] = [];
  userId!: number;
  isDropdownOpen = false;
  isExistingUser = false;
  isAdmin = false;
  suggestedEmails: { email: string }[] = [];
  showSuggestions = false;



  constructor(
    private datePipe: DatePipe,
    // private router: Router
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }


  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.isEditMode = params.has('id');
    });
    this.getAllRoles();
    this.loadDataForEditMode();
    this.initFormModel();
    const today = new Date().toLocaleDateString('en-GB');
    this.createDate = today;
  }


  private initFormModel(): void {
    this.usersForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: [{ value: '', disabled: true }],
      user_name: [{ value: '', disabled: true }, [Validators.required]],
      permissions: [{ value: [], disabled: true }, [Validators.required]],
    });
  }

  private enableUserControls(): void {
    this.usersForm.get('code')?.enable({ emitEvent: false });
    this.usersForm.get('user_name')?.enable({ emitEvent: false });
    this.usersForm.get('permissions')?.enable({ emitEvent: false });
  }

  private loadDataForEditMode(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.userId;
    if (this.isEditMode) {
      this.usersService.getUserById(this.userId).subscribe({
        next: (data) => {
          if (!data) {
            return;
          }

          const permissionsData = (data.permissions ?? []) as IPermission[];
          const permissions = permissionsData
            .map((permission: IPermission) => permission.role?.id)
            .filter((roleId): roleId is number => typeof roleId === 'number');

          this.usersForm.patchValue({
            code: data.user?.code ?? '',
            user_name: data.user?.name ?? '',
            email: data.user?.email ?? '',
            permissions
          });

          this.selectedRoles = permissionsData
            .map((permission: IPermission): SelectedRole | null => {
              const role: IRole | undefined = permission.role;
              if (!role || role.id == null || !role.name) {
                return null;
              }
              return { id: role.id, name: role.name };
            })
            .filter((role): role is SelectedRole => role !== null);

          this.enableUserControls();
          this.isExistingUser = false;
          this.isAdmin = false;

          if (data.created_at) {
            this.createDate = new Date(data.created_at).toLocaleDateString('en-GB');
          }
          if (data.updated_at) {
            this.updatedDate = new Date(data.updated_at).toLocaleDateString('en-GB');
          }
        },
        error: (err) => console.error('Failed to load user information', err)
      });
    }
    else {
      const today = new Date().toLocaleDateString('en-GB');
      this.createDate = today;
    }
  }


  private getAllRoles(): void {
    this.rolesService.getAllRoles(1, 50).subscribe({
      next: (data) => {
        console.log('All roles data:', data);
        this.userRoles = data.roles;
      },
      error: (err) => console.error('Failed to load all roles', err)
    });
  }

  onSelectRole(event: Event) {
    const selectEl = event.target as HTMLSelectElement;
    const roleId = +selectEl.value;
    const role = this.userRoles.find(r => r.id === roleId);

    if (role && !this.selectedRoles.some(r => r.id === role.id)) {
      if (role.id == null) {
        return;
      }
      const selectedRole: SelectedRole = { id: role.id, name: role.name };
      this.selectedRoles.push(selectedRole);
      this.usersForm.patchValue({
        permissions: this.selectedRoles.map(r => r.id),
      });
      console.log('Selected role:', this.selectedRoles);
    }
    selectEl.value = '';
  }

  isRoleSelected(roleId: number): boolean {
    return this.selectedRoles.some(r => r.id === roleId);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectRole(role: Roles) {
    if (!this.selectedRoles.some(r => r.id === role.id)) {
      if (role.id == null) {
        return;
      }
      const selectedRole: SelectedRole = { id: role.id, name: role.name };
      this.selectedRoles.push(selectedRole);
    }
    this.usersForm.patchValue({
      permissions: this.selectedRoles.map(r => r.id),
    });
  }

  removeRole(roleId: number) {
    this.selectedRoles = this.selectedRoles.filter(r => r.id !== roleId);
    this.usersForm.patchValue({
      permissions: this.selectedRoles.map(r => r.id),
    });
  }

  async inviteUser(): Promise<void> {
    // Prevent duplicate requests while loading
    if (this.isLoading) {
      return;
    }
    
    if (this.isAdmin) {
      this.openPopup();
      return;
    }
    if (this.usersForm.invalid) {
      this.usersForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const formValues = this.usersForm.value;
    const formData: IUser = {
      ...this.usersForm.value,
      code: formValues.code,
      email: formValues.email,
      user_name: formValues.user_name,
      permissions: formValues.permissions,
    };
    if (this.isEditMode && this.userId) {
      formData.id = Number(this.userId);
    }
    try {
      if (this.isEditMode) {
        await firstValueFrom(this.usersService.updateUser(formData));
        this.toasterService.showSuccess('User updated successfully');
      } else {
        await firstValueFrom(this.usersService.createUser(formValues));
        this.toasterService.showSuccess('Invitation sent successfully');
      }
      this.router.navigate(['/users/all-users']);
    } catch (err) {
      console.error('Invitation sent failed', err);
    } finally {
      this.isLoading = false;
      this.isEditMode = false;
    }
  }

  checkEmailExists(): void {
    if (this.isEditMode) {
      return;
    }
    this.isExistingUser = false;
    this.isAdmin = false;
    const emailControl = this.usersForm.get('email');
    const email = emailControl?.value;
    if (!email || emailControl?.invalid) return;

    this.usersService.searchUser(email).subscribe({
      next: (res) => {
        const emailLower = email.toLowerCase();
        const user = res?.data?.list_items?.find(
          (u: any) => u.email.toLowerCase() === emailLower
        );
        const exists = !!user;
        if (user && user.employee === true && user.available === false) {
          this.isAdmin = true;
          this.usersForm.get('code')?.disable();
          this.usersForm.get('user_name')?.disable();
          this.usersForm.get('email')?.enable();
          this.usersForm.get('permissions')?.disable();
          this.usersForm.patchValue({
            email: user?.email || '',
            code: user?.code || '',
            user_name: user?.name || '',
          });
        }
        else if (user && user.employee === true && user.available === true) {
          this.isExistingUser = true;
          this.isAdmin = false;
          this.usersForm.get('code')?.disable();
          this.usersForm.get('user_name')?.disable();
          this.usersForm.get('email')?.enable();
          this.usersForm.get('permissions')?.enable();
          this.usersForm.patchValue({
            email: user?.email || '',
            code: user?.code || '',
            user_name: user?.name || '',
          });
        }
        else {
          this.isExistingUser = false;
          this.isAdmin = false;
          this.usersForm.get('code')?.enable();
          this.usersForm.get('user_name')?.enable();
          this.usersForm.get('permissions')?.enable();
          this.usersForm.patchValue({
            code: '',
            user_name: '',
            permissions: []
          });
        }
      },
      error: (err) => console.error('searchUser error:', err),
    });
  }




  loadAllEmails(searchValue: string): void {
    this.employeeService.getAllEmployees().subscribe({
      next: (res) => {
        const allEmails =
          res?.data?.list_items?.map((u: any) => ({
            email: u.contact_info?.email || ''
          })) || [];

        // filter by the typed value
        this.suggestedEmails = allEmails.filter((e: any) =>
          e.email.toLowerCase().includes(searchValue.toLowerCase())
        );
        this.showSuggestions = this.suggestedEmails.length > 0;
      },
      error: (err) => console.error('GetAllUsers error:', err)
    });
  }


  onEmailInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    if (value.length > 1) {
      this.loadAllEmails(value);
    } else {
      this.suggestedEmails = [];
      this.showSuggestions = false;
    }
  }


  selectEmail(email: string): void {
    this.usersForm.patchValue({ email });
    this.showSuggestions = false;
    this.checkEmailExists();
  }

  hideSuggestions(): void {
    this.showSuggestions = false
  }




  // popups
  isModalOpen = false;
  isPopupOpen = false;
  isSuccessModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  openPopup() {
    this.isPopupOpen = true;
  }

  closePopup() {
    this.usersForm.reset();
    this.isPopupOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    const currentPage = this.paginationState.getPage('users/all-users');
    this.router.navigate(['/users'], { queryParams: { page: currentPage } });
    // this.router.navigate(['/users']);
  }


}
