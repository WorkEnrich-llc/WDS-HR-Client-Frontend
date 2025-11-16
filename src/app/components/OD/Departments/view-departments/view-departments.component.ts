import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { DatePipe } from '@angular/common';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { DepartmentChecklistService } from '../../../../core/services/od/departmentChecklist/department-checklist.service';
import { OnboardingChecklistComponent, OnboardingListItem } from '../../../shared/onboarding-checklist/onboarding-checklist.component';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-view-departments',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, TableComponent, PopupComponent, SkelatonLoadingComponent, OnboardingChecklistComponent],
  providers: [DatePipe],
  templateUrl: './view-departments.component.html',
  styleUrls: ['./view-departments.component.css']
})
export class ViewDepartmentsComponent implements OnInit {
  constructor(
    private _DepartmentsService: DepartmentsService, 
    private subService: SubscriptionService, 
    private route: ActivatedRoute, 
    private datePipe: DatePipe,
    private departmentChecklistService: DepartmentChecklistService,
    private toasterMessageService: ToasterMessageService
  ) { }
  departmentData: any = { sections: [] };
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  deptId: string | null = null;
  activeTab: 'sections' | 'goals' = 'sections';

  setActiveTab(tab: 'sections' | 'goals') {
    this.activeTab = tab;
  }
  // Table pagination properties
  loadData: boolean = false;
  totalItems: number = 0;
  totalItemsGoals: number = 0;
  itemsPerPage: number = 10;
  currentPage: number = 1;
  departmentsSub: any;

  ngOnInit(): void {
    // subscription data
    this.subService.subscription$.subscribe(sub => {
      this.departmentsSub = sub?.Departments;
      // if (this.departmentsSub) {
      //   console.log("info:", this.departmentsSub.info);
      //   console.log("create:", this.departmentsSub.create);
      //   console.log("update:", this.departmentsSub.update);
      //   console.log("delete:", this.departmentsSub.delete);
      // }
    });


    this.deptId = this.route.snapshot.paramMap.get('id');
    // this.getDepartment(Number(this.deptId));
    if (this.deptId) {
      this.getDepartment(Number(this.deptId));
    }
  }

