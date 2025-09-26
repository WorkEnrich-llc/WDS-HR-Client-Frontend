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
import { IPermission, IUser } from 'app/core/models/users';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';

@Component({
  selector: 'app-add-user',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule, CloseDropdownDirective, CommonModule],
  providers: [DatePipe],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css'
})
export class AddUserComponent implements OnInit {

  public usersForm!: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private usersService = inject(AdminUsersService);
  private employeeService = inject(EmployeeService);
  private rolesService = inject(AdminRolesService);
  private toasterService = inject(ToasterMessageService);
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  createDate: string = '';
  updatedDate: string = '';
  isEditMode = false;
  userRoles: Roles[] = [];
  selectedRoles: Roles[] = [];
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
      userName: [{ value: '', disabled: true }, [Validators.required]],
      permissions: [{ value: [], disabled: true }, [Validators.required]],
    });
  }

  private loadDataForEditMode(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.userId;
    if (this.isEditMode) {
      this.usersService.getUserById(this.userId).subscribe({
        next: (data) => {
          this.usersForm.patchValue({
            code: data.user.code,
            userName: data.user.name,
            email: data.user.email,
            permissions: (data.permissions ?? []).map((p: any) => p.role?.id)
          });
          this.selectedRoles = (data.permissions ?? []).map((p: any) => ({
            id: p.role?.id,
            name: p.role?.name
          }));
          this.createDate = new Date(data.created_at).toLocaleDateString('en-GB');
          this.updatedDate = new Date(data.updated_at).toLocaleDateString('en-GB');
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
      this.selectedRoles.push(role);
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
      this.selectedRoles.push(role);
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
      userName: formValues.userName,
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
        this.toasterService.showSuccess('User created successfully');
      }
      this.router.navigate(['/users/all-users']);
    } catch (err) {
      console.error('Create component failed', err);
    } finally {
      this.isEditMode = false;
    }
  }

  checkEmailExists(): void {
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
          this.usersForm.get('userName')?.disable();
          this.usersForm.get('email')?.enable();
          this.usersForm.get('permissions')?.disable();
          this.usersForm.patchValue({
            email: user?.email || '',
            code: user?.code || '',
            userName: user?.name || '',
          });
        }
        else if (user && user.employee === true && user.available === true) {
          this.isExistingUser = true;
          this.isAdmin = false;
          this.usersForm.get('code')?.disable();
          this.usersForm.get('userName')?.disable();
          this.usersForm.get('email')?.enable();
          this.usersForm.get('permissions')?.enable();
          this.usersForm.patchValue({
            email: user?.email || '',
            code: user?.code || '',
            userName: user?.name || '',
          });
        }
        else {
          this.isExistingUser = false;
          this.isAdmin = false;
          this.usersForm.get('code')?.enable();
          this.usersForm.get('userName')?.enable();
          this.usersForm.get('permissions')?.enable();
          this.usersForm.patchValue({
            code: '',
            userName: '',
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
    this.router.navigate(['/users']);
  }







}
