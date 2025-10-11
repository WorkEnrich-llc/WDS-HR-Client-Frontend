
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { ManageEmployeeSharedService } from '../services/manage-shared.service';
import { BranchesService } from '../../../../../core/services/od/branches/branches.service';
import { DepartmentsService } from '../../../../../core/services/od/departments/departments.service';
import { JobsService } from '../../../../../core/services/od/jobs/jobs.service';
import { pairwise, startWith } from 'rxjs';
// Work schedule moved to attendance step

@Component({
  selector: 'app-job-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './job-details-step.component.html',
  styleUrls: ['./job-details-step.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class JobDetailsStepComponent implements OnInit {
  sharedService = inject(ManageEmployeeSharedService);
  private branchesService = inject(BranchesService);
  private departmentsService = inject(DepartmentsService);
  private jobsService = inject(JobsService);

  ngOnInit(): void {
    this.loadInitialData();
    this.setupJobDetailsWatchers();

    // Clear any previous error messages when entering this step
    this.sharedService.clearErrorMessages();

    // Initially disable department, section, and job title selects until a branch/department is chosen
    const deptControl = this.sharedService.jobDetails.get('department_id');
    const sectionControl = this.sharedService.jobDetails.get('section_id');
    const jobTitleControl = this.sharedService.jobDetails.get('job_title_id');

    // If no branch is selected, disable department
    if (!this.sharedService.jobDetails.get('branch_id')?.value) {
      deptControl?.disable();
    }

    sectionControl?.disable();
    jobTitleControl?.disable();
  }

  private loadInitialData(): void {
    this.branchesService.getAllBranches(1, 100).subscribe({
      next: (res) => this.sharedService.branches.set(res.data.list_items),
      error: (err) => console.error('Error loading branches', err),
    });
    // Work schedules are now loaded in the Attendance step component
  }

  // private setupJobDetailsWatchers(): void {
  //   // Watch for branch changes to fetch departments and sections
  //   // Watch for branch changes to fetch departments and manage field states
  //   this.sharedService.jobDetails.get('branch_id')?.valueChanges.subscribe(branchId => {
  //     if (branchId) {
  //       // First clear all dependent data arrays to prevent automatic selection
  //       this.sharedService.departments.set([]);
  //       this.sharedService.sections.set([]);
  //       this.sharedService.jobTitles.set([]);

  //       // Reset all dependent fields to null BEFORE loading new data
  //       this.sharedService.jobDetails.get('department_id')?.setValue(null);
  //       this.sharedService.jobDetails.get('section_id')?.setValue(null);
  //       this.sharedService.jobDetails.get('job_title_id')?.setValue(null);

  //       // enable department select and clear any previous errors
  //       const deptControl = this.sharedService.jobDetails.get('department_id');
  //       deptControl?.enable();
  //       this.sharedService.clearFieldErrors('department_id', this.sharedService.jobDetails);

  //       // Keep section and job title disabled until department selected
  //       this.sharedService.jobDetails.get('section_id')?.disable();
  //       this.sharedService.jobDetails.get('job_title_id')?.disable();

  //       // Load departments after clearing everything
  //       this.loadDepartmentsByBranch(branchId);
  //     } else {
  //       // no branch: disable dependent selects
  //       this.sharedService.departments.set([]);
  //       this.sharedService.sections.set([]);
  //       this.sharedService.jobTitles.set([]);
  //       this.sharedService.jobDetails.get('department_id')?.setValue(null);
  //       this.sharedService.jobDetails.get('department_id')?.disable();
  //       this.sharedService.jobDetails.get('section_id')?.setValue(null);
  //       this.sharedService.jobDetails.get('section_id')?.disable();
  //       this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
  //       this.sharedService.jobDetails.get('job_title_id')?.disable();
  //     }
  //   });

  //   // Watch for department changes to reset section, load job titles, and enable section select
  //   this.sharedService.jobDetails.get('department_id')?.valueChanges.subscribe(departmentId => {
  //     this.sharedService.jobDetails.get('section_id')?.setValue(null);
  //     this.sharedService.jobDetails.get('job_title_id')?.setValue(null);

  //     if (departmentId) {
  //       // Clear error messages and field errors when department is selected
  //       this.sharedService.clearErrorMessages();
  //       this.sharedService.clearFieldErrors('department_id', this.sharedService.jobDetails);
  //       this.sharedService.clearFieldErrors('section_id', this.sharedService.jobDetails);
  //       this.sharedService.clearFieldErrors('job_title_id', this.sharedService.jobDetails);

  //       // enable section select, but keep job title disabled until a section is chosen
  //       this.sharedService.jobDetails.get('section_id')?.enable();
  //       this.sharedService.jobDetails.get('job_title_id')?.disable();

  //       // Filter sections to the selected department only (so section select shows relevant sections)
  //       const depts = this.sharedService.departments();
  //       const selectedDept = depts.find((d: any) => d.id == departmentId);
  //       const deptSections = selectedDept && Array.isArray(selectedDept.sections) ? selectedDept.sections : [];
  //       this.sharedService.sections.set(deptSections);

  //       // Work schedule updates moved to AttendanceDetailsStepComponent
  //     } else {
  //       this.sharedService.jobTitles.set([]);
  //       // disable section and job title when no department
  //       this.sharedService.jobDetails.get('section_id')?.disable();
  //       this.sharedService.jobDetails.get('job_title_id')?.disable();
  //       // clear sections list
  //       this.sharedService.sections.set([]);
  //     }
  //   });

  //   // Watch for section changes to fetch job titles filtered by section
  //   this.sharedService.jobDetails.get('section_id')?.valueChanges.subscribe(sectionId => {
  //     // reset dependent field
  //     this.sharedService.jobDetails.get('job_title_id')?.setValue(null);

  //     if (sectionId) {
  //       // Clear errors and enable job title select
  //       this.sharedService.clearErrorMessages();
  //       this.sharedService.clearFieldErrors('section_id', this.sharedService.jobDetails);
  //       this.sharedService.clearFieldErrors('job_title_id', this.sharedService.jobDetails);

  //       this.sharedService.jobDetails.get('job_title_id')?.enable();

  //       // Fetch job titles filtered by section (correct behavior)
  //       this.jobsService.getAllJobTitles(1, 100, { section: sectionId.toString() }).subscribe({
  //         next: res => {
  //           const titles = res.data?.list_items || [];
  //           this.sharedService.jobTitles.set(titles);
  //         },
  //         error: err => {
  //           console.error('Error loading job titles for section', err);
  //           this.sharedService.jobTitles.set([]);
  //         }
  //       });
  //     } else {
  //       this.sharedService.jobTitles.set([]);
  //       this.sharedService.jobDetails.get('job_title_id')?.disable();
  //     }
  //   });
  // }

  // private setupJobDetailsWatchers(): void {
  //   // Watch for branch changes to fetch departments and manage field states
  //   this.sharedService.jobDetails.get('branch_id')?.valueChanges.pipe(
  //     startWith(this.sharedService.jobDetails.get('branch_id')?.value), // ابدأ بالقيمة الحالية (مهم للتحميل الأول)
  //     pairwise() // احصل على القيمة السابقة والحالية معًا [prev, curr]
  //   ).subscribe(([prevBranchId, currentBranchId]) => {
  //     if (currentBranchId) {
  //       // *** التغيير الرئيسي هنا ***
  //       // لا تقم بإعادة تعيين الحقول التابعة إلا إذا كان هناك تغيير فعلي من قبل المستخدم
  //       // (أي أن القيمة السابقة لم تكن فارغة)
  //       if (prevBranchId !== null && prevBranchId !== currentBranchId) {
  //         this.sharedService.jobDetails.get('department_id')?.setValue(null);
  //         this.sharedService.jobDetails.get('section_id')?.setValue(null);
  //         this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
  //       }

  //       this.sharedService.departments.set([]);
  //       this.sharedService.sections.set([]);
  //       this.sharedService.jobTitles.set([]);

  //       const deptControl = this.sharedService.jobDetails.get('department_id');
  //       deptControl?.enable();
  //       this.sharedService.clearFieldErrors('department_id', this.sharedService.jobDetails);

  //       this.sharedService.jobDetails.get('section_id')?.disable();
  //       this.sharedService.jobDetails.get('job_title_id')?.disable();

  //       this.loadDepartmentsByBranch(currentBranchId);
  //     } else {
  //       // الكود الخاص بحالة عدم وجود فرع يبقى كما هو
  //       this.sharedService.departments.set([]);
  //       this.sharedService.sections.set([]);
  //       this.sharedService.jobTitles.set([]);
  //       this.sharedService.jobDetails.get('department_id')?.setValue(null);
  //       this.sharedService.jobDetails.get('department_id')?.disable();
  //       this.sharedService.jobDetails.get('section_id')?.setValue(null);
  //       this.sharedService.jobDetails.get('section_id')?.disable();
  //       this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
  //       this.sharedService.jobDetails.get('job_title_id')?.disable();
  //     }
  //   });
  //   // باقي المراقبين (watchers) للقسم والمسمى الوظيفي يبقون كما هم بدون تغيير
  //   // ... a باقي الكود الخاص بك ...
  // }

  private setupJobDetailsWatchers(): void {
    // 1. مراقب الفرع (Branch watcher)
    this.sharedService.jobDetails.get('branch_id')?.valueChanges.pipe(
      startWith(this.sharedService.jobDetails.get('branch_id')?.value),
      pairwise()
    ).subscribe(([prevBranchId, currentBranchId]) => {
      if (currentBranchId) {
        // إعادة تعيين الحقول التابعة فقط عند التغيير الفعلي
        if (prevBranchId !== null && prevBranchId !== currentBranchId) {
          this.sharedService.jobDetails.get('department_id')?.setValue(null);
          this.sharedService.jobDetails.get('section_id')?.setValue(null);
          this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
        }
        this.sharedService.departments.set([]);
        this.sharedService.jobDetails.get('department_id')?.enable();
        this.sharedService.jobDetails.get('section_id')?.disable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
        this.loadDepartmentsByBranch(currentBranchId);
      } else {
        // منطق التصفير في حالة عدم اختيار فرع
        this.sharedService.departments.set([]);
        this.sharedService.sections.set([]);
        this.sharedService.jobTitles.set([]);
        this.sharedService.jobDetails.get('department_id')?.disable();
        this.sharedService.jobDetails.get('section_id')?.disable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      }
    });

    // 2. مراقب القسم (Department watcher)
    this.sharedService.jobDetails.get('department_id')?.valueChanges.pipe(
      startWith(this.sharedService.jobDetails.get('department_id')?.value),
      pairwise()
    ).subscribe(([prevDeptId, currentDeptId]) => {
      // إعادة تعيين الحقول التابعة فقط عند التغيير الفعلي
      if (prevDeptId !== null && prevDeptId !== currentDeptId) {
        this.sharedService.jobDetails.get('section_id')?.setValue(null);
        this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
      }

      if (currentDeptId) {
        const depts = this.sharedService.departments();
        const selectedDept = depts.find((d: any) => d.id == currentDeptId);
        const deptSections = selectedDept && Array.isArray(selectedDept.sections) ? selectedDept.sections : [];
        this.sharedService.sections.set(deptSections);
        this.sharedService.jobDetails.get('section_id')?.enable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      } else {
        this.sharedService.sections.set([]);
        this.sharedService.jobTitles.set([]);
        this.sharedService.jobDetails.get('section_id')?.disable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      }
    });

    // 3. مراقب القطاع (Section watcher)
    this.sharedService.jobDetails.get('section_id')?.valueChanges.pipe(
      startWith(this.sharedService.jobDetails.get('section_id')?.value),
      pairwise()
    ).subscribe(([prevSectionId, currentSectionId]) => {
      if (prevSectionId !== null && prevSectionId !== currentSectionId) {
        this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
      }

      if (currentSectionId) {
        this.sharedService.jobDetails.get('job_title_id')?.enable();
        // استخدم الدالة المساعدة هنا
        this.loadJobTitlesBySection(currentSectionId);
      } else {
        this.sharedService.jobTitles.set([]);
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      }
    });
    // this.sharedService.jobDetails.get('section_id')?.valueChanges.pipe(
    //   startWith(this.sharedService.jobDetails.get('section_id')?.value),
    //   pairwise()
    // ).subscribe(([prevSectionId, currentSectionId]) => {
    //   // إعادة تعيين المسمى الوظيفي فقط عند التغيير الفعلي
    //   if (prevSectionId !== null && prevSectionId !== currentSectionId) {
    //     this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
    //   }

    //   if (currentSectionId) {
    //     this.sharedService.jobDetails.get('job_title_id')?.enable();
    //     this.jobsService.getAllJobTitles(1, 100, { section: currentSectionId.toString() }).subscribe({
    //       next: res => {
    //         const titles = res.data?.list_items || [];
    //         this.sharedService.jobTitles.set(titles);
    //       },
    //       error: err => {
    //         console.error('Error loading job titles for section', err);
    //         this.sharedService.jobTitles.set([]);
    //       }
    //     });
    //   } else {
    //     this.sharedService.jobTitles.set([]);
    //     this.sharedService.jobDetails.get('job_title_id')?.disable();
    //   }
    // });
  }



  loadDepartmentsByBranch(branchId: number): void {
    this.departmentsService.getAllDepartment(1, 100, { branch_id: branchId, status: 'all' }).subscribe({
      next: (res) => {
        const depts = res.data?.list_items || [];
        this.sharedService.departments.set(depts);

        // --- START: NEW LOGIC FOR UPDATE MODE ---
        // 1. تحقق من وجود قيمة مُسبقة للقسم في الفورم
        const currentDeptId = this.sharedService.jobDetails.get('department_id')?.value;
        if (currentDeptId) {

          // 2. ابحث عن القسم المحدد من ضمن قائمة الأقسام التي تم تحميلها للتو
          const selectedDept = depts.find((d: any) => d.id == currentDeptId);
          if (selectedDept) {

            // 3. إذا وجدته، قم بملء قائمة القطاعات التابعة له
            const deptSections = Array.isArray(selectedDept.sections) ? selectedDept.sections : [];
            this.sharedService.sections.set(deptSections);

            // 4. الآن، تحقق من وجود قيمة مُسبقة للقطاع في الفورم
            const currentSectionId = this.sharedService.jobDetails.get('section_id')?.value;
            if (currentSectionId) {

              // 5. إذا وجدته، قم بتحميل المسميات الوظيفية التابعة له فورًا
              this.loadJobTitlesBySection(currentSectionId);
            }
          }
        }
        // --- END: NEW LOGIC FOR UPDATE MODE ---
      },
      error: (err) => {
        console.error('Error loading departments by branch', err);
        this.sharedService.departments.set([]);
        this.sharedService.sections.set([]);
      }
    });
  }

  private loadJobTitlesBySection(sectionId: number): void {
    this.jobsService.getAllJobTitles(1, 100, { section: sectionId.toString() }).subscribe({
      next: res => {
        const titles = res.data?.list_items || [];
        this.sharedService.jobTitles.set(titles);
      },
      error: err => {
        console.error('Error loading job titles for section', err);
        this.sharedService.jobTitles.set([]);
      }
    });
  }

  // loadDepartmentsByBranch(branchId: number): void {
  //   // Fetch departments for selected branch using filters
  //   this.departmentsService.getAllDepartment(1, 100, { branch_id: branchId, status: 'all' }).subscribe({
  //     next: (res) => {
  //       const depts = res.data?.list_items || [];
  //       this.sharedService.departments.set(depts);

  //       // Do NOT set sections here - keep them empty until department is selected
  //       // This prevents automatic selection when there's only one department
  //       this.sharedService.sections.set([]);

  //       // Ensure no automatic selection by explicitly keeping values null
  //       this.sharedService.jobDetails.get('department_id')?.setValue(null);
  //       this.sharedService.jobDetails.get('section_id')?.setValue(null);
  //       this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
  //     },
  //     error: (err) => {
  //       console.error('Error loading departments by branch', err);
  //       this.sharedService.departments.set([]);
  //       this.sharedService.sections.set([]);
  //     }
  //   });
  // }

  goNext() {
    // Clear any previous error messages before validation
    this.sharedService.clearErrorMessages();

    // Validate job details before proceeding
    if (this.sharedService.validateCurrentStep()) {
      this.sharedService.goNext();
    }
  }

  goPrev() {
    // Clear any error messages when going back
    this.sharedService.clearErrorMessages();
    this.sharedService.goPrev();
  }

  // Helper method to reset form field state
  private resetFieldState(fieldName: string): void {
    const control = this.sharedService.jobDetails.get(fieldName);
    if (control) {
      control.setErrors(null);
      control.markAsUntouched();
      control.markAsPristine();
    }
  }
}
