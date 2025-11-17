import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { WorkflowService } from '../../../../core/services/personnel/workflows/workflow.service';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';

@Component({
  selector: 'app-create-workflow',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './create-workflow.component.html',
  styleUrl: './create-workflow.component.css'
})
export class CreateWorkflowComponent {
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  mandatoryError: string = '';

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService,
    private fb: FormBuilder,
    private _LeaveTypeService: LeaveTypeService,
    private _DepartmentsService: DepartmentsService,
    private _JobsService: JobsService,
    private _WorkflowService: WorkflowService,
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }

  ngOnInit(): void {
    this.updateLeaveControlState(this.workflow1.get('workflow_type')?.value);

    this.workflow1.get('workflow_type')?.valueChanges.subscribe(value => {
      this.updateLeaveControlState(value);
    });

    this.getAllLeaveTypes();
    this.getAllDepartments();
    this.getAllJobTitles();

  }
  private updateLeaveControlState(workflowType: string | null | undefined) {
    const leaveControl = this.workflow1.get('leave_id');
    if (workflowType === 'leave') {
      leaveControl?.enable({ emitEvent: false });
    } else {
      leaveControl?.disable({ emitEvent: false });
    }
  }

  loadExisting(workflowData: any) {
    this.workflow1.patchValue({
      code: workflowData.code,
      name: workflowData.name,
      workflow_type: workflowData.workflow_type,
      leave_id: workflowData.leave_id,
      department_id: workflowData.department_id,
    });
    this.updateLeaveControlState(this.workflow1.get('workflow_type')?.value);
  }
  // steps
  showErrors = false;
  steps: { form: FormGroup, name: string }[] = [];
  selectedStepIndex: number = 0;

  workflow1: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    workflow_type: new FormControl('', [Validators.required]),
    leave_id: new FormControl({ value: '', disabled: true }, [Validators.required]),
    department_id: new FormControl('', [Validators.required]),
  });


  leaveTypes: any[] = [];
  departments: any[] = [];
  jobTitles: any[] = [];
  loadData: boolean = true;

getAllLeaveTypes(
  searchTerm: string = '',
  filters?: {
    employment_type?: string;
  }
) {
  this._LeaveTypeService.getAllLeavetypes(1, 10000, {
    search: searchTerm || undefined,
    ...filters
  }).subscribe({
    next: (response) => {
      this.leaveTypes = response.data.list_items.filter((item: { is_active: boolean; }) => item.is_active === true);
    },
    error: (err) => {
      console.log(err.error?.details);
      this.loadData = false;
    }
  });
}

  getAllDepartments(
    searchTerm: string = '',
    filters?: {
      employment_type?: string;
    }
  ) {
    this._DepartmentsService.getAllDepartment(1, 10000, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.departments = response.data.list_items;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }


  getAllJobTitles(
    searchTerm: string = '',
    filters?: {
      employment_type?: string;
    }
  ) {
    this._JobsService.getAllJobTitles(1, 10000, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.jobTitles = response.data.list_items;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }

  createStepForm(): FormGroup {
    return this.fb.group({
      stepName: ['', [Validators.required, this.noWhitespaceValidator]],
      mandatory: [false],
      assignee: ['', Validators.required],
    });
  }

  noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { whitespace: true };
  }

  addStep() {
    const lastStep = this.steps[this.steps.length - 1];

    if (lastStep && !lastStep.form.valid) {
      this.showErrors = true;

      Object.values(lastStep.form.controls).forEach(control => {
        control.markAsTouched();
        control.markAsDirty();
        control.updateValueAndValidity();
      });

      return;
    }

    this.showErrors = false;

    const newStepForm = this.createStepForm();
    this.steps.push({ form: newStepForm, name: '' });
    this.selectedStepIndex = this.steps.length - 1;
  }


  removeStep(index: number) {
    this.steps.splice(index, 1);
    if (this.selectedStepIndex >= this.steps.length) {
      this.selectedStepIndex = this.steps.length - 1;
    }
  }


  // steps valid
  areAllStepsValid(): boolean {
    return this.steps.every(step => step.form.valid);
  }



  // create workflow
  createWorkflow() {
    this.isLoading = true;
    this.mandatoryError = '';

    const hasMandatoryStep = this.steps.some(step => step.form.value.mandatory);

    if (!hasMandatoryStep) {
      this.mandatoryError = 'At least one step must be marked as Mandatory.';
      this.isLoading = false;
      return;
    }
    const request_data: any = {
      request_data: {
        code: this.workflow1.value.code,
        name: this.workflow1.value.name,
        workflow_type: this.workflow1.value.workflow_type,
        department_id: Number(this.workflow1.value.department_id),
        steps: this.steps.map((step, index) => ({
          index: index + 1,
          id: index,
          record_type: "add",
          name: step.form.value.stepName,
          mandatory: step.form.value.mandatory,
          assignee_id: Number(step.form.value.assignee)
        }))
      }
    };

    if (this.workflow1.value.workflow_type === 'leave') {
      request_data.request_data.leave_id = Number(this.workflow1.value.leave_id);
    }

    this._WorkflowService.createWorkFlow(request_data).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/workflow/all-workflows']);
        // this.toasterMessageService.sendMessage("Workflow created successfully");
      },
      error: (err) => {
        this.isLoading = false;
        const statusCode = err?.status;
        const errorHandling = err?.error?.data?.error_handling;
        if (statusCode === 400) {
          if (Array.isArray(errorHandling) && errorHandling.length > 0) {
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
    this.router.navigate(['/workflow/all-workflows']);
  }
}
