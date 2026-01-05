
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlingService } from '../../../core/services/error-handling/error-handling.service';
import { NetworkService } from '../../../core/services/network/network.service';
import { ApiHelperService } from '../../../core/services/api-helper/api-helper.service';
import { Observable, throwError } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-error-handling-demo',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="demo-container">
      <h3>Error Handling Demo</h3>
    
      <div class="status-section">
        <h4>Network Status</h4>
        <p>Online: {{ (isOnline$ | async) ? 'Yes' : 'No' }}</p>
        <button (click)="checkConnectivity()" [disabled]="checkingConnectivity">
          {{ checkingConnectivity ? 'Checking...' : 'Test Connectivity' }}
        </button>
      </div>
    
      <div class="demo-section">
        <h4>Error Handling Examples</h4>
    
        <button (click)="simulateNetworkError()" [disabled]="isLoading">
          Simulate Network Error
        </button>
    
        <button (click)="simulate404Error()" [disabled]="isLoading">
          Simulate 404 Error
        </button>
    
        <button (click)="simulate500Error()" [disabled]="isLoading">
          Simulate 500 Error
        </button>
    
        <button (click)="makeApiCallWithHelper()" [disabled]="isLoading">
          API Call with Helper
        </button>
      </div>
    
      @if (errorMessage || successMessage) {
        <div class="results-section">
          <h4>Results</h4>
          @if (errorMessage) {
            <div class="error-message">
              {{ errorMessage }}
            </div>
          }
          @if (successMessage) {
            <div class="success-message">
              {{ successMessage }}
            </div>
          }
        </div>
      }
    
      @if (isLoading) {
        <div class="loading-section">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      }
    </div>
    `,
  styles: [`
    .demo-container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .status-section, .demo-section, .results-section {
      margin-bottom: 20px;
      padding: 15px;
      border-left: 3px solid #007bff;
      background-color: #f8f9fa;
    }

    .demo-section button {
      margin: 5px 10px 5px 0;
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .demo-section button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .demo-section button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .error-message {
      padding: 10px;
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }

    .success-message {
      padding: 10px;
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
    }

    .loading-section {
      text-align: center;
      padding: 20px;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    h3, h4 {
      color: #333;
      margin-bottom: 15px;
    }
  `]
})
export class ErrorHandlingDemoComponent {
  isOnline$: Observable<boolean>;
  isLoading = false;
  checkingConnectivity = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private http: HttpClient,
    private errorHandlingService: ErrorHandlingService,
    private networkService: NetworkService,
    private apiHelper: ApiHelperService
  ) {
    this.isOnline$ = this.networkService.getOnlineStatus();
  }

  async checkConnectivity() {
    this.checkingConnectivity = true;
    this.clearMessages();

    try {
      const isConnected = await this.networkService.checkConnectivity();
      this.successMessage = isConnected ?
        'Connection test successful!' :
        'Connection test failed - no internet access';
    } catch (error) {
      this.errorMessage = 'Failed to check connectivity';
    } finally {
      this.checkingConnectivity = false;
    }
  }

  simulateNetworkError() {
    this.clearMessages();

    if (!this.networkService.isOnline()) {
      this.errorMessage = 'No internet connection. Please check your connection and try again.';
      return;
    }

    this.isLoading = true;

    // Simulate a network timeout
    const networkError = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      error: 'Network timeout'
    });

    setTimeout(() => {
      this.isLoading = false;
      this.errorMessage = this.errorHandlingService.getErrorMessage(networkError);
    }, 1000);
  }

  simulate404Error() {
    this.clearMessages();
    this.isLoading = true;

    const error404 = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
      error: { details: 'The requested endpoint was not found' }
    });

    setTimeout(() => {
      this.isLoading = false;
      this.errorMessage = this.errorHandlingService.getErrorMessage(error404);
    }, 1000);
  }

  simulate500Error() {
    this.clearMessages();
    this.isLoading = true;

    const error500 = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
      error: { details: 'Something went wrong on the server' }
    });

    setTimeout(() => {
      this.isLoading = false;
      this.errorMessage = this.errorHandlingService.getErrorMessage(error500);
    }, 1000);
  }

  makeApiCallWithHelper() {
    this.clearMessages();

    // Simulate an API call that might fail
    const simulatedApiCall = (): Observable<any> => {
      return throwError(() => new HttpErrorResponse({
        status: 422,
        statusText: 'Validation Error',
        error: { details: 'Invalid input data provided' }
      }));
    };

    this.apiHelper.executeApiCall(
      simulatedApiCall,
      (errorMessage) => this.errorMessage = errorMessage,
      (loading) => this.isLoading = loading
    ).subscribe({
      next: (response) => {
        this.successMessage = 'API call successful!';
      }
    });
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
