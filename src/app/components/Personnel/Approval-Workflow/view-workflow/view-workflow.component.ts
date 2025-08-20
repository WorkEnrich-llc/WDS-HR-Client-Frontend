import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { WorkflowService } from '../../../../core/services/personnel/workflows/workflow.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-view-workflow',
  imports: [PageHeaderComponent, RouterLink, PopupComponent],
  providers: [DatePipe],
  templateUrl: './view-workflow.component.html',
  styleUrl: './view-workflow.component.css'
})
export class ViewWorkflowComponent {



 constructor(private _WorkflowService: WorkflowService, private route: ActivatedRoute, private datePipe: DatePipe) { }
  workflowData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  workId: string | null = null;
ngOnInit(): void {
    this.workId = this.route.snapshot.paramMap.get('id');
    if (this.workId) {
      this.getWorkflow(Number(this.workId));
    }
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

      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }
  // activate and deactivate

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

    this._WorkflowService.updateWorkflowStatus(this.workflowData.id, deptStatus).subscribe({
      next: (response) => {
        this.workflowData = response.data.object_info;
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

    this._WorkflowService.updateWorkflowStatus(this.workflowData.id, deptStatus).subscribe({
      next: (response) => {
        this.workflowData = response.data.object_info;
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }
}
