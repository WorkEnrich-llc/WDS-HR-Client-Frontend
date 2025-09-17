import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUsersService } from 'app/core/services/admin-settings/users/admin-users.service';
import { AdminRolesService } from 'app/core/services/admin-settings/roles/admin-roles.service';
import { Roles } from 'app/core/models/roles';
import { CloseDropdownDirective } from 'app/core/directives/close-dropdown.directive';
import { firstValueFrom } from 'rxjs';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-add-user',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule, CloseDropdownDirective],
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


  // id?: number;

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
    // this.isEditMode = this.route.snapshot.paramMap.has('id');
    this.initFormModel();
    const today = new Date().toLocaleDateString('en-GB');
    this.createDate = today;
  }


  private initFormModel(): void {
    this.usersForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: [''],
      userName: ['', [Validators.required]],
      permissions: [[], [Validators.required]],
    });
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

  // removeRole(roleId: number) {
  //   this.selectedRoles = this.selectedRoles.filter(r => r.id !== roleId);
  //   this.usersForm.patchValue({
  //     permissions: this.selectedRoles.map(r => r.id),
  //   });
  // }

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
    if (this.usersForm.invalid) {
      this.usersForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const formValues = this.usersForm.value;
    // const formData: PayrollComponent = {
    //   ...this.usersForm.value,
    //   component_type: +formValues.component_type,
    //   classification: +formValues.classification,
    //   portion: +formValues.portion,
    //   calculation: +formValues.calculation
    // };
    console.log('Form Submitted', formValues);
    //  if (this.isEditMode && this.userId) {
    //     formValues.id = String(this.userId);
    //   }
    try {
      if (this.isEditMode) {
        await firstValueFrom(this.usersService.createUser(formValues));
        this.toasterService.showSuccess('User updated successfully');
      } else {
        console.log('formValues', formValues);
        // await firstValueFrom(this.usersService.createUser(formValues));
        // this.toasterService.showSuccess('User created successfully');
      }
      this.router.navigate(['/admin-settings/users']);
    } catch (err) {
      console.error('Create component failed', err);
    } finally {
      this.isEditMode = false;
    }
  }

  // createUser(): void {
  //   if (this.usersForm.invalid) {
  //     this.errMsg = "Please fill required fields";
  //     return;
  //   }

  //   // const roleModel = this.buildRoleModel();
  //   this.isLoading = true;
  //   if (this.isEditMode) {
  //     roleModel.id = this.roleId;
  //     this.adminRolesService.updateRole(roleModel).subscribe({
  //       next: (res) => {
  //         this.isLoading = false;
  //         this.toasterService.showSuccess('Role updated successfully');
  //         this.router.navigate(['/roles']);
  //       },
  //       error: (err) => {
  //         this.isLoading = false;
  //         console.error("Error updating role", err);
  //         this.errMsg = err.error?.message || "Error updating role";
  //       }
  //     });
  //   } else {
  //     this.adminRolesService.createRole(roleModel).subscribe({
  //       next: (res) => {
  //         this.isLoading = false;
  //         this.toasterService.showSuccess('Role created successfully');
  //         this.router.navigate(['/roles']);
  //       },
  //       error: (err) => {
  //         this.isLoading = false;
  //         console.error("Error creating role", err);
  //         this.errMsg = err.error?.message || "Error creating role";
  //       }
  //     });
  //   }
  // }

  // popups
  isModalOpen = false;
  isSuccessModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/users']);
  }
}
