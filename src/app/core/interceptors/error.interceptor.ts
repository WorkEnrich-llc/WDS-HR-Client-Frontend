// import { Injectable } from '@angular/core';
// import {
//    HttpEvent,
//    HttpHandler,
//    HttpInterceptor,
//    HttpRequest,
//    HttpErrorResponse
// } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';

// @Injectable()
// export class ErrorInterceptor implements HttpInterceptor {
//    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//       return next.handle(req).pipe(
//          catchError((error: HttpErrorResponse) => {
//             let errorMsg = 'An unknown error occurred';

//             if (error.error?.message && !error.error.message.includes('Http failure response')) {
//                errorMsg = error.error.message;
//             } else if (error.status === 0) {
//                errorMsg = 'Cannot connect to server';
//             } else {
//                errorMsg = `Error ${error.status}: ${error.statusText}`;
//             }

//             console.error('HTTP Error:', errorMsg);
//             return throwError(() => new Error(errorMsg));
//          })
//       );
//    }
// }
