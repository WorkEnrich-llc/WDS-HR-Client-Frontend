import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../../../core/services/authentication/authentication.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { ToasterMessageService } from '../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { FcmService } from '../../../core/services/FCM/fcm.service';
import DeviceDetector from 'device-detector-js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  isPasswordVisible = false
  ngOnInit(): void {

    this.toasterMessageService.currentMessage$.subscribe(msg => {
      if (msg) {
        this.toastr.success(msg);
        this.toasterMessageService.sendMessage('');
      }
    });
  }
  errMsg: string = '';
  isLoading: boolean = false;
  private loginRetryCount: number = 0;
  private readonly MAX_LOGIN_RETRIES: number = 1;
  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    private _AuthenticationService: AuthenticationService, private _Router: Router, private cookieService: CookieService, private toasterMessageService: ToasterMessageService,
    private toastr: ToastrService, private subService: SubscriptionService, private fcmService: FcmService
  ) { }


  private async initializeSession(): Promise<void> {
    try {
      await fetch("/", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Session initialization error:', error);
    }
  }

  async login(): Promise<void> {
    this.isLoading = true;
    this.errMsg = '';

    // Initialize session before login
    await this.initializeSession();

    const device_token = localStorage.getItem('device_token');
    const formData = new FormData();
    formData.append('username', this.loginForm.get('email')?.value);
    formData.append('password', this.loginForm.get('password')?.value);

    // Only send device_token if it exists and is not "true" or "false"
    if (device_token && device_token !== 'true' && device_token !== 'false') {
      formData.append('device_token', device_token);
    }

    // Add r_IN only if running on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      formData.append('r_IN', 'localhost');
    }

    this._AuthenticationService.login(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Check both root level and data level for response structure
        const session = response?.session || response?.data?.session;
        const companyInfo = response?.company_info || response?.data?.company_info;
        const userInfo = response?.user_info || response?.data?.user_info;

        const authToken = session?.auth_token;
        const session_token = session?.session_token;
        const domain = companyInfo?.domain;

        // Handle boolean values - convert to string if needed, or check truthiness
        const hasAuthToken = authToken !== undefined && authToken !== null && authToken !== false;
        const hasDomain = domain !== undefined && domain !== null && domain !== '';

        if (hasAuthToken && hasDomain) {
          // Reset retry count on successful login
          this.loginRetryCount = 0;

          // Convert boolean to string if needed, otherwise use as is
          const tokenValue = typeof authToken === 'boolean' ? String(authToken) : authToken;
          const sessionTokenValue = typeof session_token === 'boolean' ? String(session_token) : (session_token || '');

          this.cookieService.set('token', tokenValue);
          localStorage.setItem('token', JSON.stringify(tokenValue));
          localStorage.setItem('session_token', JSON.stringify(sessionTokenValue));

          if (userInfo) {
            localStorage.setItem('user_info', JSON.stringify(userInfo));
          }

          if (companyInfo) {
            localStorage.setItem('company_info', JSON.stringify(companyInfo));
          }

          // Get sub_domain and construct redirect URL
          const subDomain = companyInfo?.sub_domain;
          const redirectUrl = this.constructSubdomainUrl(subDomain);

          // Call S-L API if s_l_c and s_l_t are present and not empty, before subscription check
          const hasSLC = session?.s_l_c?.nonce && session?.s_l_c?.ciphertext;
          const hasSLT = session?.s_l_t?.nonce && session?.s_l_t?.ciphertext;

          if (hasSLC && hasSLT) {
            const requestData = {
              request_data: {
                s_l_c: {
                  nonce: session.s_l_c.nonce,
                  ciphertext: session.s_l_c.ciphertext
                },
                s_l_t: {
                  nonce: session.s_l_t.nonce,
                  ciphertext: session.s_l_t.ciphertext
                }
              }
            };

            this._AuthenticationService.sessionLogin(requestData).subscribe({
              next: () => {
                // S-L API call successful, now call subscription status
                this.subService.getSubscription().subscribe({
                  next: (sub) => {
                    if (sub) {
                      this.subService.setSubscription(sub);
                    }
                    // Redirect to subdomain URL
                    this.redirectToSubdomain(redirectUrl);
                  },
                  error: (err) => {
                    console.error('Subscription load error:', err);
                    // Redirect even if subscription fails
                    this.redirectToSubdomain(redirectUrl);
                  }
                });
              },
              error: (err) => {
                console.error('S-L API call error:', err);
                // If S-L fails, redirect directly
                this.redirectToSubdomain(redirectUrl);
              }
            });
          } else {
            // Missing session data, redirect directly without S-L or subscription
            this.redirectToSubdomain(redirectUrl);
          }
        } else {
          this.loginRetryCount = 0; // Reset on invalid response
          this.errMsg = 'Invalid response from server.';
        }
      },
      error: async (err: HttpErrorResponse) => {
        // If 424 Failed Dependency, register device and retry login
        if (err.status === 424 && this.loginRetryCount < this.MAX_LOGIN_RETRIES) {
          try {
            this.loginRetryCount++;
            await this.registerDevice();
            // Retry login after device registration
            this.login();
            return;
          } catch (deviceError) {
            console.error('Device registration error:', deviceError);
            this.isLoading = false;
            this.loginRetryCount = 0; // Reset on error
            this.errMsg = 'Failed to register device. Please try again.';
            return;
          }
        }

        // Reset retry count on other errors or max retries reached
        this.loginRetryCount = 0;
        this.isLoading = false;
        this.errMsg = err.error?.details || 'Login failed. Please try again.';
      }
    });
  }

  private async registerDevice(): Promise<void> {
    // Initialize session before device registration
    await this.initializeSession();

    const deviceDetector = new DeviceDetector();
    const userAgent = navigator.userAgent;
    const device = deviceDetector.parse(userAgent);

    const formData = new FormData();
    formData.append('device_type', device.device?.type || 'unknown');
    formData.append('d_family', device.device?.brand || 'unknown');
    formData.append('d_model', device.device?.model || 'unknown');
    formData.append('d_os', device.os?.name || 'unknown');
    formData.append('d_version', device.os?.version || 'unknown');
    formData.append('d_browser', device.client?.name || 'unknown');
    formData.append('d_browser_version', device.client?.version || 'unknown');

    const fcmToken = await this.fcmService.getToken();
    formData.append('fcm_token', fcmToken || '');

    const isGranted = Notification.permission === 'granted';
    formData.append('is_fcm', isGranted ? '1' : '0');
    localStorage.setItem('is_fcm', isGranted ? 'true' : 'false');

    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    formData.append('ip', data.ip);

    // Add r_IN only if running on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      formData.append('r_IN', 'localhost');
    }

    const res: any = await this._AuthenticationService.deviceRegister(formData).toPromise();
    // Check both root level and data level for device_token
    const deviceTokenValue = res?.device_token !== undefined ? res.device_token : res?.data?.device_token;

    if (deviceTokenValue !== undefined && deviceTokenValue !== null) {
      // Handle both boolean and string types
      const deviceToken = typeof deviceTokenValue === 'boolean'
        ? String(deviceTokenValue)
        : deviceTokenValue;
      localStorage.setItem('device_token', deviceToken);
    }

    if (fcmToken) localStorage.setItem('fcm_token', fcmToken);
  }



  togglePassword(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  /**
   * Construct subdomain URL from sub_domain
   * Format: {protocol}://{sub_domain}.{base_domain}
   */
  private constructSubdomainUrl(subDomain: string | null | undefined): string | null {
    if (!subDomain || subDomain.trim() === '') {
      return null;
    }

    const currentUrl = window.location;
    const protocol = currentUrl.protocol; // http: or https:
    const hostname = currentUrl.hostname; // e.g., localhost, talentdot.org, or dev-google.talentdot.org
    const port = currentUrl.port ? `:${currentUrl.port}` : '';

    // If already on localhost, keep localhost (subdomain won't work on localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // For localhost, we can't use subdomains, so just redirect to dashboard
      return null;
    }

    // Extract base domain (remove any existing subdomain)
    // e.g., "dev-google.talentdot.org" -> "talentdot.org"
    // e.g., "talentdot.org" -> "talentdot.org"
    let baseDomain = hostname;
    const parts = hostname.split('.');
    if (parts.length > 2) {
      // Has subdomain, extract base domain (last two parts)
      baseDomain = parts.slice(-2).join('.');
    }

    // Construct new URL with subdomain
    const newUrl = `${protocol}//${subDomain}.${baseDomain}${port}`;
    return newUrl;
  }

  /**
   * Redirect to subdomain URL or fallback to router navigation
   */
  private redirectToSubdomain(url: string | null): void {
    if (url) {
      // Full page redirect to subdomain
      window.location.href = url;
    } else {
      // Fallback to router navigation (e.g., for localhost)
      this._Router.navigate(['/dashboard']);
    }
  }

}
