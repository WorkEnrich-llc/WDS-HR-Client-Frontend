
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JobOpeningsService } from '../../../../../core/services/recruitment/job-openings/job-openings.service';
import { JobCreationDataService } from '../../../../../core/services/recruitment/job-openings/job-creation-data.service';

@Component({
  selector: 'app-attachments',
  imports: [RouterLink, FormsModule],
  templateUrl: './attachments.component.html',
  styleUrls: ['./../../../../shared/table/table.component.css', './attachments.component.css']
})
export class AttachmentsComponent {
  private jobOpeningsService = inject(JobOpeningsService);
  private jobCreationDataService = inject(JobCreationDataService);

  links = [{ value: null }];
  Documents = [{ value: null }];

  addLink() {
    this.links.push({ value: null });
  }

  removeLink(index: number) {
    if (this.links.length > 1) {
      this.links.splice(index, 1);
    }
  }
  addDocument() {
    this.Documents.push({ value: null });
  }

  removeDocument(index: number) {
    if (this.Documents.length > 1) {
      this.Documents.splice(index, 1);
    }
  }

  createJobOpening(): void {
    // Get the actual form data from the shared service
    const currentData = this.jobCreationDataService.getCurrentData();

    // Validate that required fields are filled
    if (!currentData.main_information.job_title_id || !currentData.main_information.branch_id || !currentData.main_information.employment_type) {
      alert('Please fill in all required fields in the previous tabs');
      return;
    }

    // Build the recruiter_dynamic_fields by merging existing fields with Attachments
    const recruiterDynamicFields: any = {};

    // Add Personal Details and Professional Details from required-details tab (if they exist)
    if (currentData.recruiter_dynamic_fields) {
      if (currentData.recruiter_dynamic_fields['Personal Details']) {
        recruiterDynamicFields['Personal Details'] = currentData.recruiter_dynamic_fields['Personal Details'];
      }
      if (currentData.recruiter_dynamic_fields['Professional Details']) {
        recruiterDynamicFields['Professional Details'] = currentData.recruiter_dynamic_fields['Professional Details'];
      }
    }

    // Add Attachments section
    recruiterDynamicFields['Attachments'] = {
      "links": this.links.map(link => ({
        "name": "Portfolio",
        "type": "text",
        "system": true,
        "value": link.value,
        "required": true
      })),
      "files": this.Documents.map(doc => ({
        "name": "CV",
        "type": "text",
        "system": true,
        "value": doc.value,
        "required": true
      }))
    };

    const jobData = {
      request_data: {
        main_information: currentData.main_information,
        recruiter_dynamic_fields: recruiterDynamicFields
      }
    };

    console.log('Job opening payload:', JSON.stringify(jobData, null, 2));

    this.jobOpeningsService.createJobOpening(jobData).subscribe({
      next: (response) => {
        alert('Job opening created successfully!');
        // You can redirect to job openings list here
      },
      error: (error) => {
        alert('Error creating job opening: ' + (error.error?.details || error.message));
      }
    });
  }

}