  getDepartment(deptId: number) {
    this.loadData = true;

    this._DepartmentsService.showDepartment(deptId).subscribe({
      next: (response) => {
        this.departmentData = response.data.object_info;
        this.totalItems = this.departmentData.sections?.length || 0;
        this.totalItemsGoals = this.departmentData.assigned_goals?.length || 0;
        const created = this.departmentData?.created_at;
        const updated = this.departmentData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }
        console.log(this.departmentData);

        this.sortDirection = 'desc';
        this.sortBy('id');
        this.loadData = false;
        
        // Load checklist after department data is loaded
        this.loadDepartmentChecklist();
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }

  getSubsectionNames(section: any): string {
    if (section?.sub_sections?.length > 0) {
      return section.sub_sections.map((sub: any) => sub.name).join(', ');
    }
    return '';
  }


  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  sortBy(column: string) {
    if (this.currentSortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.departmentData.sections && Array.isArray(this.departmentData.sections)) {
      this.departmentData.sections = [...this.departmentData.sections].sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];

        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }



  deactivateOpen = false;
  activateOpen = false;
  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }

  confirmDeactivate() {
    this.deactivateOpen = false;

    const deptStatus = {
      request_data: {
        status: false
      }
    };

    this._DepartmentsService.updateDeptStatus(this.departmentData.id, deptStatus).subscribe({
      next: (response) => {
        this.departmentData = response.data.object_info;
        // console.log(this.departmentData);

        this.sortDirection = 'desc';
        this.sortBy('id');
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }
  confirmActivate() {
    this.activateOpen = false;
    const deptStatus = {
      request_data: {
        status: true
      }
    };

    this._DepartmentsService.updateDeptStatus(this.departmentData.id, deptStatus).subscribe({
      next: (response) => {
        this.departmentData = response.data.object_info;
        // console.log(this.departmentData);

        this.sortDirection = 'desc';
        this.sortBy('id');
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
  }

  // Department checklist properties
  departmentChecklistItems: OnboardingListItem[] = [];
  isChecklistModalOpen: boolean = false;
  // Mapping of title to ID for efficient lookup
  titleToIdMap: Map<string, number> = new Map();
  // Track which checklist item is currently being updated
  loadingChecklistItemTitle: string | null = null;

  // Load department checklist from API and mark assigned ones as active
  loadDepartmentChecklist(): void {
    this.departmentChecklistService.getDepartmetChecks(1, 10000).subscribe({
      next: (response) => {
        // Get assigned checklist IDs from department response
        const assignedChecklistIds = (this.departmentData?.assigned_checklist || []).map((item: any) => item.id);
        
        // Transform API response to match OnboardingListItem format and build title-to-ID mapping
        const listItems = response?.data?.list_items || [];
        this.titleToIdMap.clear(); // Clear previous mapping
        this.departmentChecklistItems = listItems.map((item: any) => {
          // Store mapping of title to ID
          this.titleToIdMap.set(item.name || '', item.id);
          return {
            title: item.name || '',
            status: assignedChecklistIds.includes(item.id) // Mark as checked if in assigned_checklist
          };
        });
        
        console.log('Department checklist loaded:', this.departmentChecklistItems);
        console.log('Assigned checklist IDs:', assignedChecklistIds);
      },
      error: (error) => {
        console.error('Error loading department checklist:', error);
        this.toasterMessageService.showError('Failed to load department checklist');
      }
    });
  }

  // Onboarding checklist modal methods
  openChecklistModal(): void {
    this.isChecklistModalOpen = true;
  }

  closeChecklistModal(): void {
    this.isChecklistModalOpen = false;
  }

  onChecklistItemClick(item: OnboardingListItem): void {
    // Get the ID from the title-to-ID mapping
    const itemId = this.titleToIdMap.get(item.title);
    
    if (itemId === undefined) {
      return;
    }

    // Prevent multiple clicks while loading
    if (this.loadingChecklistItemTitle) {
      return;
    }

    // Set loading state
    this.loadingChecklistItemTitle = item.title;

    // Toggle item status locally (will be updated after API call)
    const newStatus = !item.status;
    item.status = newStatus;

    // Build checklist array: include IDs of all currently checked items (exclude unchecked)
    const checkedIds = this.departmentChecklistItems
      .filter(listItem => {
        const listItemId = this.titleToIdMap.get(listItem.title);
        return listItemId !== undefined && listItem.status === true;
      })
      .map(listItem => this.titleToIdMap.get(listItem.title))
      .filter(id => id !== undefined) as number[];

    // Build update payload matching edit-departments structure
    const updatePayload = {
      request_data: {
        id: this.departmentData.id,
        code: this.departmentData.code,
        name: this.departmentData.name,
        department_type: this.departmentData.department_type.id || this.departmentData.department_type,
        objectives: this.departmentData.objectives,
        goals: (this.departmentData.assigned_goals || []).map((goal: any) => goal.id),
        sections: (this.departmentData.sections || []).map((section: any, sectionIndex: number) => ({
          id: section.id,
          index: sectionIndex + 1,
          record_type: 'nothing', // No changes to sections in view mode
          code: section.code,
          name: section.name,
          status: section.is_active.toString(),
          sub_sections: (section.sub_sections || []).map((sub: any, subIndex: number) => ({
            id: sub.id,
            index: subIndex + 1,
            record_type: 'nothing',
            code: sub.code,
            name: sub.name,
            status: sub.is_active.toString()
          }))
        })),
        checklist: checkedIds
      }
    };

    // Call update endpoint
    this._DepartmentsService.updateDepartment(updatePayload).subscribe({
      next: (response) => {
        this.loadingChecklistItemTitle = null;
        this.toasterMessageService.showSuccess('Checklist updated successfully');

         // Refresh department checklist from latest server response without reloading the whole page
         this._DepartmentsService.showDepartment(this.departmentData.id).subscribe({
           next: (deptResponse) => {
             const updatedDept = deptResponse.data.object_info;
             // Update only departmentData and checklist-related state
             this.departmentData = updatedDept;
             // Reload checklist to reflect updated assigned_checklist
             this.loadDepartmentChecklist();
           },
           error: (deptError) => {
             console.error('Error refreshing department after checklist update:', deptError);
           }
         });
      },
      error: (error) => {
        this.loadingChecklistItemTitle = null;
        // Revert the local change on error
        item.status = !newStatus;
        console.error('Error updating checklist:', error);
        this.toasterMessageService.showError('Failed to update checklist');
      }
    });
  }

  get checklistCompleted(): number {
    return this.departmentChecklistItems.filter(item => item.status === true).length;
  }

  get checklistTotal(): number {
    return this.departmentChecklistItems.length;
  }

  get disabledChecklistTitles(): string[] {
    // In view mode, allow all items to be toggled (no disabled items)
    return [];
  }

}
