import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { toastInterceptor } from './app/core/interceptors/toast.interceptor';
import { errorHandlingInterceptor } from './app/core/interceptors/error-handling.interceptor';
import { importProvidersFrom, ErrorHandler } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app/app.routes';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { environment } from './environments/environment';
import { subscriptionInterceptor } from 'app/core/interceptors/subscription.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { GlobalErrorHandlerService } from './app/core/services/global-error-handler/global-error-handler.service';
import { enableCredentialsGlobally } from './app/core/services/http/credentials-http-backend';

// Enable credentials (cookies) for all HTTP requests globally
// This ensures withCredentials: true is set for ALL XMLHttpRequest instances
enableCredentialsGlobally();

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(NgxDaterangepickerMd.forRoot()),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorHandlingInterceptor,
        toastInterceptor,
        subscriptionInterceptor
      ])),
    // provideHttpClient(withInterceptors([authInterceptor, toastInterceptor])),

    provideAnimations(),
    provideRouter(
      routes,
      withViewTransitions(),
    ),

    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      enableHtml: true,
      toastClass: 'custom-toast'
    }),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideMessaging(() => getMessaging()),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      }),

    ),
    provideCharts(withDefaultRegisterables()),
    // Global error handler for unhandled errors
    { provide: ErrorHandler, useClass: GlobalErrorHandlerService }
  ]
}).catch(err => console.error(err));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('firebase-messaging-sw.js')
    .then((registration) => {
      // registration.showNotification('title', {
      //   body: 'body',
      //   data: {
      //     url: 'departments/view-department/1',
      //   },
      // });

      // console.log('SW registered', registration);
    }).catch(err => console.error('SW registration failed', err));
}

// Global error handlers for unhandled errors and promise rejections
window.addEventListener('error', (event) => {
  // Suppress dynamic import errors and chunk loading errors
  if (event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('chunk') ||
    event.filename?.includes('chunk')) {
    event.preventDefault();
    console.warn('Suppressed dynamic import error:', event.message);
    return false;
  }

  // Suppress Google Maps loading warnings
  if (event.message?.includes('Google Maps JavaScript API') &&
    event.message?.includes('loading=async')) {
    event.preventDefault();
    return false;
  }

  return true;
});

// Handle unhandled promise rejections (for dynamic imports)
window.addEventListener('unhandledrejection', (event) => {
  // Suppress dynamic import failures
  if (event.reason?.message?.includes('Failed to fetch dynamically imported module') ||
    event.reason?.message?.includes('chunk') ||
    event.reason?.name === 'ChunkLoadError') {
    event.preventDefault();
    console.warn('Suppressed unhandled promise rejection (dynamic import):', event.reason);
    return;
  }
});


// function withScrollPositionRestoration(arg0: string): import("@angular/router").RouterFeatures {
//   throw new Error('Function not implemented.');
// }
