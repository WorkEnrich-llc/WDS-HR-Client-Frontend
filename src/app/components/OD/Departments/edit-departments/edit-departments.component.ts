import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-edit-departments',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './edit-departments.component.html',
  styleUrls: ['./../../../shared/table/table.component.css', './edit-departments.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EditDepartmentsComponent implements OnInit {
  constructor(private _DepartmentsService: DepartmentsService, private route: ActivatedRoute, private fb: FormBuilder,
    private router: Router,
    private datePipe: DatePipe, private toasterMessageService: ToasterMessageService) {
    this.deptStep2 = this.fb.group({
      sections: this.fb.array([])
    });

  }


  departmentData: any = { sections: [] };
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  deptId: string | null = null;
  currentPage: number = 1;

  ngOnInit(): void {
    this.deptId = this.route.snapshot.paramMap.get('id');
    // this.getDepartment(Number(this.deptId));
    if (this.deptId) {
      this.getDepartment(Number(this.deptId));
    }

    this.route.queryParams.subscribe(params => {
    this.currentPage = +params['page'] || 1; 
  });
  }

  getDepartment(deptId: number) {
    this._DepartmentsService.showDepartment(deptId).subscribe({
      next: (response) => {
        this.departmentData = response.data.object_info;

        this.deptStep1.patchValue({
          code: this.departmentData.code || '',
          name: this.departmentData.name || '',
          objectives: this.departmentData.objectives || ''
        });

        this.sectionsFormArray.clear();

        this.departmentData.sections?.forEach((section: any) => {
          const sectionGroup = this.fb.group({
            secCode: [section.code, Validators.required],
            secName: [section.name, Validators.required],
            status: [section.is_active]
          });
          this.sectionsFormArray.push(sectionGroup);
        });

        const created = this.departmentData?.created_at;
        const updated = this.departmentData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }

        // console.log(this.departmentData);
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }


  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  deptStep2: FormGroup;


  deptStep1: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required]),
    objectives: new FormControl('', [Validators.required]),
  });

  currentStep = 1;
  selectAll: boolean = false;

  goNext() {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  goPrev() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }


  sections: any[] = [];


  get sectionsFormArray(): FormArray {
    return this.deptStep2.get('sections') as FormArray;
  }

  createSectionGroup(): FormGroup {
    return this.fb.group({
      secCode: ['', Validators.required],
      secName: ['', Validators.required],
      status: [true]
    });
  }
  // toggle activate and deactivate
  toggleSectionStatus(index: number) {
    const sectionGroup = this.sectionsFormArray.at(index) as FormGroup;
    const currentStatus = sectionGroup.get('status')?.value;
    sectionGroup.get('status')?.setValue(!currentStatus);
    this.deptStep2.markAsDirty();
  }


  // add section row
  addSection() {
    this.sectionsFormArray.push(this.createSectionGroup());
    this.deptStep2.markAsDirty();
  }
  // remove section row
  removeSection(index: number) {
    this.sectionsFormArray.removeAt(index);
    this.deptStep2.markAsDirty();
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
    const code = group.get('secCode')?.value;
    const name = group.get('secName')?.value;
    const status = group.get('status')?.value;

    const matchedOriginal = originalSections.find((s: any) =>
      s.code === code && s.name === name
    );

    const id = matchedOriginal?.id || 0;

    let record_type = 'create';
    if (matchedOriginal) {
      const changed = code !== matchedOriginal.code ||
                      name !== matchedOriginal.name ||
                      status !== matchedOriginal.is_active;
      record_type = changed ? 'update' : 'nothing';
    }

    return {
      id,
      index: index + 1,
      code,
      name,
      status: status.toString(),
      record_type
    };
  });

  const deletedSections = originalSections
    .filter((original: any) => {
      return !currentSections.some((current: any) => current.id === original.id);
    })
    .map((section: any, index: number) => {
      return {
        id: section.id,
        index: currentSections.length + index + 1,
        code: section.code,
        name: section.name,
        status: section.is_active.toString(),
        record_type: 'delete'
      };
    });

  const allSections = [
    ...currentSections,
    ...deletedSections
  ];

  const finalData = {
    request_data: {
      id: this.departmentData.id,
      code: form1Data.code,
      name: form1Data.name,
      objectives: form1Data.objectives,
      sections: allSections
    }
  };

  console.log(finalData);

  this.isLoading = true;
  this._DepartmentsService.updateDepartment(finalData).subscribe({
    next: (response) => {
      this.isLoading = false;
      this.errMsg = '';
      this.router.navigate(['/departments/all-departments'], { queryParams: { page: this.currentPage } });
      this.toasterMessageService.sendMessage("Department Updated successfully");
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


}
