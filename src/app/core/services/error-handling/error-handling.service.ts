import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { NetworkService } from '../network/network.service';

export interface ErrorMessage {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {

  constructor(
    private toastr: ToastrService,
    private networkService: NetworkService
  ) { }

  /**
   * Handle HTTP errors and return appropriate user-friendly messages
   */
  handleHttpError(error: HttpErrorResponse): ErrorMessage {
    let errorMessage: ErrorMessage = {
      title: 'Error',
      message: 'An unexpected error occurred',
      type: 'error'
    };

    // Check for network connectivity issues first
    if (!this.networkService.isOnline()) {
      errorMessage = {
        title: 'No Internet Connection',
        message: 'Please check your internet connection and try again.',
        type: 'warning'
      };
    } else if (error.status === 0 || error.name === 'HttpErrorResponse' && !error.status) {
      // Network error (no response from server)
      errorMessage = {
        title: 'Connection Failed',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        type: 'error'
      };
    } else {
      // Handle specific HTTP status codes
      switch (error.status) {
        case 400:
          errorMessage = {
            title: 'Invalid Request',
            message: error.error?.details || error.error?.message || 'The request contains invalid data.',
            type: 'error'
          };
          break;
        case 401:
          errorMessage = {
            title: 'Authentication Failed',
            message: error.error?.details || 'Please login again to continue.',
            type: 'warning'
          };
          break;
        case 403:
          errorMessage = {
            title: 'Access Denied',
            message: error.error?.details || 'You do not have permission to perform this action.',
            type: 'warning'
          };
          break;
        case 404:
          errorMessage = {
            title: 'Not Found',
            message: error.error?.details || 'The requested resource was not found.',
            type: 'error'
          };
          break;
        case 422:
          errorMessage = {
            title: 'Validation Error',
            message: error.error?.details || 'Please check your input and try again.',
            type: 'error'
          };
          break;
        case 500:
          errorMessage = {
            title: 'Server Error',
            message: 'An internal server error occurred. Please try again later.',
            type: 'error'
          };
          break;
        case 503:
          errorMessage = {
            title: 'Service Unavailable',
            message: 'The service is temporarily unavailable. Please try again later.',
            type: 'warning'
          };
          break;
        default:
          // For other status codes, use the server message if available
          errorMessage = {
            title: 'Error',
            message: error.error?.details || error.error?.message || `An error occurred (${error.status})`,
            type: 'error'
          };
      }
    }

    return errorMessage;
  }

  /**
   * Display error message using toastr
   */
  showError(error: HttpErrorResponse): void {
    const errorMessage = this.handleHttpError(error);
    
    switch (errorMessage.type) {
      case 'error':
        this.toastr.error(errorMessage.message, errorMessage.title);
        break;
      case 'warning':
        this.toastr.warning(errorMessage.message, errorMessage.title);
        break;
      case 'info':
        this.toastr.info(errorMessage.message, errorMessage.title);
        break;
    }
  }

  /**
   * Get error message string for manual handling
   */
  getErrorMessage(error: HttpErrorResponse): string {
    const errorMessage = this.handleHttpError(error);
    return errorMessage.message;
  }

  /**
   * Check if error is related to network connectivity
   */
  isNetworkError(error: HttpErrorResponse): boolean {
    return !this.networkService.isOnline() || 
           error.status === 0 || 
           (error.name === 'HttpErrorResponse' && !error.status);
  }
}
