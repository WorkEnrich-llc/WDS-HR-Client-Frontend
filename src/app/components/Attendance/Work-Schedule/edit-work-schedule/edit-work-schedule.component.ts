import { Component, TemplateRef, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { WorkSchaualeService } from '../../../../core/services/attendance/work-schaduale/work-schauale.service';

@Component({
  selector: 'app-edit-work-schedule',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule, CommonModule, TableComponent, FormsModule, OverlayFilterBoxComponent],
  providers: [DatePipe],
  templateUrl: './edit-work-schedule.component.html',
  styleUrl: './edit-work-schedule.component.css'
})
export class EditWorkScheduleComponent {
  //deparment table
  @ViewChild('departmentTableHeader', { static: true }) departmentTableHeader!: TemplateRef<any>;
  @ViewChild('departmentTableRow', { static: true }) departmentTableRow!: TemplateRef<any>;

  // ِAdd department table
  @ViewChild('AlldepartmentTableHeader', { static: true }) AlldepartmentTableHeader!: TemplateRef<any>;
  @ViewChild('AlldepartmentTableRow', { static: true }) AlldepartmentTableRow!: TemplateRef<any>;

  //  overlay 
  @ViewChild('departmentsOverlay') departmentsOverlay!: OverlayFilterBoxComponent;
  @ViewChild('sectionsOverlay') sectionsOverlay!: OverlayFilterBoxComponent;

  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService,
    private _DepartmentsService: DepartmentsService,
    private _WorkSchaualeService: WorkSchaualeService
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }

  workScduleData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  workId: string | null = null;
  // changes 
  originalFormValue: any;
  originalDepartments: any[] = [];
  hasChanges = false;

  ngOnInit(): void {
    this.workId = this.route.snapshot.paramMap.get('id');
    if (this.workId) {
      this.getWorkSchedule(Number(this.workId));
    }

    // department added and search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.currentPage = 1;
      this.getAllDepartment(this.currentPage, search);
    });
    this.getAllDepartment(this.currentPage);



  }

  getWorkSchedule(workId: number) {
    this._WorkSchaualeService.showWorkSchedule(workId).subscribe({
      next: (response) => {
        this.workScduleData = response.data.object_info;

        const created = this.workScduleData?.created_at;
        const updated = this.workScduleData?.updated_at;

        this.workSchadule1.patchValue({
          code: this.workScduleData.code || '',
          name: this.workScduleData.name || ''
        });

        const system = this.workScduleData.system;
        if (system) {
          this.workSchadule2.patchValue({
            employment_type: system.employment_type,
            work_schedule_type: system.work_schedule_type,
            shift_hours: system.shift_hours,
            from: system.shift_range?.from || '',
            to: system.shift_range?.to || '',
            terms: system.terms_and_rules || ''
          });
        }

        const selectedDays = system?.days;
        if (selectedDays) {
          this.days.forEach(day => {
            const key = day.name.toLowerCase();
            day.selected = selectedDays[key] || false;
          });
        }

        this.addeddepartments = this.workScduleData.departments.map((dep: any) => ({
          id: dep.id,
          name: dep.name,
          create: dep.created_at || '',
          selectedSection: 0,
          sectionsCount: 0,
          sections: [],
          status: dep.is_active
        }));

        this.getAllDepartment(this.currentPage);

        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }
        setTimeout(() => {
          this.originalFormValue = {
            ...this.workSchadule1.value,
            ...this.workSchadule2.value,
            days: this.days.map(day => ({ name: day.name, selected: day.selected }))
          };
          this.originalDepartments = this.addeddepartments.map(dep => ({
            id: dep.id,
            status: dep.status
          }));
          this.checkForChanges();
        }, 0);

      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
  }


  // has chages
  ngAfterViewInit() {
    this.workSchadule1.valueChanges.subscribe(() => this.checkForChanges());
    this.workSchadule2.valueChanges.subscribe(() => this.checkForChanges());
  }

  checkForChanges() {
    const currentForm = {
      ...this.workSchadule1.value,
      ...this.workSchadule2.value,
      days: this.days.map(day => ({ name: day.name, selected: day.selected }))
    };

    const formChanged = JSON.stringify(currentForm) !== JSON.stringify(this.originalFormValue);

    const currentDepartments = this.addeddepartments.map(dep => ({
      id: dep.id,
      status: dep.status
    }));

    const departmentsChanged = JSON.stringify(currentDepartments) !== JSON.stringify(this.originalDepartments);

    this.hasChanges = formChanged || departmentsChanged;
  }


  // step 1
  workSchadule1: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
  });


  // step 2
  departments: any[] = [];
  addeddepartments: any[] = [];
  selectAll: boolean = false;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  getAllDepartment(pageNumber: number, searchTerm: string = '') {
    this._DepartmentsService.getAllDepartment(pageNumber, 10000, {
      search: searchTerm || undefined,
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;

        const activeDepartments = response.data.list_items.filter(
          (item: any) => item.is_active === true
        );

        this.departments = activeDepartments.map((item: any) => {
          const isSelected = this.addeddepartments.some(dep => dep.id === item.id);

          const sectionsWithSelection = (item.sections || []).map((section: any) => ({
            ...section,
            selected: false
          }));

          return {
            id: item.id,
            name: item.name,
            create: item.created_at,
            sectionsCount: sectionsWithSelection.length,
            sections: sectionsWithSelection,
            selected: isSelected
          };
        });

        this.addeddepartments = this.addeddepartments.map(added => {
          const fullDep = this.departments.find(dep => dep.id === added.id);
          return {
            ...added,
            create: fullDep?.create || '',
            sections: fullDep?.sections || [],
            sectionsCount: fullDep?.sectionsCount || 0
          };
        });

        this.selectAll = this.departments.length > 0 && this.departments.every(dep => dep.selected);
      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
  }


  //checkboxes 
  toggleSelectAll() {
    this.departments.forEach(department => {
      department.selected = this.selectAll;
    });
  }
  toggleDepartment(department: any) {
    // department.selected = !department.selected;
    if (!department.selected) {
      this.selectAll = false;
    } else if (this.departments.length && this.departments.every(dep => dep.selected)) {
      this.selectAll = true;
    }
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllDepartment(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllDepartment(this.currentPage);
  }
  discardDepartment(): void {
    // Reset search term
    this.searchTerm = '';

    // Reset all department selections to match only those already added
    this.departments.forEach(dep => {
      dep.selected = this.addeddepartments.some(added => added.id === dep.id);
    });

    // Update selectAll checkbox state
    this.selectAll = this.departments.length > 0 && this.departments.every(dep => dep.selected);

    // Close the overlay
    this.departmentsOverlay.closeOverlay();
  }

  addSelectedDepartments(): void {
    const selected = this.departments.filter(dep => dep.selected);

    selected.forEach(dep => {
      const alreadyAdded = this.addeddepartments.some(added => added.id === dep.id);
      if (!alreadyAdded) {
        this.addeddepartments.push({
          id: dep.id,
          name: dep.name,
          create: dep.create,
          selectedSection: 0,
          sectionsCount: dep.sectionsCount,
          sections: dep.sections,
          status: false
        });
      }
    });

    this.addeddepartments = this.addeddepartments.filter(added =>
      selected.some(dep => dep.id === added.id)
    );

    this.departmentsOverlay.closeOverlay();
    this.checkForChanges();
  }


  // remove Department from selected departments
  removeDepartment(department: any): void {
    const index = this.addeddepartments.findIndex(dep => dep.id === department.id);
    if (index !== -1) {
      this.addeddepartments.splice(index, 1);
    }

    const deptInList = this.departments.find(dep => dep.id === department.id);
    if (deptInList) {
      deptInList.selected = false;
    }

    this.selectAll = this.departments.length > 0 && this.departments.every(dep => dep.selected);
    this.checkForChanges();
  }

  // overlays boxes sliders
  openFirstOverlay() {
    this.departmentsOverlay.openOverlay();
  }

  selectedDepartmentSections: any[] = [];
  // added departmets table search
  searchAddedDepartmentTerm: string = '';

  get filteredDepartments() {
    return this.addeddepartments.filter(dept =>
      dept.name?.toLowerCase().includes(this.searchAddedDepartmentTerm.toLowerCase())
    );
  }


  searchDeptSectionsTerm: string = '';






  sortDirection: string = 'asc';
  currentSortColumn: string = '';

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.addeddepartments = this.addeddepartments.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (this.sortDirection === 'asc') {
        return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
      } else {
        return nameA < nameB ? 1 : (nameA > nameB ? -1 : 0);
      }
    });
  }
  toggleStatus(department: any): void {
    department.status = !department.status;
    this.checkForChanges();
  }



  // select days
  days = [
    { name: 'Sunday', selected: false },
    { name: 'Monday', selected: false },
    { name: 'Tuesday', selected: false },
    { name: 'Wednesday', selected: false },
    { name: 'Thursday', selected: false },
    { name: 'Friday', selected: false },
    { name: 'Saturday', selected: false },
  ];

  toggleDay(index: number): void {
    this.days[index].selected = !this.days[index].selected;
    this.checkForChanges();
  }

  // step 3
  workSchadule2: FormGroup = new FormGroup({
    employment_type: new FormControl('', [Validators.required]),
    work_schedule_type: new FormControl('', [Validators.required]),
    shift_hours: new FormControl(''),
    from: new FormControl(''),
    to: new FormControl(''),
    terms: new FormControl('', [Validators.required, Validators.minLength(10)]),
  }, {
    validators: [this.shiftRangeValidator.bind(this)]
  });

  // Custom validator to check if shift range matches the specified shift hours
  private validateShiftRange(): void {
    const shiftHours = this.workSchadule2.get('shift_hours')?.value;
    const from = this.workSchadule2.get('from')?.value;
    const to = this.workSchadule2.get('to')?.value;

    // Only validate if shift hours is specified and both time fields are filled
    if (shiftHours && from && to) {
      const calculatedHours = this.calculateShiftHours(from, to);
      const expectedHours = Number(shiftHours);

      // Allow small tolerance for rounding (0.1 hour = 6 minutes)
      const tolerance = 0.1;
      const difference = Math.abs(calculatedHours - expectedHours);

      if (difference > tolerance) {
        this.workSchadule2.get('from')?.setErrors({ shiftHoursMismatch: true });
        this.workSchadule2.get('to')?.setErrors({ shiftHoursMismatch: true });
      } else {
        // Clear the custom error if hours match
        const fromControl = this.workSchadule2.get('from');
        const toControl = this.workSchadule2.get('to');

        if (fromControl?.hasError('shiftHoursMismatch')) {
          const errors = fromControl.errors;
          delete errors?.['shiftHoursMismatch'];
          fromControl.setErrors(Object.keys(errors || {}).length > 0 ? errors : null);
        }

        if (toControl?.hasError('shiftHoursMismatch')) {
          const errors = toControl.errors;
          delete errors?.['shiftHoursMismatch'];
          toControl.setErrors(Object.keys(errors || {}).length > 0 ? errors : null);
        }
      }
    } else {
      // Clear errors if validation requirements not met
      const fromControl = this.workSchadule2.get('from');
      const toControl = this.workSchadule2.get('to');

      if (fromControl?.hasError('shiftHoursMismatch')) {
        const errors = fromControl.errors;
        delete errors?.['shiftHoursMismatch'];
        fromControl.setErrors(Object.keys(errors || {}).length > 0 ? errors : null);
      }

      if (toControl?.hasError('shiftHoursMismatch')) {
        const errors = toControl.errors;
        delete errors?.['shiftHoursMismatch'];
        toControl.setErrors(Object.keys(errors || {}).length > 0 ? errors : null);
      }
    }
  }

  private shiftRangeValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const shiftHours = group.get('shift_hours')?.value;
    const from = group.get('from')?.value;
    const to = group.get('to')?.value;

    if (shiftHours && from && to) {
      const calculatedHours = this.calculateShiftHours(from, to);
      const expectedHours = Number(shiftHours);
      const tolerance = 0.1;
      const difference = calculatedHours - expectedHours;

      if (difference < -tolerance) {
        return { shiftHoursMismatch: true };
      }
    }
    return null;
  }


  // Calculate shift hours from time range
  private calculateShiftHours(from: string, to: string): number {
    if (!from || !to) return 0;

    const [fromHours, fromMinutes] = from.split(':').map(Number);
    const [toHours, toMinutes] = to.split(':').map(Number);

    let hours = toHours - fromHours;
    let minutes = toMinutes - fromMinutes;

    // Handle case where end time is next day
    if (hours < 0) {
      hours += 24;
    }

    // Convert minutes to decimal hours
    const totalHours = hours + (minutes / 60);

    return totalHours;
  }

  onEmploymentTypeChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;

    // Reset shift range errors when employment type changes
    const fromControl = this.workSchadule2.get('from');
    const toControl = this.workSchadule2.get('to');

    if (fromControl?.hasError('shiftHoursMismatch')) {
      const errors = fromControl.errors;
      delete errors?.['shiftHoursMismatch'];
      fromControl.setErrors(Object.keys(errors || {}).length > 0 ? errors : null);
    }

    if (toControl?.hasError('shiftHoursMismatch')) {
      const errors = toControl.errors;
      delete errors?.['shiftHoursMismatch'];
      toControl.setErrors(Object.keys(errors || {}).length > 0 ? errors : null);
    }

    // Validate shift range
    // this.validateShiftRange();
  }

  // onShiftRangeChange(): void {
  //   this.validateShiftRange();
  // }

  // onShiftHoursChange(): void {
  //   this.validateShiftRange();
  // }

  onWorkTypeChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;

    const shiftHours = this.workSchadule2.get('shift_hours');
    const from = this.workSchadule2.get('from');
    const to = this.workSchadule2.get('to');

    if (selectedValue === '1' || selectedValue === '2') {
      shiftHours?.setValidators([Validators.required]);
      from?.setValidators([Validators.required]);
      to?.setValidators([Validators.required]);

      shiftHours?.reset('');
      from?.reset('');
      to?.reset('');
    } else if (selectedValue === '3') {
      shiftHours?.clearValidators();
      from?.clearValidators();
      to?.clearValidators();

      shiftHours?.reset('');
      from?.reset('');
      to?.reset('');
    }

    shiftHours?.updateValueAndValidity();
    from?.updateValueAndValidity();
    to?.updateValueAndValidity();
  }
  // check at least one day select 
  isAtLeastOneDaySelected(): boolean {
    return this.days.some(day => day.selected);
  }


  // update work schedule
  updateWorkScedule() {

    this.isLoading = true;

    const daysObject: { [key: string]: boolean } = {};
    this.days.forEach(day => {
      daysObject[day.name.toLowerCase()] = day.selected;
    });

    const currentDepartments = this.addeddepartments;
    const originalDepartments = this.originalDepartments;

    // بناء مصفوفة الأقسام بعد تحديد نوع التعديل
    const departmentsPayload = currentDepartments.map((dep, index) => {
      const original = originalDepartments.find(orig => orig.id === dep.id);

      let record_type = 'add';

      if (original) {
        if (original.status === dep.status) {
          record_type = 'nothing';
        } else {
          record_type = 'update';
        }
      }

      return {
        id: dep.id,
        status: dep.status,
        record_type,
        index: index + 1
      };
    }).concat(
      // الأقسام التي تم حذفها
      originalDepartments
        .filter(orig => !currentDepartments.some(dep => dep.id === orig.id))
        .map((removedDep, idx) => ({
          id: removedDep.id,
          status: removedDep.status,
          record_type: 'remove',
          index: currentDepartments.length + idx + 1
        }))
    );


    const request_data = {
      request_data: {
        id: this.workScduleData.id,
        code: this.workSchadule1.get('code')?.value,
        name: this.workSchadule1.get('name')?.value,
        departments: departmentsPayload,
        system: {
          days: daysObject,
          employment_type: Number(this.workSchadule2.get('employment_type')?.value),
          work_schedule_type: Number(this.workSchadule2.get('work_schedule_type')?.value),
          shift_hours: this.workSchadule2.get('shift_hours')?.value,
          shift_range: {
            from: this.workSchadule2.get('from')?.value,
            to: this.workSchadule2.get('to')?.value
          },
          terms_and_rules: this.workSchadule2.get('terms')?.value
        }
      }
    };


    this._WorkSchaualeService.updateWorkSchedule(request_data).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/schedule/work-schedule']);
        this.toasterMessageService.sendMessage("Work schedule Updated successfully");

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
    this.router.navigate(['/schedule/work-schedule']);
  }

}
