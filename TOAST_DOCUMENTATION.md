# Toast Notification System Documentation

## Overview
This application uses a custom toast notification system built on top of `ngx-toastr` with beautiful custom styling and automatic API response handling.

## Features
- ✅ Beautiful gradient-based toast designs
- ✅ Automatic API response handling via interceptor
- ✅ Custom positioning and animations
- ✅ Different toast types (Success, Error, Warning, Info)
- ✅ Manual toast control for specific cases
- ✅ Helper utilities for common scenarios

## Installation & Setup

The toast system is already configured in your application. Here's what's included:

### 1. Dependencies
- `ngx-toastr`: ^19.0.0 (already installed)

### 2. Configuration
- Main configuration in `main.ts`
- Custom styling in `styles.css`
- Interceptor for automatic API response handling

## Usage

### 1. Automatic API Response Toasts (Recommended)

The `toastInterceptor` automatically shows toasts for all API calls:

```typescript
// Success toasts (2xx responses) - automatically shown
// Error toasts (4xx, 5xx responses) - automatically shown
// GET requests are excluded from automatic success toasts
```

### 2. Manual Toast Control

Import and inject the `ToasterMessageService`:

```typescript
import { ToasterMessageService } from '../../../core/services/tostermessage/tostermessage.service';

constructor(private toasterService: ToasterMessageService) {}

// Success toast
this.toasterService.showSuccess('Operation completed successfully', 'Success');

// Error toast
this.toasterService.showError('Something went wrong', 'Error');

// Warning toast
this.toasterService.showWarning('Please check your input', 'Warning');

// Info toast
this.toasterService.showInfo('Processing your request...', 'Info');
```

### 3. Using the Helper Utility

For consistent error handling across components:

```typescript
import { ApiToastHelper } from '../../../core/helpers/api-toast.helper';

// Handle API response
ApiToastHelper.handleApiResponse(response, this.toasterService, 'Custom success message');

// Handle API error
ApiToastHelper.handleApiError(error, this.toasterService, 'Custom error message');

// Show validation error
ApiToastHelper.showValidationError(this.toasterService, 'Please fill all required fields');

// Show loading toast
ApiToastHelper.showLoadingToast(this.toasterService, 'Saving data...');
```

### 4. Example Implementation

```typescript
createEmployee(): void {
  // Validation check
  if (this.employeeForm.invalid) {
    ApiToastHelper.showValidationError(this.toasterService);
    return;
  }

  this.isLoading = true;
  
  this.employeeService.create(this.employeeForm.value).subscribe({
    next: (response) => {
      this.isLoading = false;
      // Success toast is automatically shown by interceptor
      this.router.navigate(['/employees']);
    },
    error: (error) => {
      this.isLoading = false;
      // Error toast is automatically shown by interceptor
      // But you can add custom logic here if needed
    }
  });
}
```

## Toast Types & Styling

### Success Toast
- **Color**: Green gradient (#10b981 to #059669)
- **Use case**: Successful operations, confirmations
- **Auto-duration**: 3 seconds

### Error Toast
- **Color**: Red gradient (#ef4444 to #dc2626)
- **Use case**: Errors, failures, validation issues
- **Auto-duration**: 5 seconds

### Warning Toast
- **Color**: Orange gradient (#f59e0b to #d97706)
- **Use case**: Warnings, cautions, non-critical issues
- **Auto-duration**: 4 seconds

### Info Toast
- **Color**: Blue gradient (#3b82f6 to #2563eb)
- **Use case**: Information, loading states, notifications
- **Auto-duration**: 3 seconds

## Configuration Options

### Global Toast Configuration (main.ts)
```typescript
provideToastr({
  timeOut: 3000,
  positionClass: 'toast-top-right',
  preventDuplicates: true,
  closeButton: true,
  progressBar: true,
  enableHtml: true,
  toastClass: 'custom-toast'
})
```

### Per-Toast Configuration
```typescript
this.toasterService.showSuccess('Message', 'Title', {
  timeOut: 5000,
  closeButton: false,
  progressBar: false,
  positionClass: 'toast-bottom-right'
});
```

## Interceptor Configuration

### Skip Automatic Toasts
To disable automatic toasts for specific endpoints, modify the `toastInterceptor`:

```typescript
// Add URLs that should skip automatic toasts
const skipUrls = ['/api/health-check', '/api/ping'];
const shouldSkip = skipUrls.some(url => req.url.includes(url));
```

### Customize Messages by HTTP Method
The interceptor automatically sets appropriate messages:
- POST: "Created successfully"
- PUT/PATCH: "Updated successfully"  
- DELETE: "Deleted successfully"
- Default: "Operation completed successfully"

## Best Practices

1. **Use automatic toasts for most API calls** - Let the interceptor handle standard success/error scenarios
2. **Use manual toasts for specific feedback** - Form validation, user actions, status updates
3. **Provide meaningful messages** - Avoid generic "Success" or "Error" messages
4. **Don't show too many toasts** - Be selective about what deserves user attention
5. **Use appropriate toast types** - Match the toast type to the message severity

## Migration from Old System

### Before (Old ToasterMessageService)
```typescript
this.toasterMessageService.sendMessage('Success message');
this.toasterMessageService.currentMessage$.subscribe(msg => {
  if (msg) {
    this.toastr.success(msg);
    this.toasterMessageService.sendMessage('');
  }
});
```

### After (New ToasterMessageService)
```typescript
// Most cases - automatic via interceptor
// Manual cases
this.toasterMessageService.showSuccess('Success message');
```

## Troubleshooting

### Toasts not appearing
1. Check if `provideAnimations()` is included in main.ts
2. Verify ngx-toastr styles are imported
3. Check browser console for errors

### Styling issues
1. Custom styles are in `styles.css` with `!important` flags
2. Check z-index conflicts
3. Verify CSS custom properties (CSS variables) are defined

### Too many duplicate toasts
1. Set `preventDuplicates: true` in configuration
2. Review interceptor logic for multiple API calls
3. Add debouncing for rapid user actions
