import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { RolesService } from 'app/core/services/roles/roles.service';
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
  imports: [PageHeaderComponent, PopupComponent, CommonModule],
  templateUrl: './add-role.component.html',
  styleUrl: './add-role.component.css'
})
export class AddRoleComponent {
  constructor(
    private router: Router,
    private rolesService: RolesService
  ) { }

  errMsg = '';
  isLoading: boolean = false;




  mappedData: Record<string, FeatureData> = {};
  selectedMain: FeatureData | null = null;
  selectedSub: SubFeature | null = null;

  selectedActionsMap = new Map<number, Set<string>>();

  ngOnInit() {
    this.getAllRoles();
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
        console.log(this.mappedData);
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
    return this.selectedActionsMap.get(sub.sub.id)?.has(action) ?? false;
  }

  selectSub(sub: SubFeature) {
    this.selectedSub = sub;
  }

  toggleActionForSub(sub: SubFeature, action: string, event: Event) {
    const set = this.selectedActionsMap.get(sub.sub.id) || new Set<string>();
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      set.add(action);
    } else {
      set.delete(action);
    }
    this.selectedActionsMap.set(sub.sub.id, set);
  }

  isAllSelected(sub: SubFeature): boolean {
    const set = this.selectedActionsMap.get(sub.sub.id) || new Set<string>();
    const supported = (sub.allowed_actions || []).filter(
      (a) => sub.is_support && a.status
    );
    return supported.length > 0 && supported.every((a) => set.has(a.name));
  }

  toggleSelectAllForSub(sub: SubFeature, event: Event) {
    const input = event.target as HTMLInputElement;
    const set = new Set<string>();
    if (input.checked) {
      (sub.allowed_actions || []).forEach((a) => {
        if (sub.is_support && a.status) set.add(a.name);
      });
    }
    this.selectedActionsMap.set(sub.sub.id, set);
  }

  getFilteredActions(selectedSub: any) {
    if (!selectedSub || !selectedSub.allowed_actions) return [];
    return selectedSub.allowed_actions.filter(
      (a: any) => selectedSub.is_support && a.status
    );
  }

  getSubProgress(sub: SubFeature): string {
    const supported = (sub.allowed_actions || []).filter(
      (a) => sub.is_support && a.status
    );
    const total = supported.length;
    if (total === 0) return "0/0";

    const selected = this.selectedActionsMap.get(sub.sub.id)?.size || 0;
    return `${selected}/${total}`;
  }

  getMainProgress(feature: FeatureData): string {
    let total = 0;
    let selected = 0;

    for (const sub of feature.sub_list) {
      const supported = (sub.allowed_actions || []).filter(
        (a) => sub.is_support && a.status
      );
      total += supported.length;
      selected += this.selectedActionsMap.get(sub.sub.id)?.size || 0;
    }

    if (total === 0) return "0/0";
    return `${selected}/${total}`;
  }

  hasSelectedInMain(feature: FeatureData): boolean {
    return feature.sub_list.some(sub => (this.selectedActionsMap.get(sub.sub.id)?.size || 0) > 0);
  }

  hasAnySelected(sub: any): boolean {
  return (this.selectedActionsMap.get(sub.sub.id)?.size || 0) > 0;
}




  // next and prev
  currentStep = 1;
  selectAll: boolean = false;

  goNext() {
    this.currentStep++;

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
