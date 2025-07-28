import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { toastInterceptor } from './app/core/interceptors/toast.interceptor';
import { errorHandlingInterceptor } from './app/core/interceptors/error-handling.interceptor';
import { importProvidersFrom } from '@angular/core';
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

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(NgxDaterangepickerMd.forRoot()),
    provideHttpClient(withInterceptors([authInterceptor, errorHandlingInterceptor])),
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

    )
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

// function withScrollPositionRestoration(arg0: string): import("@angular/router").RouterFeatures {
//   throw new Error('Function not implemented.');
// }
