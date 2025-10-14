import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobCreationDataService } from '../../../../../core/services/recruitment/job-openings/job-creation-data.service';

@Component({
  selector: 'app-required-details',
  imports: [RouterLink, FormsModule],
  templateUrl: './required-details.component.html',
  styleUrl: './required-details.component.css'
})
export class RequiredDetailsComponent implements OnInit {
  private jobCreationDataService = inject(JobCreationDataService);

  // Personal Details - Basic Info
  basicInfo = {
    name: false,
    email: false,
    phone: false,
    gender: false,
    age: false
  };

  // Personal Details - Education Details
  educationDetails = {
    university: false,
    college: false,
    department: false,
    major: false,
    graduation: false
  };

  // Personal Details - Address Information
  addressInfo = {
    country: false,
    city: false,
    state: false
  };

  // Professional Details - Current Job Information
  currentJobInfo = {
    currentCompany: false,
    currentJobTitle: false,
    jobLevel: false,
    yearsOfExperience: false
  };

  // Professional Details - Salary Information
  salaryInfo = {
    currentSalary: false,
    expectedSalary: false
  };

  ngOnInit(): void {
    // Load existing data if any
    const currentData = this.jobCreationDataService.getCurrentData();
    if (currentData.recruiter_dynamic_fields) {
      this.loadExistingSelections(currentData.recruiter_dynamic_fields);
    }
  }

  loadExistingSelections(dynamicFields: any): void {
    // Load Personal Details - Basic Info
    if (dynamicFields['Personal Details']?.['Basic Info']) {
      const basicInfo = dynamicFields['Personal Details']['Basic Info'];
      basicInfo.forEach((field: any) => {
        if (field.name === 'Name') this.basicInfo.name = true;
        if (field.name === 'Email') this.basicInfo.email = true;
        if (field.name === 'Phone Number') this.basicInfo.phone = true;
        if (field.name === 'Gender') this.basicInfo.gender = true;
        if (field.name === 'Age') this.basicInfo.age = true;
      });
    }

    // Load Education Details
    if (dynamicFields['Personal Details']?.['Education Details']) {
      const educationDetails = dynamicFields['Personal Details']['Education Details'];
      educationDetails.forEach((field: any) => {
        if (field.name === 'University Name') this.educationDetails.university = true;
        if (field.name === 'College Name') this.educationDetails.college = true;
        if (field.name === 'Department') this.educationDetails.department = true;
        if (field.name === 'Major') this.educationDetails.major = true;
        if (field.name === 'Graduation Year') this.educationDetails.graduation = true;
      });
    }

    // Load Address Information
    if (dynamicFields['Personal Details']?.['Address Information']) {
      const addressInfo = dynamicFields['Personal Details']['Address Information'];
      addressInfo.forEach((field: any) => {
        if (field.name === 'Country') this.addressInfo.country = true;
        if (field.name === 'City') this.addressInfo.city = true;
        if (field.name === 'State/Province') this.addressInfo.state = true;
      });
    }

    // Load Current Job Information
    if (dynamicFields['Professional Details']?.['Current Job Information']) {
      const currentJobInfo = dynamicFields['Professional Details']['Current Job Information'];
      currentJobInfo.forEach((field: any) => {
        if (field.name === 'Current Company') this.currentJobInfo.currentCompany = true;
        if (field.name === 'Current Job Title') this.currentJobInfo.currentJobTitle = true;
        if (field.name === 'Job Level') this.currentJobInfo.jobLevel = true;
        if (field.name === 'Years of Experience') this.currentJobInfo.yearsOfExperience = true;
      });
    }

    // Load Salary Information
    if (dynamicFields['Professional Details']?.['Salary Information']) {
      const salaryInfo = dynamicFields['Professional Details']['Salary Information'];
      salaryInfo.forEach((field: any) => {
        if (field.name === 'Current Salary') this.salaryInfo.currentSalary = true;
        if (field.name === 'Expected Salary') this.salaryInfo.expectedSalary = true;
      });
    }
  }

