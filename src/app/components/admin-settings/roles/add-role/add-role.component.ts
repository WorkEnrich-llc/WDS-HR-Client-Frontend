import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { ActionType, ModulePermission, Roles, SubModulePermission } from 'app/core/models/roles';
import { AdminRolesService } from 'app/core/services/admin-settings/roles/admin-roles.service';
import { RolesService } from 'app/core/services/roles/roles.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
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
  selector: 'app-add-role',
  imports: [PageHeaderComponent, PopupComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './add-role.component.html',
  styleUrl: './add-role.component.css'
})
export class AddRoleComponent implements OnInit {
  createRoleForm!: FormGroup;
  private fb = inject(FormBuilder);
  private adminRolesService = inject(AdminRolesService);
  private toasterService = inject(ToasterMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  id?: number;
  roleId!: number;
  createDate: string = '';
  updatedDate: string = '';



  constructor(
    // private router: Router,
    private rolesService: RolesService
  ) { }

  errMsg = '';
  isLoading: boolean = false;




  mappedData: Record<string, FeatureData> = {};
  selectedMain: FeatureData | null = null;
  selectedSub: SubFeature | null = null;

  private getSubKey(sub: { code?: number; id?: number }): string {
    return String(sub.code ?? sub.id);
  }


  selectedActionsMap = new Map<string, Set<string>>();

  ngOnInit() {
    this.getAllRoles();
    this.initFormModels();
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
        console.log(err.error?.details);
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

  loadRoleForEdit(id: number) {
    this.adminRolesService.getRoleById(id).subscribe({
      next: (role) => {
        if (!role) return;
        this.createDate = new Date(role.createdAt ?? '').toLocaleDateString('en-GB');
        this.updatedDate = new Date(role.updatedAt ?? '').toLocaleDateString('en-GB');
        this.createRoleForm.patchValue({
          code: role.code,
          name: role.name
        });
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
    };
  }

  // create Role
  createRole(): void {
    if (this.createRoleForm.invalid) {
      this.errMsg = "Please fill required fields";
      return;
    }

    const roleModel = this.buildRoleModel();
    this.isLoading = true;
    if (this.isEditMode) {
      roleModel.id = this.roleId;
      this.adminRolesService.updateRole(roleModel).subscribe({
        next: (res) => {
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
        next: (res) => {
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
    this.router.navigate(['/roles']);
  }
}

