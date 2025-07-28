# Network Error Handling Implementation

This implementation provides comprehensive error handling for network connectivity issues and HTTP errors across the Angular application.

## Components Created

### 1. NetworkService (`src/app/core/services/network/network.service.ts`)
- Monitors online/offline status
- Provides methods to check network connectivity
- Observable for real-time network status updates

### 2. ErrorHandlingService (`src/app/core/services/error-handling/error-handling.service.ts`)
- Centralized error message handling
- Converts HTTP errors to user-friendly messages
- Handles different error types (network, authentication, validation, etc.)
- Provides methods for displaying errors via toastr

### 3. ErrorHandlingInterceptor (`src/app/core/interceptors/error-handling.interceptor.ts`)
- Global HTTP error interceptor
- Logs errors for debugging
- Can be configured to show global error messages

### 4. ApiHelperService (`src/app/core/services/api-helper/api-helper.service.ts`)
- Utility service for consistent API error handling
- Provides wrapper methods for common API call patterns
- Handles loading states and error callbacks

## Usage Examples

### Basic Error Handling in Components

```typescript
import { ErrorHandlingService } from '../../../core/services/error-handling/error-handling.service';
import { NetworkService } from '../../../core/services/network/network.service';

export class MyComponent {
  constructor(
    private errorHandlingService: ErrorHandlingService,
    private networkService: NetworkService
  ) {}

  makeApiCall(): void {
    // Check network before making call
    if (!this.networkService.isOnline()) {
      this.errorMessage = 'No internet connection. Please check your connection and try again.';
      return;
    }

    this.apiService.getData().subscribe({
      next: (response) => {
        // Handle success
      },
      error: (err: HttpErrorResponse) => {
        // Use error handling service
        this.errorMessage = this.errorHandlingService.getErrorMessage(err);
        
        // Or show toast
        this.errorHandlingService.showError(err);
      }
    });
  }
}
```

### Using ApiHelperService (Recommended)

```typescript
import { ApiHelperService } from '../../../core/services/api-helper/api-helper.service';

export class MyComponent {
  isLoading = false;
  errorMessage = '';

  constructor(private apiHelper: ApiHelperService) {}

  makeApiCall(): void {
    this.apiHelper.executeApiCall(
      () => this.apiService.getData(),
      (errorMessage) => this.errorMessage = errorMessage,
      (loading) => this.isLoading = loading
    ).subscribe({
      next: (response) => {
        // Handle success
      }
    });
  }
}
```

### Network Status Monitoring

```typescript
export class MyComponent implements OnInit {
  isOnline$ = this.networkService.getOnlineStatus();

  constructor(private networkService: NetworkService) {}

  ngOnInit() {
    this.isOnline$.subscribe(online => {
      if (!online) {
        // Show offline message
      }
    });
  }
}
```

## Error Messages Provided

### Network Errors
- **No Internet Connection**: "Please check your internet connection and try again."
- **Connection Failed**: "Unable to connect to the server. Please check your internet connection and try again."

### HTTP Status Codes
- **400 Bad Request**: Custom message from server or "The request contains invalid data."
- **401 Unauthorized**: "Please login again to continue."
- **403 Forbidden**: "You do not have permission to perform this action."
- **404 Not Found**: "The requested resource was not found."
- **422 Validation Error**: "Please check your input and try again."
- **500 Server Error**: "An internal server error occurred. Please try again later."
- **503 Service Unavailable**: "The service is temporarily unavailable. Please try again later."

## Configuration

### Adding to main.ts
The error handling interceptor is already added to the main.ts file:

```typescript
provideHttpClient(withInterceptors([authInterceptor, errorHandlingInterceptor]))
```

### Skip Global Error Handling
For specific endpoints that need custom error handling, add a header:

```typescript
const headers = new HttpHeaders().set('Skip-Error-Handling', 'true');
this.http.get(url, { headers }).subscribe(...);
```

## Migration Guide

To migrate existing components to use the new error handling:

1. **Import the services**:
   ```typescript
   import { ErrorHandlingService } from '../../../core/services/error-handling/error-handling.service';
   import { NetworkService } from '../../../core/services/network/network.service';
   ```

2. **Add to constructor**:
   ```typescript
   constructor(
     // ... existing services
     private errorHandlingService: ErrorHandlingService,
     private networkService: NetworkService
   ) {}
   ```

3. **Replace error handling**:
   ```typescript
   // Before
   error: (err: HttpErrorResponse) => {
     this.errorMessage = err.error?.details || 'An error occurred';
   }

   // After
   error: (err: HttpErrorResponse) => {
     this.errorMessage = this.errorHandlingService.getErrorMessage(err);
   }
   ```

4. **Add network checks**:
   ```typescript
   // Before making API calls
   if (!this.networkService.isOnline()) {
     this.errorMessage = 'No internet connection. Please check your connection and try again.';
     return;
   }
   ```

## Benefits

1. **Consistent Error Messages**: All network and HTTP errors display user-friendly messages
2. **Centralized Management**: Easy to update error messages across the entire application
3. **Network Awareness**: Proactive checking for network connectivity
4. **Flexible Implementation**: Can be used with existing code or new cleaner patterns
5. **Debugging Support**: Errors are still logged to console for developers
6. **Internationalization Ready**: Error messages can be easily localized

## Testing Network Errors

To test the implementation:

1. **Disconnect Internet**: Turn off internet connection and try API calls
2. **Chrome DevTools**: Use Network tab to simulate offline mode
3. **Server Shutdown**: Stop the backend server to test server connection errors
4. **Invalid Endpoints**: Test with invalid URLs to trigger 404 errors

## Future Enhancements

1. **Retry Logic**: Add automatic retry for failed network requests
2. **Offline Queue**: Queue requests when offline and send when online
3. **Custom Error Pages**: Create dedicated error pages for different error types
4. **Analytics Integration**: Track error frequencies for monitoring
5. **Internationalization**: Add multi-language support for error messages
