import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-attachment-and-info',
  imports: [],
  templateUrl: './attachment-and-info.component.html',
  styleUrl: './attachment-and-info.component.css'
})
export class AttachmentAndInfoComponent {
  @Input() applicant: any;
  @Input() application: any;

  get files(): any[] {
    return this.application?.application?.application_content?.Attachments?.files ?? [];
  }

  get links(): any[] {
    return this.application?.application?.application_content?.Attachments?.links ?? [];
  }

  get basicInfo(): any[] {
    return this.application?.application?.application_content?.['Personal Details']?.['Basic Info'] ?? [];
  }

  get educationDetails(): any[] {
    return this.application?.application?.application_content?.['Personal Details']?.['Education Details'] ?? [];
  }
}
