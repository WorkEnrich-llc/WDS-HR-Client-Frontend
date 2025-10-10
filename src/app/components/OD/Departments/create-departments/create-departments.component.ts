import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { OverlayFilterBoxComponent } from 'app/components/shared/overlay-filter-box/overlay-filter-box.component';
import { TableComponent } from 'app/components/shared/table/table.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { GoalsService } from 'app/core/services/od/goals/goals.service';

@Component({
  selector: 'app-create-departments',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule, ReactiveFormsModule, OverlayFilterBoxComponent, TableComponent],

  providers: [DatePipe],
  templateUrl: './create-departments.component.html',
  styleUrls: ['./../../../shared/table/table.component.css', './create-departments.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CreateDepartmentsComponent {
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  deptStep2: FormGroup;

  //  Goals overlay 
  @ViewChild('goalsOverlay') goalsOverlay!: OverlayFilterBoxComponent;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private datePipe: DatePipe,
    private _DepartmentsService: DepartmentsService,
    private toasterMessageService: ToasterMessageService,
    private subService: SubscriptionService,
    private goalsService: GoalsService,
  ) {
    this.deptStep2 = this.fb.group({
      sections: this.fb.array([])
    });

    this.addSection();


    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
    // console.log(this.todayFormatted); 
  }
  ngOnInit(): void {


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
  createSectionGroup(): FormGroup {
    return this.fb.group({
      secCode: [''],
      secName: ['', Validators.required],
      status: [true],
      collapsed: [true],
      sub_sections: this.fb.array<FormGroup>([])
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
        status: [true]
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
  loadData: boolean = false;

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }


  getAllGoals(pageNumber: number = 1, searchTerm: string = ''): void {
    this.loadData = true;

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

        this.loadData = false;
      },
      error: (err) => {
        console.error("Error loading goals:", err.error?.details || err.message);
        this.loadData = false;
      }
    });
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
    // goal.selected = !goal.selected;
    if (!goal.selected) {
      this.selectAllOverlay = false;
    } else if (this.Goals.length && this.Goals.every(goal => goal.selected)) {
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
    this.addedGoal = [];
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

  get hasSelectedGoals(): boolean {
    return this.addedGoal?.some(goal => goal.selected);
  }


  // create Department
  createDept() {
    if (this.deptStep1.invalid || this.deptStep2.invalid || this.sectionsFormArray.length === 0) {
      this.errMsg = 'Please complete both steps with valid data and at least one section.';
      return;
    }

    const form1Data = this.deptStep1.value;

    const sections = this.sectionsFormArray.controls.map((group, index) => {
      const subSections = this.getSubSections(group).controls.map((subGroup, subIndex) => ({
        id: 0,
        index: subIndex + 1,
        record_type: 'create',
        code: subGroup.get('secCode')?.value,
        name: subGroup.get('secName')?.value,
        status: subGroup.get('status')?.value.toString()
      }));

      return {
        id: 0,
        index: index + 1,
        record_type: 'create',
        code: group.get('secCode')?.value,
        name: group.get('secName')?.value,
        status: group.get('status')?.value.toString(),
        sub_sections: subSections
      };
    });

    const finalData = {
      request_data: {
        code: form1Data.code,
        name: form1Data.name,
        department_type: Number(form1Data.department_type),
        objectives: form1Data.objectives,
        goals: this.addedGoal.map(goal => goal.id),
        sections: sections,
        checklist: []
      }
    };

    // console.log(finalData);
    this.isLoading = true;
    this._DepartmentsService.createDepartment(finalData).subscribe({

      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/departments/all-departments']);
        this.toasterMessageService.sendMessage("Department created successfully");

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


  // next and prev
  currentStep = 1;

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
    this.router.navigate(['/departments']);
  }
}
