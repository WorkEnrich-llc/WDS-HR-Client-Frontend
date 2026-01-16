import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assignment-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assignment-overview.component.html',
  styleUrl: './assignment-overview.component.css'
})
export class AssignmentOverviewComponent {
  @Input() assignmentData: any = null;
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string | null = null;
  @Input() isStartingAssignment: boolean = false;
  @Output() proceedToAssignment = new EventEmitter<void>();

  /**
   * Get assignment title
   */
  getAssignmentTitle(): string {
    return this.assignmentData?.assignment?.name || 
           this.assignmentData?.job?.job_title || 
           'Assignment';
  }

  /**
   * Get assignment category/tags - using job department
   */
  getCategory(): string {
    return this.assignmentData?.job?.department || 
           'General';
  }

  /**
   * Check if assignment is new - based on expiration date
   */
  isNew(): boolean {
    if (!this.assignmentData?.assignment?.expiration_date) return false;
    const expirationDate = new Date(this.assignmentData.assignment.expiration_date);
    const now = new Date();
    const daysDifference = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference <= 7 && daysDifference > 0;
  }

  /**
   * Get employment type
   */
  getEmploymentType(): string {
    return this.assignmentData?.job?.employment_type || 
           'Full-Time';
  }

  /**
   * Get work schedule
   */
  getWorkSchedule(): string {
    return this.assignmentData?.job?.work_mode || 
           'On Site';
  }

  /**
   * Get location
   */
  getLocation(): string {
    if (this.assignmentData?.job?.branch) {
      return typeof this.assignmentData.job.branch === 'string' 
        ? this.assignmentData.job.branch 
        : this.assignmentData.job.branch?.name || '';
    }
    return 'Location not specified';
  }

  /**
   * Get experience requirement - not in API response, returning default
   */
  getExperience(): string {
    return 'Experience Required';
  }

  /**
   * Get assignment duration
   */
  getDuration(): string {
    const duration = this.assignmentData?.assignment?.duration_minutes;
    
    if (typeof duration === 'number') {
      return `${duration} ${duration === 1 ? 'min' : 'mins'}`;
    }
    return 'Duration not specified';
  }

  /**
   * Get number of questions
   */
  getQuestionCount(): number {
    return this.assignmentData?.assignment?.questions_details?.total || 0;
  }

  /**
   * Get instruction text
   */
  getInstructionText(): string {
    return this.assignmentData?.assignment?.instructions ||
           "Please note that once you start your assignment, you'll have one chance to complete it.";
  }

  /**
   * Get warning text
   */
  getWarningText(): string {
    return "Make sure you are ready for the assignment!";
  }

  /**
   * Handle proceed button click
   */
  onProceedClick(): void {
    this.proceedToAssignment.emit();
  }
}
