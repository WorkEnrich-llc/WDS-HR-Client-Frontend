import { ChangeDetectorRef, Component, NgZone, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, tap } from 'rxjs';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { GoogleMapsLocationComponent, LocationData } from '../../../shared/google-maps-location/google-maps-location.component';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
interface Department {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  sections: string;
  status: string;
}
@Component({
  selector: 'app-edit-branch-info',
  imports: [PageHeaderComponent, CommonModule, SkelatonLoadingComponent, TableComponent, OverlayFilterBoxComponent, FormsModule, PopupComponent, ReactiveFormsModule, GoogleMapsLocationComponent],
  providers: [DatePipe],
  templateUrl: './edit-branch-info.component.html',
  styleUrl: './edit-branch-info.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class EditBranchInfoComponent implements OnInit {
  //deparment table
  @ViewChild('departmentTableHeader', { static: true }) departmentTableHeader!: TemplateRef<any>;
  @ViewChild('departmentTableRow', { static: true }) departmentTableRow!: TemplateRef<any>;

  // ِAdd department table
  @ViewChild('AlldepartmentTableHeader', { static: true }) AlldepartmentTableHeader!: TemplateRef<any>;
  @ViewChild('AlldepartmentTableRow', { static: true }) AlldepartmentTableRow!: TemplateRef<any>;

  //  overlay 
  @ViewChild('departmentsOverlay') departmentsOverlay!: OverlayFilterBoxComponent;
  @ViewChild('sectionsOverlay') sectionsOverlay!: OverlayFilterBoxComponent;

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private _BranchesService: BranchesService,
    private toasterMessageService: ToasterMessageService,
    private _DepartmentsService: DepartmentsService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private subService: SubscriptionService,
    private ngZone: NgZone
  ) { }

  branchData: any = { sections: [] };
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  branchId: string | null = null;
  errMsg: string = '';
  isLoading: boolean = false;
  isLocationReady: boolean = false;

  // Location data for step 3
  locationData: LocationData = {
    latitude: 0,
    longitude: 0,
    radiusRange: 120,
    displayLatitude: '',
    displayLongitude: '',
    map_country: '',
    map_city: '',
    map_region: '',
    map_address: ''
  };

  // Flag to track if map location has been confirmed before saving
  locationConfirmed: boolean = true;

  branchSub: any;
  ngOnInit(): void {
    this.subService.subscription$.subscribe(sub => {
      this.branchSub = sub?.Branches;
    });

    this.branchId = this.route.snapshot.paramMap.get('id');

    if (this.branchId) {
      this.showBranch(Number(this.branchId)).subscribe(() => {
        this.getAllDepartment(this.currentPage);
      });
    } else {
      this.getAllDepartment(this.currentPage);
    }

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.currentPage = 1;
      this.getAllDepartment(this.currentPage, search);
    });
  }




  // form step 1
  branchStep1: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.maxLength(81)]),
    location: new FormControl(''),
    maxEmployee: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
  });


  // form step 2
  departments: any[] = [];
  addeddepartments: any[] = [];
  selectAll: boolean = false;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  sectionChanges: boolean = false;

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  // get all departments
  getAllDepartment(pageNumber: number, searchTerm: string = '') {
    this._DepartmentsService.getAllDepartment(pageNumber, 10000, {
      search: searchTerm || undefined,
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;

        // console.log('Departments (before filter):', response.data.list_items);

        const activeDepartments = response.data.list_items.filter(
          (item: any) => item.is_active === true
        );

        this.departments = activeDepartments.map((item: any) => {
          const isSelected = this.addeddepartments.some(dep => dep.id === item.id);

          let rawSections: any[] = [];

          if (item.sections) {
            if (Array.isArray(item.sections)) {
              rawSections = item.sections;
            } else if (item.sections.options_list) {
              rawSections = item.sections.options_list;
            }
          }

          const activeSections = rawSections.filter(
            (section: any) => section.is_active === true
          );

          const optionsList = activeSections.map((section: any) => ({
            ...section,
            selected: false
          }));

          const selectedList = optionsList.filter(s => s.selected);

          return {
            id: item.id,
            name: item.name,
            code: item.code || '',
            objectives: item.objectives || '',
            is_active: item.is_active ?? true,
            created_at: item.created_at,
            updated_at: item.updated_at,
            selected: isSelected,
            relationship_id: item.relationship_id || null,
            sections: {
              selected_list: selectedList,
              options_list: optionsList
            }
          };
        });

        // console.log('Filtered Active Departments:', this.departments);

        this.selectAll = this.departments.length > 0 && this.departments.every(dep => dep.selected);
      },
      error: (err) => {
        console.log(err.error?.details);
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
    setTimeout(() => {
      if (!department.selected) {
        this.selectAll = false;
      } else if (this.departments.length && this.departments.every(dep => dep.selected)) {
        this.selectAll = true;
      }
    });
  }


  // pagination
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllDepartment(this.currentPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllDepartment(this.currentPage);
  }

  // discard department
  discardDepartment(): void {
    this.departmentsOverlay.closeOverlay();
    // reset search term when closing overlay
    this.searchTerm = '';
  }

  // add selected departments
  addSelectedDepartments(): void {
    const selected = this.departments.filter(dep => dep.selected);

    selected.forEach(dep => {
      const alreadyAdded = this.addeddepartments.some(added => added.id === dep.id);
      if (!alreadyAdded) {
        this.addeddepartments.push({
          id: dep.id,
          name: dep.name,
          selectedSection: 0,
          sectionsCount: dep.sectionsCount,
          sections: dep.sections,
        });
      }
    });

    this.addeddepartments = this.addeddepartments.filter(added =>
      selected.some(dep => dep.id === added.id)
    );

    this.departmentsOverlay.closeOverlay();

    // console.log(this.addeddepartments);
  }

  // branch data
  originalFormData: any;
  originalDepartments: any[] = [];
  originalDepartmentsSnapshot: any[] = [];
  loadData: boolean = false;
  showBranch(branchId: number) {
    this.loadData = true;
    return this._BranchesService.showBranch(branchId).pipe(
      tap((response) => {
        this.branchData = response.data.object_info;
        this.addeddepartments = this.branchData.departments || [];

        this.branchStep1.patchValue({
          code: this.branchData.code || '',
          name: this.branchData.name || '',
          location: this.branchData.location || '',
          maxEmployee: this.branchData.max_employee || '',
        });

        if (this.branchData.latitude && this.branchData.longitude) {
          this.locationData = {
            latitude: parseFloat(this.branchData.latitude),
            longitude: parseFloat(this.branchData.longitude),
            radiusRange: this.branchData.radius_range || 120,
            displayLatitude: this.branchData.latitude,
            displayLongitude: this.branchData.longitude
          };
        }

        this.originalFormData = { ...this.branchStep1.value };
        this.originalDepartmentsSnapshot = JSON.parse(JSON.stringify(this.addeddepartments));
        this.originalDepartments = [...this.addeddepartments];

        const created = this.branchData?.created_at;
        const updated = this.branchData?.updated_at;
        if (created) this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        if (updated) this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        if (this.branchData.latitude && this.branchData.longitude) {
          this.locationData = {
            latitude: parseFloat(this.branchData.latitude),
            longitude: parseFloat(this.branchData.longitude),
            radiusRange: this.branchData.radius_range || 120,
            displayLatitude: this.branchData.latitude,
            displayLongitude: this.branchData.longitude,
            map_country: this.branchData.map_country || '',
            map_city: this.branchData.map_city || '',
            map_address: this.branchData.map_address || ''
          };

          this.isLocationReady = true;
          this.locationConfirmed = true;
        }

        this.loadData = false;
      }),
      catchError((err) => {
        console.log(err.error?.details);
        this.loadData = false;
        return of(null);
      })
    );
  }


  // check form changed

  isFormChanged(): boolean {
    const currentForm = this.branchStep1.value;
    const originalForm = this.originalFormData;

    const isFormDifferent = Object.keys(currentForm).some(
      key => currentForm[key] !== originalForm[key]
    );

    const currentIds = this.addeddepartments.map(dept => dept.id).sort();
    const originalIds = this.originalDepartmentsSnapshot.map(dept => dept.id).sort();

    const isDepartmentsDifferent = currentIds.length !== originalIds.length ||
      currentIds.some((id, index) => id !== originalIds[index]);

    const isSectionChanged = this.addeddepartments.some((dept) => {
      const originalDept = this.originalDepartmentsSnapshot.find(d => d.id === dept.id);
      return (
        dept.selectedSection !== originalDept?.selectedSection ||
        JSON.stringify(dept.sections?.selected_list || []) !== JSON.stringify(originalDept?.sections?.selected_list || [])
      );
    });

    // Check if map coordinates have changed
    const originalLatitude = this.branchData?.latitude ? parseFloat(this.branchData.latitude) : 0;
    const originalLongitude = this.branchData?.longitude ? parseFloat(this.branchData.longitude) : 0;
    const originalRadiusRange = this.branchData?.radius_range || 120;

    const isLocationChanged = this.locationData.latitude !== originalLatitude ||
      this.locationData.longitude !== originalLongitude ||
      this.locationData.radiusRange !== originalRadiusRange;

    return isFormDifferent || isDepartmentsDifferent || isSectionChanged || isLocationChanged;
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
    this.isFormChanged();
  }

  // sort
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.addeddepartments = this.addeddepartments.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
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
    this.router.navigate(['/branches/all-branches']);
  }



  // overlays boxes sliders
  openFirstOverlay() {
    this.searchTerm = '';

    if (this.departments.length > 0) {
      this.departments.forEach(dep => {
        dep.selected = this.addeddepartments.some(a => a.id === dep.id);
      });
      this.selectAll = this.departments.length > 0 && this.departments.every(dep => dep.selected);
      this.departmentsOverlay.openOverlay();
    } else {
      this.getAllDepartment(1);
      this.departmentsOverlay.openOverlay();
    }
  }

  selectedDepartmentSections: any[] = [];

  openSecondOverlay(department: any): void {
    this.selectedDepartmentId = department.id;

    const selectedList = department.sections?.selected_list || [];
    const optionsList = department.sections?.options_list || [];

    this.tempSections = optionsList.map((section: any) => {
      const isSelected = selectedList.some((s: any) => s.id === section.id);
      return {
        ...section,
        selected: isSelected
      };
    });

    this.selectedDepartmentSections = this.tempSections;
    this.sectionsOverlay.openOverlay();
  }


  selectedDepartmentId: number | null = null;
  tempSections: any[] = [];
  toggleSectionSelection(section: any): void {
    section.selected = !section.selected;
  }

  confirmSectionChanges(): void {
    const department = this.addeddepartments.find(
      (dep) => dep.id === this.selectedDepartmentId
    );
    if (!department) return;

    const selectedSections = this.tempSections.filter((section) => section.selected);

    const originalDept = this.originalDepartments.find((d) => d.id === department.id);
    const originalSelected: any[] = originalDept?.sections?.selected_list || [];

    // تحقق إذا كان في اختلاف فعلي
    const isDifferent =
      department.selectedSection !== originalDept?.selectedSection ||
      JSON.stringify(selectedSections.map((s) => s.id).sort()) !==
      JSON.stringify(originalSelected.map((s) => s.id).sort());

    if (!isDifferent) {
      this.sectionsOverlay.closeOverlay();
      return;
    }

    if (!department.sections) {
      department.sections = { selected_list: [], options_list: [] };
    }

    // تأكد أن عندنا نسخة من options_list
    if (!Array.isArray(department.sections.options_list)) {
      department.sections.options_list = [...this.tempSections];
    }

    // تحديد السكاشن اللي اتشالت
    const removedSections = originalSelected.filter(
      (orig: any) => !selectedSections.some((sel: any) => sel.id === orig.id)
    );

    // تحديد السكاشن الجديدة
    const addedSections = selectedSections.filter(
      (sel: any) => !originalSelected.some((orig: any) => orig.id === sel.id)
    );

    // حدّث السكاشن المختارة
    department.sections.selected_list = selectedSections;

    // عدّل الـ record_type في السكاشن اللي اتشالت
    removedSections.forEach((removed: any) => {
      const existing = department.sections.options_list.find((opt: any) => opt.id === removed.id);
      if (existing) {
        existing.record_type = "delete";
        existing.selected = false;
      } else {
        department.sections.options_list.push({
          ...removed,
          selected: false,
          record_type: "delete",
        });
      }
    });

    // رجّع record_type طبيعي للسكاشن اللي رجعت تتحدد
    addedSections.forEach((added: any) => {
      const existing = department.sections.options_list.find((opt: any) => opt.id === added.id);
      if (existing) {
        existing.record_type = null;
        existing.selected = true;
      }
    });

    // عدّد السكاشن
    department.selectedSection = selectedSections.length;

    this.cdr.detectChanges();
    this.sectionsOverlay.closeOverlay();
  }


  discardSectionChanges(): void {
    this.selectedDepartmentId = null;
    this.tempSections = [];
    this.selectedDepartmentSections = [];
    this.sectionsOverlay.closeOverlay();
  }

  // update branch
  updateBranch() {
    this.isLoading = true;
    // Prevent saving if in step 3 and location not yet confirmed
    if (this.currentStep === 3 && !this.locationConfirmed) {
      this.isLoading = false;
      this.errMsg = 'Please confirm the location on the map before saving.';
      return;
    }
    if (this.branchStep1.invalid) {
      console.warn('Form is invalid');
      return;
    }

    const formData = this.branchStep1.value;

    const originalDepartments = this.originalDepartments || [];

    const removedDepartments = originalDepartments.filter(origDep =>
      !this.addeddepartments.some(dep => dep.id === origDep.id)
    ).map((dep, depIndex) => ({
      id: dep.id,
      record_type: 'remove',
      index: depIndex + 1,
      sections: []
    }));

    const updatedDepartments = this.addeddepartments.map((dep, depIndex) => {
      const originalDep = originalDepartments.find(od => od.id === dep.id);

      const isNew = !originalDep;
      const record_type = isNew ? 'add' : 'nothing';

      const selectedSections = dep.sections?.selected_list || [];

      const sections = selectedSections.map((section: any, secIndex: number) => {
        const originalSections = originalDep?.sections?.selected_list || [];
        const originalSection = originalSections.find((os: any) => os.id === section.id);

        const sectionRecordType = !originalSection ? 'add' : 'nothing';

        return {
          id: section.id,
          record_type: sectionRecordType,
          index: secIndex + 1
        };
      });

      return {
        id: dep.id,
        record_type: record_type,
        index: depIndex + 1,
        sections: sections
      };
    });

    const departments = [...updatedDepartments, ...removedDepartments];

    const requestPayload = {
      request_data: {
        id: Number(this.branchId),
        code: formData.code,
        name: formData.name,
        location: formData.location,
        max_employee: Number(formData.maxEmployee),
        latitude: this.locationData.latitude,
        longitude: this.locationData.longitude,
        radius_range: this.locationData.radiusRange,
        map_country: this.locationData.map_country,
        map_city: this.locationData.map_city,
        map_region: this.locationData.map_region,
        map_address: this.locationData.map_address,
        departments: departments
      }
    };

    // console.log(requestPayload);

    this._BranchesService.updateBranch(requestPayload).subscribe({

      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/branches/all-branches']);
        this.toasterMessageService.sendMessage("Branch Updated successfully");

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



  // steps
  currentStep = 1;

  goNext() {
    this.currentStep++;

  }

  goPrev() {
    this.currentStep--;

  }


  // added departmets table search
  searchAddedDepartmentTerm: string = '';

  get filteredDepartments() {
    return this.addeddepartments.filter(dept =>
      dept.name?.toLowerCase().includes(this.searchAddedDepartmentTerm.toLowerCase())
    );
  }


  searchDeptSectionsTerm: string = '';

  get filteredSections() {
    return this.selectedDepartmentSections.filter(dept =>
      dept.name?.toLowerCase().includes(this.searchDeptSectionsTerm.toLowerCase())
    );
  }

  // Handle location changes from Google Maps component
  // Handle location changes (marker moved, search, etc.)
  onLocationChanged(locationData: LocationData): void {
    this.locationData = { ...locationData };
    // Reset confirmation flag until user confirms the location
    this.isLocationReady = false;
    // Clear any previous errors
    this.errMsg = '';
  }

  // Handle location confirmation (user pressed "Confirm")
  onLocationConfirmed(event: LocationData): void {

    this.ngZone.run(() => {
      this.locationData = { ...event };

      this.isLocationReady = !!(
        this.locationData.map_country &&
        this.locationData.map_city &&
        this.locationData.map_address &&
        this.locationData.latitude &&
        this.locationData.longitude
      );
    });
  }

}
