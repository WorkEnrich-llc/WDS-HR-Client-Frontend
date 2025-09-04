# Edit Employee Component - New Implementation

This is a redesigned edit employee component that follows the same multi-step approach as the create employee component.

## Features

### Multi-Step Interface
The component is divided into 4 main steps:

1. **Main Information** (Editable)
   - Employee ID (Optional)
   - Full Name
   - Gender
   - Date of Birth
   - Marital Status
   - Phone Number (with country selection)
   - Personal Email
   - Address

2. **Job Details** (Read-only)
   - Years of Experience
   - Branch
   - Department
   - Section
   - Job Title

3. **Attendance Details** (Read-only)
   - Employment Type
   - Work Mode
   - Days on Site
   - Work Schedule
   - Attendance Rules activation

4. **Contract Details** (Partially editable)
   - Join Date (Read-only)
   - Notice Period (Read-only)
   - Current/Min/Max Salary (Read-only)
   - Insurance Salary (Editable)

## Architecture

### Components Structure
```
edit-employee/
├── edit-employee.component.ts (Main component)
├── edit-employee.component.html (Main template)
├── services/
│   └── edit-employee-shared.service.ts (Shared service)
├── edit-stepper-navigation/
│   └── Navigation component for tabs
├── edit-main-information-step/
│   └── Step 1 component (editable fields)
├── edit-job-details-step/
│   └── Step 2 component (read-only)
├── edit-attendance-details-step/
│   └── Step 3 component (read-only)
└── edit-contract-details-step/
    └── Step 4 component (insurance salary editable)
```

### Service Features
- **Signal-based state management**
- **Reactive forms with validation**
- **Step navigation logic**
- **Employee data loading and form population**
- **Form data transformation for API submission**

### Key Differences from Create Employee
1. Most fields are read-only except main information and insurance salary
2. Uses existing employee data to populate form
3. Form validation is less strict for read-only fields
4. Different API payload structure for updates

## Usage

The component automatically loads employee data based on the route parameter ID and populates the form. Users can:

- Edit main information fields
- Navigate between steps using the tab interface
- Edit insurance salary in the contract details step
- Save changes or discard them

## Integration

This component integrates with:
- `EmployeeService` for API calls
- `ToasterMessageService` for success/error messages
- `EditEmployeeSharedService` for state management
- Router for navigation

## Notes

- Gender field is optional in edit mode since it's not provided by the current API response
- Years of experience is not available in the current Employee interface
- Insurance salary is the main editable field in contract details
- Phone number validation follows Egyptian mobile number patterns
