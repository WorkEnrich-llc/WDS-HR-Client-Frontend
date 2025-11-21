import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToasterMessageService } from '../tostermessage/tostermessage.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {
  private toasterService = inject(ToasterMessageService);

  handleError(error: any): void {
    // Check if it's a dynamic import error
    if (error?.message?.includes('Failed to fetch dynamically imported module') || 
        error?.message?.includes('chunk') ||
        error?.name === 'ChunkLoadError') {
      // Suppress these errors silently or show a user-friendly message
      // Dynamic import failures are often due to network issues or cache problems
      // The app should handle this gracefully
      console.warn('Dynamic import failed, this may be due to network issues:', error);
      
      // Optionally show a toast message (uncomment if needed)
      // this.toasterService.showError('Failed to load some resources. Please refresh the page if the issue persists.');
      return;
    }

    // Check if it's a Google Maps loading warning (not a critical error)
    if (error?.message?.includes('Google Maps JavaScript API') && 
        error?.message?.includes('loading=async')) {
      // This is just a warning, not a critical error
      console.warn('Google Maps loading warning:', error.message);
      return;
    }

    // Handle other errors
    console.error('Global error handler:', error);
    
    // You can add more specific error handling here
    // For example, show toast messages for critical errors
    if (error?.error instanceof ErrorEvent) {
      // Client-side error
      console.error('Client error:', error.error.message);
    } else {
      // Server-side error
      console.error('Server error:', error);
    }
  }
}

