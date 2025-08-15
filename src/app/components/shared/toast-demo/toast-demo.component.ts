import { Component } from '@angular/core';

import { ToasterMessageService } from '../../../core/services/tostermessage/tostermessage.service';
import { ApiToastHelper } from '../../../core/helpers/api-toast.helper';

@Component({
  selector: 'app-toast-demo',
  standalone: true,
  imports: [],
  template: `
    <div class="toast-demo-container">
      <h2>Toast Notification Demo</h2>
      
      <div class="button-grid">
        <button 
          type="button" 
          class="btn btn-success" 
          (click)="showSuccessToast()">
          Show Success Toast
        </button>
        
        <button 
          type="button" 
          class="btn btn-danger" 
          (click)="showErrorToast()">
          Show Error Toast
        </button>
        
        <button 
          type="button" 
          class="btn btn-warning" 
          (click)="showWarningToast()">
          Show Warning Toast
        </button>
        
        <button 
          type="button" 
          class="btn btn-info" 
          (click)="showInfoToast()">
          Show Info Toast
        </button>
        
        <button 
          type="button" 
          class="btn btn-secondary" 
          (click)="showValidationError()">
          Show Validation Error
        </button>
        
        <button 
          type="button" 
          class="btn btn-primary" 
          (click)="showLoadingToast()">
          Show Loading Toast
        </button>
      </div>
      
      <div class="api-demo">
        <h3>API Response Demo</h3>
        <button 
          type="button" 
          class="btn btn-outline-success" 
          (click)="simulateApiSuccess()">
          Simulate API Success
        </button>
        
        <button 
          type="button" 
          class="btn btn-outline-danger" 
          (click)="simulateApiError()">
          Simulate API Error
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-demo-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    
    .api-demo {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    
    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .btn-success { background: #10b981; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-warning { background: #f59e0b; color: white; }
    .btn-info { background: #3b82f6; color: white; }
    .btn-secondary { background: #6b7280; color: white; }
    .btn-primary { background: #8b5cf6; color: white; }
    .btn-outline-success { background: transparent; color: #10b981; border: 2px solid #10b981; }
    .btn-outline-danger { background: transparent; color: #ef4444; border: 2px solid #ef4444; }
  `]
})
export class ToastDemoComponent {
  
  constructor(private toasterService: ToasterMessageService) {}
  
  showSuccessToast() {
    this.toasterService.showSuccess(
      'This is a success message! Your operation completed successfully.',
      'Success'
    );
  }
  
  showErrorToast() {
    this.toasterService.showError(
      'This is an error message! Something went wrong with your request.',
      'Error'
    );
  }
  
  showWarningToast() {
    this.toasterService.showWarning(
      'This is a warning message! Please check your input data.',
      'Warning'
    );
  }
  
  showInfoToast() {
    this.toasterService.showInfo(
      'This is an info message! Your request is being processed.',
      'Information'
    );
  }
  
  showValidationError() {
    ApiToastHelper.showValidationError(
      this.toasterService,
      'Please fill all required fields correctly before submitting.'
    );
  }
  
  showLoadingToast() {
    ApiToastHelper.showLoadingToast(
      this.toasterService,
      'Processing your request, please wait...'
    );
  }
  
  simulateApiSuccess() {
    const mockResponse = {
      status: 200,
      message: 'Data saved successfully!',
      data: { id: 123 }
    };
    
    ApiToastHelper.handleApiResponse(
      mockResponse,
      this.toasterService,
      'API call completed successfully!'
    );
  }
  
  simulateApiError() {
    const mockError = {
      status: 400,
      error: {
        message: 'Validation failed',
        details: 'The email address is already in use.'
      }
    };
    
    ApiToastHelper.handleApiError(
      mockError,
      this.toasterService
    );
  }
}
