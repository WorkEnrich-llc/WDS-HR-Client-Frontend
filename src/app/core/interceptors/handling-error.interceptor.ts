// import {
//    HttpInterceptor,
//    HttpRequest,
//    HttpHandler,
//    HttpEvent,
//    HttpResponse,
//    HttpErrorResponse
// } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable, tap } from 'rxjs';
// import { ToasterMessageService } from '../services/tostermessage/tostermessage.service';

// @Injectable()
// export class HandlingErrorInterceptor implements HttpInterceptor {

//    constructor(private toaster: ToasterMessageService) { }

//    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//       return next.handle(req).pipe(
//          tap({
//             next: (event) => {
//                if (event instanceof HttpResponse && req.method !== 'GET') {
//                   this.handleSuccess(event, req);
//                }
//             },
//             error: (error: HttpErrorResponse) => {
//                this.handleError(error);
//             }
//          })
//       );
//    }

//    // Handle Success Messages
//    private handleSuccess(event: HttpResponse<any>, req: HttpRequest<any>): void {
//       let message = event.body?.message || event.body?.data?.message;

//       if (!message) {
//          switch (req.method) {
//             case 'POST':
//                message = 'Created successfully';
//                break;
//             case 'PUT':
//             case 'PATCH':
//                message = 'Updated successfully';
//                break;
//             case 'DELETE':
//                message = 'Deleted successfully';
//                break;
//             default:
//                message = 'Operation completed successfully';
//          }
//       }

//       if (message) {
//          this.toaster.showSuccess(message);
//       }
//    }

//    // Handle Error Messages
//    private handleError(error: HttpErrorResponse): void {
//       const errorMessages = this.extractErrorMessages(error);
//       if (errorMessages.length > 0) {
//          errorMessages.forEach(msg => this.toaster.showError(msg));
//       } else {
//          this.toaster.showError(this.getDefaultErrorMessage(error));
//       }
//    }

//    // Extract multiple error messages if available
//    private extractErrorMessages(error: HttpErrorResponse): string[] {
//       if (error.error?.errors && Array.isArray(error.error.errors)) {
//          return error.error.errors.map((e: any) => e.message || e);
//       }
//       if (error.error?.message) {
//          return [error.error.message];
//       }
//       if (typeof error.error === 'string') {
//          return [error.error];
//       }
//       return [];
//    }

//    // Fallback error messages
//    private getDefaultErrorMessage(error: HttpErrorResponse): string {
//       switch (error.status) {
//          case 0:
//             return 'Network error. Please check your connection.';
//          case 400:
//             return 'Bad request.';
//          case 401:
//             return 'Unauthorized. Please log in.';
//          case 403:
//             return 'Access denied.';
//          case 404:
//             return 'Resource not found.';
//          case 500:
//             return 'Server error. Please try again later.';
//          default:
//             return 'An unexpected error occurred.';
//       }
//    }
// }