  updateDynamicFields(): void {
    const dynamicFields: any = {
      'Personal Details': {},
      'Professional Details': {}
    };

    // Build Basic Info array (only selected fields)
    const basicInfoArray: any[] = [];
    if (this.basicInfo.name) basicInfoArray.push({ name: 'Name', type: 'text', system: true, value: null, required: false });
    if (this.basicInfo.email) basicInfoArray.push({ name: 'Email', type: 'email', system: true, value: null, required: false });
    if (this.basicInfo.phone) basicInfoArray.push({ name: 'Phone Number', type: 'phone', system: true, value: null, required: false });
    if (this.basicInfo.gender) basicInfoArray.push({ name: 'Gender', type: 'number', system: true, value: null, required: false });
    if (this.basicInfo.age) basicInfoArray.push({ name: 'Age', type: 'number', system: true, value: null, required: false });

    if (basicInfoArray.length > 0) {
      dynamicFields['Personal Details']['Basic Info'] = basicInfoArray;
    }

    // Build Education Details array (only selected fields)
    const educationDetailsArray: any[] = [];
    if (this.educationDetails.university) educationDetailsArray.push({ name: 'University Name', type: 'text', system: true, value: null, required: false });
    if (this.educationDetails.college) educationDetailsArray.push({ name: 'College Name', type: 'text', system: true, value: null, required: false });
    if (this.educationDetails.department) educationDetailsArray.push({ name: 'Department', type: 'text', system: true, value: null, required: false });
    if (this.educationDetails.major) educationDetailsArray.push({ name: 'Major', type: 'text', system: true, value: null, required: false });
    if (this.educationDetails.graduation) educationDetailsArray.push({ name: 'Graduation Year', type: 'number', system: true, value: null, required: false });

    if (educationDetailsArray.length > 0) {
      dynamicFields['Personal Details']['Education Details'] = educationDetailsArray;
    }

    // Build Address Information array (only selected fields)
    const addressInfoArray: any[] = [];
    if (this.addressInfo.country) addressInfoArray.push({ name: 'Country', type: 'text', system: true, value: null, required: false });
    if (this.addressInfo.city) addressInfoArray.push({ name: 'City', type: 'text', system: true, value: null, required: false });
    if (this.addressInfo.state) addressInfoArray.push({ name: 'State/Province', type: 'text', system: true, value: null, required: false });

    if (addressInfoArray.length > 0) {
      dynamicFields['Personal Details']['Address Information'] = addressInfoArray;
    }

    // Build Current Job Information array (only selected fields)
    const currentJobInfoArray: any[] = [];
    if (this.currentJobInfo.currentCompany) currentJobInfoArray.push({ name: 'Current Company', type: 'text', system: true, value: null, required: false });
    if (this.currentJobInfo.currentJobTitle) currentJobInfoArray.push({ name: 'Current Job Title', type: 'text', system: true, value: null, required: false });
    if (this.currentJobInfo.jobLevel) currentJobInfoArray.push({ name: 'Job Level', type: 'text', system: true, value: null, required: false });
    if (this.currentJobInfo.yearsOfExperience) currentJobInfoArray.push({ name: 'Years of Experience', type: 'number', system: true, value: null, required: false });

    if (currentJobInfoArray.length > 0) {
      dynamicFields['Professional Details']['Current Job Information'] = currentJobInfoArray;
    }

    // Build Salary Information array (only selected fields)
    const salaryInfoArray: any[] = [];
    if (this.salaryInfo.currentSalary) salaryInfoArray.push({ name: 'Current Salary', type: 'number', system: true, value: null, required: false });
    if (this.salaryInfo.expectedSalary) salaryInfoArray.push({ name: 'Expected Salary', type: 'number', system: true, value: null, required: false });

    if (salaryInfoArray.length > 0) {
      dynamicFields['Professional Details']['Salary Information'] = salaryInfoArray;
    }

    // Update the service
    this.jobCreationDataService.updateDynamicFields(dynamicFields);
  }
}
