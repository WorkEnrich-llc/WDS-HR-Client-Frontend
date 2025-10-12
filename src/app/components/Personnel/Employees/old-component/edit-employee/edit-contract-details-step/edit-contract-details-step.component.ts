import { Component, inject, Output, EventEmitter } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EditEmployeeSharedService } from '../services/edit-employee-shared.service';

@Component({
  standalone: true,
  selector: 'app-edit-contract-details-step',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-contract-details-step.component.html',
  styleUrls: ['./edit-contract-details-step.component.css']
})
export class EditContractDetailsStepComponent {
  @Output() submitForm = new EventEmitter<void>();
  
  public sharedService = inject(EditEmployeeSharedService);

  goPrev() {
    this.sharedService.goPrev();
  }

  onSubmit() {
    this.submitForm.emit();
  }

  getJoinDate(): string {
    const data = this.sharedService.employeeData();
    if (!data?.job_info?.start_contract) return '';
    return new Date(data.job_info.start_contract).toLocaleDateString();
  }

  getNoticePeriod(): string {
    const data = this.sharedService.employeeData();
    // Assuming notice period is in days, you might need to adjust based on API response
    return '60 days'; // placeholder since it's not in the interface
  }

  getCurrentSalary(): string {
    const data = this.sharedService.employeeData();
    if (!data?.job_info?.salary) return '';
    return `${data.job_info.salary.toLocaleString()} EGP`;
  }

  getMaxSalary(): string {
    // This would come from job title salary range, placeholder for now
    return '40,000 EGP';
  }

  getMinSalary(): string {
    // This would come from job title salary range, placeholder for now
    return '34,000 EGP';
  }
}
