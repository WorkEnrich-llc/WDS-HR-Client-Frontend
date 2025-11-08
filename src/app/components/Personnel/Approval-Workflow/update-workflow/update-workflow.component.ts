import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { WorkflowService } from '../../../../core/services/personnel/workflows/workflow.service';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';

@Component({
  selector: 'app-update-workflow',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './update-workflow.component.html',
  styleUrl: './update-workflow.component.css'
})
export class UpdateWorkflowComponent {
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  workflowData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  workId: string | null = null;
  isChanges: boolean = false;
  originalSteps: any[] = [];
  mandatoryError: string = '';

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private toasterMessageService: ToasterMessageService,
    private _JobsService: JobsService,
    private _DepartmentsService: DepartmentsService,
    private _LeaveTypeService: LeaveTypeService,
    private _WorkflowService: WorkflowService,
    private fb: FormBuilder
  ) {
  }
  ngOnInit(): void {
    this.updateLeaveControlState(this.workflow1.get('workflow_type')?.value);

    this.workflow1.get('workflow_type')?.valueChanges.subscribe(value => {
      this.updateLeaveControlState(value);
      // this.isChanges = true; 
    });

    this.getAllLeaveTypes();
    this.getAllDepartments();
    this.getAllJobTitles();

    this.workId = this.route.snapshot.paramMap.get('id');
    if (this.workId) {
      this.getWorkflow(Number(this.workId));
    }

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

  getWorkflow(workId: number) {
    this._WorkflowService.showWorkflow(workId).subscribe({
      next: (response) => {
        this.workflowData = response.data.object_info;

        const created = this.workflowData?.created_at;
        const updated = this.workflowData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }
        console.log(this.workflowData);
        let workflowType: string | null = null;
        let leaveId: number | null = null;

        if (this.workflowData.permission) {
          workflowType = 'permission';
        } else if (this.workflowData.overtime) {
          workflowType = 'overtime';
        } else if (this.workflowData.mission) {
          workflowType = 'mission';
        } else if (this.workflowData.leave) {
          workflowType = 'leave';
          leaveId = this.workflowData.leave.id;
        }

        this.workflow1.patchValue({
          code: this.workflowData.code,
          name: this.workflowData.name,
          workflow_type: workflowType,
          leave_id: leaveId,
          department_id: this.workflowData.department?.id,
        });
        this.originalSteps = this.workflowData.steps.map((step: any) => ({
          id: step.id,
          name: step.name,
          mandatory: step.mandatory,
          assignee_id: step.assignee?.id
        }));

        this.steps = this.workflowData.steps.map((step: any) => {
          const stepForm = this.createStepForm();
          stepForm.patchValue({
            stepName: step.name,
            mandatory: step.mandatory,
            assignee: step.assignee.id
          });

          stepForm.valueChanges.subscribe(() => {
            this.isChanges = true;
          });

          return {
            form: stepForm,
            name: step.name,
            originalId: step.id
          };
        });

        this.workflow1.valueChanges.subscribe(() => {
          this.isChanges = true;
        });

      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }


  // steps
  showErrors = false;
  steps: { form: FormGroup, name: string, originalId?: number }[] = [];
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
        this.leaveTypes = response.data.list_items;
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
    this.isChanges = true;

  }


  removeStep(index: number) {
    this.steps.splice(index, 1);
    if (this.selectedStepIndex >= this.steps.length) {
      this.selectedStepIndex = this.steps.length - 1;
    }
    this.isChanges = true;

  }
  // steps valid
  areAllStepsValid(): boolean {
    return this.steps.every(step => step.form.valid);
  }



  // update workflow
  updateWorkflow() {
    this.isLoading = true;
    this.mandatoryError = '';

    const hasMandatoryStep = this.steps.some(step => step.form.value.mandatory);

    if (!hasMandatoryStep) {
      this.mandatoryError = 'At least one step must be marked as Mandatory.';
      this.isLoading = false;
      return;
    }
    const currentSteps = this.steps.map((step, index) => {
      const stepData = {
        index: index + 1,
        id: step.originalId ?? index,
        name: step.form.value.stepName,
        mandatory: step.form.value.mandatory,
        assignee_id: Number(step.form.value.assignee)
      };


      const original = this.originalSteps.find(os =>
        os.id === step.originalId
      );

      if (!original) {

        return { ...stepData, record_type: 'add' };
      }


      const hasChanged =
        original.name !== stepData.name ||
        original.mandatory !== stepData.mandatory ||
        original.assignee_id !== stepData.assignee_id;

      return { ...stepData, record_type: hasChanged ? 'update' : 'nothing' };
    });


    const removedSteps = this.originalSteps
      .filter(os => !this.steps.find(s => s.originalId === os.id))
      .map((step, index) => ({
        index: currentSteps.length + index + 1,
        id: step.id,
        name: step.name,
        mandatory: step.mandatory,
        assignee_id: step.assignee_id,
        record_type: 'remove'
      }));


    const request_data = {
      request_data: {
        id: this.workflowData.id,
        code: this.workflow1.value.code,
        name: this.workflow1.value.name,
        workflow_type: this.workflow1.value.workflow_type,
        leave_id: Number(this.workflow1.value.leave_id),
        department_id: Number(this.workflow1.value.department_id),
        steps: [...currentSteps, ...removedSteps]
      }
    };


    // console.log({ request_data });
    this._WorkflowService.updateWorkflow(request_data).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // update success
        this.router.navigate(['/workflow/all-workflows']);
        this.toasterMessageService.sendMessage("Workflow Updated successfully");

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
