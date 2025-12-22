import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { OverlayFilterBoxComponent } from 'app/components/shared/overlay-filter-box/overlay-filter-box.component';
import { TableComponent } from 'app/components/shared/table/table.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { GoalsService } from 'app/core/services/od/goals/goals.service';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { DepartmentChecklistService } from '../../../../core/services/od/departmentChecklist/department-checklist.service';
import { OnboardingChecklistComponent, OnboardingListItem } from '../../../shared/onboarding-checklist/onboarding-checklist.component';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-edit-departments',
  imports: [PageHeaderComponent, CommonModule, SkelatonLoadingComponent, PopupComponent, FormsModule, ReactiveFormsModule, OverlayFilterBoxComponent, TableComponent, OnboardingChecklistComponent],
  providers: [DatePipe],
  templateUrl: './edit-departments.component.html',
  styleUrls: ['./../../../shared/table/table.component.css', './edit-departments.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EditDepartmentsComponent implements OnInit {
  constructor(
    private _DepartmentsService: DepartmentsService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    private subService: SubscriptionService,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService,
    private goalsService: GoalsService,
    private departmentChecklistService: DepartmentChecklistService,
  ) {
    this.deptStep2 = this.fb.group({
      sections: this.fb.array([])
    });

  }


  //  Goals overlay 
  @ViewChild('goalsOverlay') goalsOverlay!: OverlayFilterBoxComponent;

  departmentData: any = { sections: [] };
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  deptId: string | null = null;
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  deptStep2: FormGroup;
  loadData: boolean = false;


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
    if (this.deptId) {
      this.getDepartment(Number(this.deptId));
    }

    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.currentPage = 1;
      this.getAllGoals(this.currentPage, search);
    });

    this.deptStep1.get('department_type')?.valueChanges.subscribe(type => {
      if (type) {
        this.currentPage = 1;
        this.getAllGoals(this.currentPage);
      }
    });
  }
  get hasSelectedGoals(): boolean {
    return this.addedGoal?.some(goal => goal.selected);
  }

  initialData: any = null;
  getDepartment(deptId: number) {
    this.loadData = true;
    this._DepartmentsService.showDepartment(deptId).subscribe({
      next: (response) => {
        this.departmentData = response.data.object_info;
        // console.log(this.departmentData);
        this.deptStep1.patchValue({
          code: this.departmentData.code || '',
          name: this.departmentData.name || '',
          department_type: this.departmentData.department_type.id || '',
          objectives: this.departmentData.objectives || ''
        });

        // sections
        this.sectionsFormArray.clear();
        this.departmentData.sections?.forEach((section: any) => {
          this.sectionsFormArray.push(this.createSectionGroup(section));
        });

        // goals
        this.addedGoal = (this.departmentData.assigned_goals || []).map((g: any) => ({
          id: g.id,
          name: g.name,
          selected: false
        }));

        this.Goals = this.Goals.map(goal => ({
          ...goal,
          selected: this.addedGoal.some(a => a.id === goal.id)
        }));

        // created/updated
        const created = this.departmentData?.created_at;
        const updated = this.departmentData?.updated_at;
        if (created) this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        if (updated) this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;

        this.initialData = {
          step1: this.deptStep1.value,
          goals: [...this.addedGoal],
          sections: this.sectionsFormArray.value
        };
        this.loadData = false;

        // Save assigned_checklist IDs from department response
        this.saveAssignedChecklistIds();

        // Load checklist after department data is loaded
        this.loadDepartmentChecklist();
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }



  deptStep1: FormGroup = new FormGroup({
    // Optional code must include both letters and numbers when provided
    code: new FormControl('', []),
    name: new FormControl('', [Validators.required]),
    department_type: new FormControl('', [Validators.required]),
    objectives: new FormControl('', [Validators.required]),
  });

  get sectionsFormArray(): FormArray<FormGroup> {
    return this.deptStep2.get('sections') as FormArray<FormGroup>;
  }

  getSubSections(section: FormGroup): FormArray<FormGroup> {
    return section.get('sub_sections') as FormArray<FormGroup>;
  }

  createSectionGroup(section?: any): FormGroup {
    return this.fb.group({
      id: [section?.id || null],
      secCode: [section?.code || ''],
      secName: [section?.name || '', Validators.required],
      status: [section?.is_active ?? true],
      collapsed: [true],
      record_type: ['nothing'],
      sub_sections: this.fb.array(
        (section?.sub_sections || []).map((sub: any) =>
          this.fb.group({
            id: [sub.id || null],
            secCode: [sub.code || '', Validators.required],
            secName: [sub.name || '', Validators.required],
            status: [sub.is_active ?? true],
            record_type: ['nothing']
          })
        )
      )
    });
  }


  // toggle activate and deactivate
  toggleSectionStatus(index: number) {
    const sectionGroup = this.sectionsFormArray.at(index) as FormGroup;
    const currentStatus = sectionGroup.get('status')?.value;
    sectionGroup.get('status')?.setValue(!currentStatus);
  }
  toggleSubSectionStatus(parentIndex: number, childIndex: number) {
    const parent = this.sectionsFormArray.at(parentIndex) as FormGroup;
    const subSections = this.getSubSections(parent);
    const subGroup = subSections.at(childIndex) as FormGroup;
    const currentStatus = subGroup.get('status')?.value;
    subGroup.get('status')?.setValue(!currentStatus);
  }

  toggleCollapse(section: FormGroup) {
    const collapsed = section.get('collapsed')?.value;
    section.get('collapsed')?.setValue(!collapsed);
  }


  // add section row
  addSection() {
    this.sectionsFormArray.push(this.createSectionGroup());
  }
  // add subsection row
  addSubSection(parentIndex: number) {
    const parent = this.sectionsFormArray.at(parentIndex) as FormGroup;
    const subSections = this.getSubSections(parent);
    subSections.push(
      this.fb.group({
        secCode: [''],
        secName: ['', Validators.required],
        status: [true],
        record_type: ['create']
      })
    );
    parent.get('collapsed')?.setValue(false);
  }


  // remove section row
  removeSection(index: number) {
    this.sectionsFormArray.removeAt(index);
  }
  removeSubSection(parentIndex: number, childIndex: number) {
    const parent = this.sectionsFormArray.at(parentIndex) as FormGroup;
    const subSections = this.getSubSections(parent);
    subSections.removeAt(childIndex);
  }



  get isStep2Valid(): boolean {
    if (this.sectionsFormArray.length < 1) {
      return false;
    }

    return this.sectionsFormArray.controls.every((section: FormGroup) => {
      const subSections = this.getSubSections(section);
      return section.valid && subSections.controls.every((sub: FormGroup) => sub.valid);
    });
  }


  // goals
  openFirstOverlay() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.goalsOverlay.openOverlay();
  }

  Goals: any[] = [];
  addedGoal: any[] = [];
  selectAllOverlay: boolean = false;
  selectAllAdded: boolean = false;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;


  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }


  getAllGoals(pageNumber: number = 1, searchTerm: string = ''): void {

    const goalType = this.deptStep1.get('department_type')?.value;

    this.goalsService.getAllGoals(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      goal_type: goalType || undefined,
    }).subscribe({
      next: (response) => {
        const data = response?.data;

        this.currentPage = Number(data?.page ?? 1);
        this.totalItems = data?.total_items ?? 0;
        this.totalpages = data?.total_pages ?? 0;

        this.Goals = (data?.list_items ?? []).filter((goal: any) => goal.is_active).map((goal: any) => ({
          ...goal,
          selected: this.addedGoal.some(a => a.id === goal.id)
        }));

      },
      error: (err) => {
        console.error("Error loading goals:", err.error?.details || err.message);

      }
    });
  }
  onDepartmentTypeChange(): void {
    this.addedGoal = [];
  }

  //checkboxes 
  toggleSelectAll() {
    this.Goals.forEach(goal => {
      goal.selected = this.selectAllOverlay;
    });
  }

  toggleSelectAllSelected() {
    this.addedGoal.forEach(addedGoal => {
      addedGoal.selected = this.selectAllAdded;
    });
  }

  toggleGoal(goal: any) {
    if (!goal.selected) {
      this.selectAllOverlay = false;
    } else if (this.Goals.length && this.Goals.every(g => g.selected)) {
      this.selectAllOverlay = true;
    }
  }


  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllGoals(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllGoals(this.currentPage);
  }
  discardGoals(): void {
    this.Goals.forEach(goal => {
      goal.selected = false;
    });
    this.selectAllOverlay = false;
    this.goalsOverlay.closeOverlay();
    this.searchTerm = '';
  }

  addSelectedGoals(): void {
    const selected = this.Goals.filter(goal => goal.selected);

    selected.forEach(goal => {
      const alreadyAdded = this.addedGoal.some(added => added.id === goal.id);
      if (!alreadyAdded) {
        this.addedGoal.push({
          id: goal.id,
          name: goal.name,
        });
      }
    });

    this.addedGoal = this.addedGoal.filter(added =>
      selected.some(dep => dep.id === added.id)
    );

    this.goalsOverlay.closeOverlay();
    // console.log(this.addedGoal);
  }


  // remove Goal from selected Goals
  removeGoal(goal: any): void {
    const index = this.addedGoal.findIndex(dep => dep.id === goal.id);
    if (index !== -1) {
      this.addedGoal.splice(index, 1);
    }

    const goalInList = this.Goals.find(g => g.id === goal.id);
    if (goalInList) {
      goalInList.selected = false;
    }

    this.selectAllAdded = this.addedGoal.length > 0 && this.addedGoal.every(g => g.selected);
  }


  removeSelectedGoals(): void {
    this.addedGoal = this.addedGoal.filter(goal => !goal.selected);

    this.Goals.forEach(goal => {
      if (this.addedGoal.every(a => a.id !== goal.id)) {
        goal.selected = false;
      }
    });

    this.selectAllAdded = this.addedGoal.length > 0 && this.addedGoal.every(goal => goal.selected);
  }






  hasChanges(): boolean {
    if (!this.initialData) return false;

    // Step1 changes
    if (JSON.stringify(this.deptStep1.value) !== JSON.stringify(this.initialData.step1)) {
      return true;
    }

    // Goals changes
    const currentGoals = this.addedGoal.map((g: any) => g.id).sort();
    const initialGoals = this.initialData.goals.map((g: any) => g.id).sort();
    if (JSON.stringify(currentGoals) !== JSON.stringify(initialGoals)) {
      return true;
    }

    // Sections changes
    if (JSON.stringify(this.sectionsFormArray.value) !== JSON.stringify(this.initialData.sections)) {
      return true;
    }

    return false;
  }



  updateDept() {

    if (this.deptStep1.invalid || this.deptStep2.invalid || this.sectionsFormArray.length === 0) {
      this.errMsg = 'Please complete both steps with valid data and at least one section.';
      return;
    }

    const form1Data = this.deptStep1.value;
    const originalSections = this.departmentData.sections || [];

    const currentSections = this.sectionsFormArray.controls.map((control: AbstractControl, index: number) => {
      const group = control as FormGroup;
      const subSections = this.getSubSections(group).controls.map((subControl: AbstractControl, subIndex: number) => {
        const subGroup = subControl as FormGroup;
        const id = subGroup.get('id')?.value || 0;

        const matchedOriginalSub = (originalSections.find((s: any) => s.id === group.get('id')?.value)?.sub_sections || [])
          .find((s: any) => s.id === id);

        let record_type = subGroup.get('record_type')?.value || 'create'; // Default to 'create' for new subsections
        if (matchedOriginalSub) {
          const changed =
            subGroup.get('secCode')?.value !== matchedOriginalSub.code ||
            subGroup.get('secName')?.value !== matchedOriginalSub.name ||
            subGroup.get('status')?.value !== matchedOriginalSub.is_active;

          record_type = changed ? 'update' : 'nothing';
        }

        return {
          id,
          index: subIndex + 1,
          record_type,
          code: subGroup.get('secCode')?.value,
          name: subGroup.get('secName')?.value,
          status: subGroup.get('status')?.value.toString()
        };
      });

      const deletedSubSections = (originalSections.find((s: any) => s.id === group.get('id')?.value)?.sub_sections || [])
        .filter((origSub: any) => !subSections.some(currSub => currSub.id === origSub.id))
        .map((sub: any, idx: number) => ({
          id: sub.id,
          index: subSections.length + idx + 1,
          record_type: 'delete',
          code: sub.code,
          name: sub.name,
          status: sub.is_active.toString()
        }));

      const allSubSections = [...subSections, ...deletedSubSections];

      const id = group.get('id')?.value || 0;
      const matchedOriginal = originalSections.find((s: any) => s.id === id);

      let record_type = 'create'; // Default to 'create' for new sections
      if (matchedOriginal) {
        const changed =
          group.get('secCode')?.value !== matchedOriginal.code ||
          group.get('secName')?.value !== matchedOriginal.name ||
          group.get('status')?.value !== matchedOriginal.is_active;

        record_type = changed ? 'update' : 'nothing';

        // If any subsection has create/update/delete, the parent section must be 'update'
        const subChanged = allSubSections.some(sub => sub.record_type === 'update' || sub.record_type === 'delete' || sub.record_type === 'create');
        if (subChanged) {
          record_type = 'update';
        }
      }

      return {
        id,
        index: index + 1,
        record_type,
        code: group.get('secCode')?.value,
        name: group.get('secName')?.value,
        status: group.get('status')?.value.toString(),
        sub_sections: allSubSections
      };
    });

    const deletedSections = originalSections
      .filter((orig: any) => !currentSections.some((curr: any) => curr.id === orig.id))
      .map((section: any, index: number) => ({
        id: section.id,
        index: currentSections.length + index + 1,
        code: section.code,
        name: section.name,
        status: section.is_active.toString(),
        record_type: 'delete',
        sub_sections: (section.sub_sections || []).map((sub: any, idx: number) => ({
          id: sub.id,
          index: idx + 1,
          code: sub.code,
          name: sub.name,
          status: sub.is_active.toString(),
          record_type: 'delete'
        }))
      }));

    const allSections = [...currentSections, ...deletedSections];

    // Get checklist IDs from currently checked items (same logic as onChecklistItemClick)
    const checklistIds = this.departmentChecklistItems
      .filter(listItem => {
        const listItemId = this.titleToIdMap.get(listItem.title);
        return listItemId !== undefined && listItem.status === true;
      })
      .map(listItem => this.titleToIdMap.get(listItem.title))
      .filter(id => id !== undefined) as number[];

    const finalData = {
      request_data: {
        id: this.departmentData.id,
        code: form1Data.code,
        name: form1Data.name,
        department_type: Number(form1Data.department_type),
        objectives: form1Data.objectives,
        goals: this.addedGoal.map((g: any) => g.id),
        sections: allSections,
        checklist: checklistIds
      }
    };
    // console.log(finalData);


    this.isLoading = true;
    this._DepartmentsService.updateDepartment(finalData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        this.router.navigate(['/departments/all-departments'], { queryParams: { page: this.currentPage } });
        this.toasterMessageService.showSuccess("Department Updated successfully", "Updated");
      },
      error: (err) => {
        this.isLoading = false;
        const statusCode = err?.status;
        const errorHandling = err?.error?.data?.error_handling;

        if (statusCode === 400) {
          if (Array.isArray(errorHandling) && errorHandling.length > 0) {
            this.currentStep = errorHandling[0].tap;
            this.errMsg = errorHandling[0].error;
          } else if (err?.error?.details) {
            this.errMsg = err.error.details;
          } else {
            this.errMsg = "An unexpected error occurred. Please try again later.";
          }
        } else {
          this.errMsg = "An unexpected error occurred. Please try again later.";
        }
      }
    });
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
    this.router.navigate(['/departments/all-departments']);
  }

  currentStep = 1;
  selectAll: boolean = false;

  goNext() {
    this.currentStep++;
  }

  goPrev() {
    this.currentStep--;
  }

  // Store assigned_checklist IDs from department response
  assignedChecklistIds: number[] = [];

  // Save assigned_checklist IDs from department response
  saveAssignedChecklistIds(): void {
    this.assignedChecklistIds = (this.departmentData?.assigned_checklist || []).map((item: any) => item.id);
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

      },
      error: (error) => {
        console.error('Error loading department checklist:', error);
        this.toasterMessageService.showError('Failed to load department checklist');
      }
    });
  }

  // Load department checklist and return observable for chaining
  private loadDepartmentChecklistObservable() {
    return this.departmentChecklistService.getDepartmetChecks(1, 10000).pipe(
      map((response) => {
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
        return response;
      })
    );
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

    // Get form data for sections
    const form1Data = this.deptStep1.value;
    const originalSections = this.departmentData.sections || [];

    const currentSections = this.sectionsFormArray.controls.map((control: AbstractControl, index: number) => {
      const group = control as FormGroup;
      const subSections = this.getSubSections(group).controls.map((subControl: AbstractControl, subIndex: number) => {
        const subGroup = subControl as FormGroup;
        const id = subGroup.get('id')?.value || 0;

        const matchedOriginalSub = (originalSections.find((s: any) => s.id === group.get('id')?.value)?.sub_sections || [])
          .find((s: any) => s.id === id);

        let record_type = subGroup.get('record_type')?.value || 'create';
        if (matchedOriginalSub) {
          const changed =
            subGroup.get('secCode')?.value !== matchedOriginalSub.code ||
            subGroup.get('secName')?.value !== matchedOriginalSub.name ||
            subGroup.get('status')?.value !== matchedOriginalSub.is_active;

          record_type = changed ? 'update' : 'nothing';
        }

        return {
          id,
          index: subIndex + 1,
          record_type,
          code: subGroup.get('secCode')?.value,
          name: subGroup.get('secName')?.value,
          status: subGroup.get('status')?.value.toString()
        };
      });

      const deletedSubSections = (originalSections.find((s: any) => s.id === group.get('id')?.value)?.sub_sections || [])
        .filter((origSub: any) => !subSections.some(currSub => currSub.id === origSub.id))
        .map((sub: any, idx: number) => ({
          id: sub.id,
          index: subSections.length + idx + 1,
          record_type: 'delete',
          code: sub.code,
          name: sub.name,
          status: sub.is_active.toString()
        }));

      const allSubSections = [...subSections, ...deletedSubSections];

      const id = group.get('id')?.value || 0;
      const matchedOriginal = originalSections.find((s: any) => s.id === id);

      let record_type = 'create';
      if (matchedOriginal) {
        const changed =
          group.get('secCode')?.value !== matchedOriginal.code ||
          group.get('secName')?.value !== matchedOriginal.name ||
          group.get('status')?.value !== matchedOriginal.is_active;

        record_type = changed ? 'update' : 'nothing';

        const subChanged = allSubSections.some(sub => sub.record_type === 'update' || sub.record_type === 'delete' || sub.record_type === 'create');
        if (subChanged) {
          record_type = 'update';
        }
      }

      return {
        id,
        index: index + 1,
        record_type,
        code: group.get('secCode')?.value,
        name: group.get('secName')?.value,
        status: group.get('status')?.value.toString(),
        sub_sections: allSubSections
      };
    });

    const deletedSections = originalSections
      .filter((orig: any) => !currentSections.some((curr: any) => curr.id === orig.id))
      .map((section: any, index: number) => ({
        id: section.id,
        index: currentSections.length + index + 1,
        code: section.code,
        name: section.name,
        status: section.is_active.toString(),
        record_type: 'delete',
        sub_sections: (section.sub_sections || []).map((sub: any, idx: number) => ({
          id: sub.id,
          index: idx + 1,
          code: sub.code,
          name: sub.name,
          status: sub.is_active.toString(),
          record_type: 'delete'
        }))
      }));

    const allSections = [...currentSections, ...deletedSections];

    // Build update payload matching edit-departments structure
    const updatePayload = {
      request_data: {
        id: this.departmentData.id,
        code: form1Data.code,
        name: form1Data.name,
        department_type: Number(form1Data.department_type),
        objectives: form1Data.objectives,
        goals: this.addedGoal.map((g: any) => g.id),
        sections: allSections,
        checklist: checkedIds
      }
    };

    // Call update endpoint
    this._DepartmentsService.updateDepartment(updatePayload).subscribe({
      next: (response) => {
        this.toasterMessageService.showSuccess('Checklist updated successfully', 'Updated Successfully');

        // Refresh department checklist from latest server response without reloading the whole page
        this._DepartmentsService.showDepartment(this.departmentData.id).subscribe({
          next: (deptResponse) => {
            const updatedDept = deptResponse.data.object_info;
            // Update only departmentData and checklist-related state
            this.departmentData = updatedDept;
            // Reload checklist to reflect updated assigned_checklist, then clear loading state
            this.loadDepartmentChecklistObservable().subscribe({
              next: () => {
                // Clear loading state only after department data and checklist are reloaded
                this.loadingChecklistItemTitle = null;
              },
              error: (checklistError) => {
                console.error('Error loading department checklist:', checklistError);
                // Clear loading state even on error to prevent stuck state
                this.loadingChecklistItemTitle = null;
              }
            });
          },
          error: (deptError) => {
            console.error('Error refreshing department after checklist update:', deptError);
            // Clear loading state even on error to prevent stuck state
            this.loadingChecklistItemTitle = null;
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
    // In edit mode, allow all items to be toggled (no disabled items)
    return [];
  }

}
