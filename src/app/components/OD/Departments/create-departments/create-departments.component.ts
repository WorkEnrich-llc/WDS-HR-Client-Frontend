import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-create-departments',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule, ReactiveFormsModule],
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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private datePipe: DatePipe,
    private _DepartmentsService: DepartmentsService,
    private toasterMessageService: ToasterMessageService
  ) {
    this.deptStep2 = this.fb.group({
      sections: this.fb.array([])
    });

    this.addSection();


    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
    // console.log(this.todayFormatted); 
  }
  deptStep1: FormGroup = new FormGroup({
    // Optional code must include both letters and numbers when provided
    code: new FormControl('', [Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]+$')]),
    name: new FormControl('', [Validators.required]),
    department_type: new FormControl('', [Validators.required]),
    objectives: new FormControl('', [Validators.required]),
  });

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
  }


  // add section row
  addSection() {
    this.sectionsFormArray.push(this.createSectionGroup());
  }
  // remove section row
  removeSection(index: number) {
    this.sectionsFormArray.removeAt(index);
  }


  // create Department
  createDept() {
    if (this.deptStep1.invalid || this.deptStep2.invalid || this.sectionsFormArray.length === 0) {
      this.errMsg = 'Please complete both steps with valid data and at least one section.';
      return;
    }

    const form1Data = this.deptStep1.value;
    const sections = this.sectionsFormArray.controls.map((group, index) => {
      return {
        id: 0,
        index: index + 1,
        record_type: 'create',
        code: group.get('secCode')?.value,
        name: group.get('secName')?.value,
        status: group.get('status')?.value.toString()
      };
    });

   const finalData = {
  request_data: {
    code: form1Data.code,
    name: form1Data.name,
    department_type: Number(form1Data.department_type), 
    objectives: form1Data.objectives,
    sections: sections
  }
};


    console.log(finalData);
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
