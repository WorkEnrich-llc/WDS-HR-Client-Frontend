import { Component, inject, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobCreationDataService } from '../../../../../core/services/recruitment/job-openings/job-creation-data.service';
import { CommonModule } from '@angular/common';

interface DynamicField {
  name: string;
  type: string;
  system: boolean;
  value: any;
  required: boolean;
  enabled: boolean;
}

interface SubCategory {
  name: string;
  fields: DynamicField[];
  collapsed: boolean;
}

interface MainCategory {
  name: string;
  subCategories: SubCategory[];
  collapsed: boolean;
}

@Component({
  selector: 'app-required-details',
  imports: [FormsModule, CommonModule],
  templateUrl: './required-details.component.html',
  styleUrl: './required-details.component.css'
})
export class RequiredDetailsComponent implements OnInit {
  private jobCreationDataService = inject(JobCreationDataService);

  @Input() isUpdateMode = false;
  @Input() jobId: number | null = null;

  @Output() prevTab = new EventEmitter<void>();
  @Output() nextTab = new EventEmitter<void>();

  categories: MainCategory[] = [];

  // Add field modal state
  showAddFieldModal = false;
  currentCategoryIndex = -1;
  currentSubCategoryIndex = -1;
  currentCategoryName = '';
  newFieldName = '';
  newFieldType = 'text';
  fieldTypes = ['text', 'email', 'phone', 'number'];

  ngOnInit(): void {
    // Initialize default structure
    this.initializeDefaultCategories();

    // Subscribe to service data to pre-fill form (for update mode)
    this.jobCreationDataService.jobData$.subscribe(data => {
      if (data.recruiter_dynamic_fields) {
        this.loadExistingData(data.recruiter_dynamic_fields);
      }
    });

    // Update service with initial data
    this.updateDynamicFields();
  }

  initializeDefaultCategories(): void {
    this.categories = [
      {
        name: 'Personal Details',
        collapsed: false,
        subCategories: [
          {
            name: 'Basic Info',
            collapsed: false,
            fields: [
              { name: 'Name', type: 'text', system: true, value: null, required: true, enabled: true },
              { name: 'Email', type: 'email', system: true, value: null, required: true, enabled: true },
              { name: 'Phone Number', type: 'phone', system: true, value: null, required: true, enabled: true },
              { name: 'Gender', type: 'number', system: true, value: null, required: false, enabled: false },
              { name: 'Age', type: 'number', system: true, value: null, required: false, enabled: false }
            ]
          },
          {
            name: 'Education Details',
            collapsed: false,
            fields: [
              { name: 'University Name', type: 'text', system: true, value: null, required: false, enabled: false },
              { name: 'College Name', type: 'text', system: true, value: null, required: false, enabled: false },
              { name: 'Department', type: 'text', system: true, value: null, required: false, enabled: false },
              { name: 'Major', type: 'text', system: true, value: null, required: false, enabled: false },
              { name: 'Graduation Year', type: 'number', system: true, value: null, required: false, enabled: false }
            ]
          },
          {
            name: 'Address Information',
            collapsed: false,
            fields: [
              { name: 'Country', type: 'text', system: true, value: null, required: false, enabled: false },
              { name: 'City', type: 'text', system: true, value: null, required: false, enabled: false },
              { name: 'State/Province', type: 'text', system: true, value: null, required: false, enabled: false }
            ]
          }
        ]
      },
      {
        name: 'Professional Details',
        collapsed: false,
        subCategories: [
          {
            name: 'Current Job Information',
            collapsed: false,
            fields: [
              { name: 'Current Company', type: 'text', system: true, value: null, required: false, enabled: false },
              { name: 'Current Job Title', type: 'text', system: true, value: null, required: false, enabled: false },
              { name: 'Job Level', type: 'text', system: true, value: null, required: false, enabled: false },
              { name: 'Years of Experience', type: 'number', system: true, value: null, required: false, enabled: false }
            ]
          },
          {
            name: 'Salary Information',
            collapsed: false,
            fields: [
              { name: 'Current Salary', type: 'number', system: true, value: null, required: false, enabled: false },
              { name: 'Expected Salary', type: 'number', system: true, value: null, required: false, enabled: false }
            ]
          }
        ]
      }
    ];
  }

