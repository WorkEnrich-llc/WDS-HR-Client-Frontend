# Dynamic Fields Management System

## Overview
The Required Details component has been transformed into a dynamic field management system that allows recruiters to customize application forms with flexible field requirements.

## Features

### 1. **Dynamic Field Management**
- Add custom fields to any subcategory
- Remove custom fields (system fields are protected)
- Enable/disable individual fields
- Mark fields as required or optional

### 2. **Field Types**
Supported field types:
- `text` - Text input
- `email` - Email input
- `phone` - Phone number input
- `number` - Numeric input

### 3. **System vs Custom Fields**
- **System Fields**: Pre-defined fields (Name, Email, Phone Number, Gender, Age, etc.)
  - Cannot be deleted
  - Some are always enabled (Name, Email, Phone Number)
- **Custom Fields**: User-created fields
  - Can be deleted
  - Marked with "Custom" badge
  - Fully configurable

### 4. **Category Structure**

#### Personal Details
- **Basic Info**: Name, Email, Phone Number, Gender, Age
- **Education Details**: University Name, College Name, Department, Major, Graduation Year
- **Address Information**: Country, City, State/Province

#### Professional Details
- **Current Job Information**: Current Company, Current Job Title, Job Level, Years of Experience
- **Salary Information**: Current Salary, Expected Salary

## User Interface

### Field Card
Each field is displayed as a card with:
- **Enable Toggle** (left): Turn field on/off in the application form
- **Field Name**: The name of the field
- **Custom Badge**: Shown for custom fields
- **Delete Button**: Remove custom fields (appears on hover)
- **Field Type**: Display the input type
- **Required Toggle** (bottom right): Mark field as mandatory

### Visual States
- **Enabled**: White background, colored border on hover
- **Disabled**: Gray background, reduced opacity
- **Required**: Red toggle switch when active
- **Enabled**: Green toggle switch when active

### Add Field Modal
Click "Add Field" button to open modal with:
- Field Name input (required)
- Field Type dropdown
- Add/Cancel actions

## API Integration

### Request Format
```json
{
  "recruiter_dynamic_fields": [
    {
      "category": "Personal Details",
      "sub_categories": [
        {
          "category": "Basic Info",
          "fields": [
            {
              "name": "Name",
              "type": "text",
              "system": true,
              "value": null,
              "required": false
            }
          ]
        }
      ]
    }
  ]
}
```

### Response Format
Same structure as request. The component automatically loads existing configuration when editing a job opening.

## Usage Guide

### For Recruiters

#### Adding a Custom Field
1. Navigate to the desired subcategory
2. Click "Add Field" button
3. Enter field name
4. Select field type
5. Click "Add Field" to confirm

#### Enabling/Disabling Fields
- Click the toggle switch on the left of any field card
- System fields (Name, Email, Phone Number) cannot be disabled

#### Making Fields Required
1. Ensure the field is enabled first
2. Click the "Required" toggle at the bottom right of the field card
3. Red toggle indicates the field is mandatory

#### Removing Custom Fields
1. Hover over the custom field card
2. Click the delete (trash) icon that appears
3. Field is immediately removed

#### Collapsing Sections
- Click the chevron icon next to category/subcategory headers
- Useful for focusing on specific sections

### For Developers

#### Component Structure
```
required-details/
├── required-details.component.ts    # Logic and state management
├── required-details.component.html  # Template with dynamic rendering
└── required-details.component.css   # Styles for field cards and UI
```

#### Key Methods
- `initializeDefaultCategories()`: Sets up default field structure
- `loadExistingData()`: Loads configuration from API
- `updateDynamicFields()`: Syncs changes to JobCreationDataService
- `addCustomField()`: Creates new custom field
- `removeCustomField()`: Deletes custom field
- `toggleFieldEnabled()`: Enable/disable field
- `toggleFieldRequired()`: Mark field as required/optional

#### Interfaces
```typescript
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
```

## Design System Compliance

### Colors
- Primary: `var(--color-primary)` - Blue for actions and focus states
- Success: `var(--color-success)` - Green for enabled state
- Danger: `#FF6B6B` - Red for required fields and delete actions
- Secondary: `var(--color-secondary-*)` - Gray scale for text and borders

### Spacing
- Card padding: 14px
- Grid gap: 16px
- Section margins: 20px (mobile: 16px)

### Responsiveness
- Desktop: Multi-column grid (280px min column width)
- Tablet: Adjusts to screen width
- Mobile: Single column layout

### Interactions
- Hover effects on cards and buttons
- Smooth transitions (0.2s ease)
- Delete button reveals on hover
- Box shadow on card hover

## Best Practices

1. **Field Naming**: Use clear, descriptive names for custom fields
2. **Required Fields**: Only mark truly mandatory fields as required
3. **Field Types**: Choose appropriate input types for data validation
4. **Organization**: Use subcategories to group related fields
5. **Testing**: Always test the form with enabled fields before publishing

## Troubleshooting

### Field not appearing in form
- Check if the field is enabled (toggle is on)
- Verify the parent category/subcategory is not collapsed

### Cannot delete field
- System fields cannot be deleted
- Only custom fields have delete buttons

### Required toggle disabled
- Field must be enabled first before marking as required

### Changes not saving
- Changes are automatically saved to JobCreationDataService
- Verify you click "Next" to proceed with the saved configuration

## Future Enhancements

Potential improvements:
- Drag-and-drop field reordering
- Field validation rules (min/max length, patterns)
- Conditional field visibility
- Field groups/sections
- Import/export field templates
- More field types (date, file, dropdown, etc.)
