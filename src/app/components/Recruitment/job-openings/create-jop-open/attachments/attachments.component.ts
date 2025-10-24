
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobOpeningsService } from '../../../../../core/services/recruitment/job-openings/job-openings.service';
import { JobCreationDataService } from '../../../../../core/services/recruitment/job-openings/job-creation-data.service';

@Component({
  selector: 'app-attachments',
  imports: [RouterLink, FormsModule],
  templateUrl: './attachments.component.html',
  styleUrls: ['./../../../../shared/table/table.component.css', './attachments.component.css']
})
export class AttachmentsComponent implements OnInit {
  private jobOpeningsService = inject(JobOpeningsService);
  private jobCreationDataService = inject(JobCreationDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  links = [{ value: null }];
  Documents = [{ value: null }];
  isUpdateMode = false;
  jobId: number | null = null;

  ngOnInit(): void {
    // Check if we're in update mode by checking the route
    this.route.parent?.params.subscribe(params => {
      if (params['id']) {
        this.isUpdateMode = true;
        this.jobId = +params['id'];
      }
    });

    // Subscribe to service data to load existing attachments (for update mode)
    this.jobCreationDataService.jobData$.subscribe(data => {
      if (data.recruiter_dynamic_fields?.['Attachments']) {
        const attachments = data.recruiter_dynamic_fields['Attachments'];

        // Load links
        if (attachments.links && attachments.links.length > 0) {
          this.links = attachments.links.map((link: any) => ({ value: link.value }));
        }

        // Load files/documents
        if (attachments.files && attachments.files.length > 0) {
          this.Documents = attachments.files.map((file: any) => ({ value: file.value }));
        }
      }
    });
  }

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

    // Call create or update based on mode
    if (this.isUpdateMode && this.jobId) {
      this.jobOpeningsService.updateJobOpening(this.jobId, jobData).subscribe({
        next: (response) => {
          alert('Job opening updated successfully!');
          this.router.navigate(['/job-openings/view-job-openings', this.jobId]);
        },
        error: (error) => {
          alert('Error updating job opening: ' + (error.error?.details || error.message));
        }
      });
    } else {
      this.jobOpeningsService.createJobOpening(jobData).subscribe({
        next: (response) => {
          alert('Job opening created successfully!');
          this.router.navigate(['/job-openings']);
        },
        error: (error) => {
          alert('Error creating job opening: ' + (error.error?.details || error.message));
        }
      });
    }
  }

}