  loadExistingData(dynamicFields: any): void {
    // Loop through the categories and match with existing data
    Object.keys(dynamicFields).forEach(categoryName => {
      const categoryData = dynamicFields[categoryName];
      const category = this.categories.find(c => c.name === categoryName);
      
      if (category) {
        Object.keys(categoryData).forEach(subCategoryName => {
          const subCategoryData = categoryData[subCategoryName];
          const subCategory = category.subCategories.find(sc => sc.name === subCategoryName);
          
          if (subCategory && Array.isArray(subCategoryData)) {
            // Update existing fields
            subCategoryData.forEach((fieldData: any) => {
              const existingField = subCategory.fields.find(f => f.name === fieldData.name);
              if (existingField) {
                existingField.enabled = true;
                existingField.required = fieldData.required || false;
                existingField.value = fieldData.value;
              } else {
                // Add custom field that doesn't exist in defaults
                subCategory.fields.push({
                  name: fieldData.name,
                  type: fieldData.type || 'text',
                  system: false,
                  value: fieldData.value,
                  required: fieldData.required || false,
                  enabled: true
                });
              }
            });
          }
        });
      }
    });
  }

  toggleCategory(categoryIndex: number): void {
    this.categories[categoryIndex].collapsed = !this.categories[categoryIndex].collapsed;
  }

  toggleSubCategory(categoryIndex: number, subCategoryIndex: number): void {
    this.categories[categoryIndex].subCategories[subCategoryIndex].collapsed = 
      !this.categories[categoryIndex].subCategories[subCategoryIndex].collapsed;
  }

  getEnabledFieldsCount(fields: DynamicField[]): number {
    return fields.filter(f => f.enabled).length;
  }

  toggleFieldEnabled(field: DynamicField): void {
    this.updateDynamicFields();
  }

  toggleFieldRequired(field: DynamicField): void {
    this.updateDynamicFields();
  }

  openAddFieldModal(categoryIndex: number, subCategoryIndex: number): void {
    this.currentCategoryIndex = categoryIndex;
    this.currentSubCategoryIndex = subCategoryIndex;
    this.currentCategoryName = this.categories[categoryIndex].name;
    this.newFieldName = '';
    this.newFieldType = 'text';
    this.showAddFieldModal = true;
  }

  closeAddFieldModal(): void {
    this.showAddFieldModal = false;
    this.currentCategoryIndex = -1;
    this.currentSubCategoryIndex = -1;
  }

  addCustomField(): void {
    if (this.newFieldName.trim() && this.currentCategoryIndex >= 0 && this.currentSubCategoryIndex >= 0) {
      const subCategory = this.categories[this.currentCategoryIndex].subCategories[this.currentSubCategoryIndex];
      
      // Check if field name already exists
      const exists = subCategory.fields.some(f => f.name.toLowerCase() === this.newFieldName.trim().toLowerCase());
      if (!exists) {
        subCategory.fields.push({
          name: this.newFieldName.trim(),
          type: this.newFieldType,
          system: false,
          value: null,
          required: false,
          enabled: true
        });
        
        this.updateDynamicFields();
      }
    }
    
    this.closeAddFieldModal();
  }

  removeCustomField(categoryIndex: number, subCategoryIndex: number, fieldIndex: number): void {
    const field = this.categories[categoryIndex].subCategories[subCategoryIndex].fields[fieldIndex];
    if (!field.system) {
      this.categories[categoryIndex].subCategories[subCategoryIndex].fields.splice(fieldIndex, 1);
      this.updateDynamicFields();
    }
  }

  updateDynamicFields(): void {
    const dynamicFields: any = {};

    this.categories.forEach(category => {
      dynamicFields[category.name] = {};
      
      category.subCategories.forEach(subCategory => {
        const enabledFields = subCategory.fields
          .filter(f => f.enabled)
          .map(f => ({
            name: f.name,
            type: f.type,
            system: f.system,
            value: f.value,
            required: f.required
          }));
        
        if (enabledFields.length > 0) {
          dynamicFields[category.name][subCategory.name] = enabledFields;
        }
      });
    });

    // Update the service
    this.jobCreationDataService.updateDynamicFields(dynamicFields);
  }

  loadExistingSelections(dynamicFields: any): void {
    // This method is kept for backward compatibility but actual loading is done in loadExistingData
  }

  /**
   * Navigate to previous step
   */
  goToPrevStep(): void {
    this.prevTab.emit();
  }

  /**
   * Navigate to next step (no validation needed for this tab as it's all checkboxes)
   */
  goToNextStep(): void {
    this.nextTab.emit();
  }
}
