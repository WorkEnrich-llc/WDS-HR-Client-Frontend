
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { AbstractControl, FormControl, FormControlOptions, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgOtpInputComponent } from 'ng-otp-input';
import { AuthenticationService } from '../../../core/services/authentication/authentication.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, NgOtpInputComponent, RouterLink, ReactiveFormsModule, NgClass, DecimalPipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnDestroy, OnInit {
  isPasswordVisible = false
  isrePasswordVisible = false
  private _currentStep = 1;
  get currentStep() {
    return this._currentStep;
  }
  set currentStep(value: number) {
    this._currentStep = value;
    // Start countdown when entering the verification step
    if (value === 3 && !this.countdown) {
      this.startCountdown();
    }
    // Clear any existing error messages when leaving the verification step
    if (value !== 3) {
      this.errMsg = '';
    }
  }

  selectAll: boolean = false;

  goNext() {
    this.currentStep++;
  }

  goPrev() {
    this.currentStep--;
  }

  errMsg: string = '';
  isLoading: boolean = false;
  jobTitleData: any = [];
  emailMsg: string = '';
  groupedJobs: { name: string, jobs: any[] }[] = [];

  constructor(
    private _AuthenticationService: AuthenticationService, private _Router: Router, private cookieService: CookieService, private subService: SubscriptionService
  ) { }

  ngOnInit(): void {
    this.loadJobTitles();

  }


  loadJobTitles(): void {
    this._AuthenticationService.getJobTitles().subscribe({
      next: (response) => {
        this.jobTitleData = response.data.list_items;
        let currentGroup: any = null;
        this.groupedJobs = [];
        for (const item of this.jobTitleData) {
          if (!item.available) {
            currentGroup = { name: item.name, jobs: [] };
            this.groupedJobs.push(currentGroup);
          } else if (currentGroup) {
            currentGroup.jobs.push(item);
          }
        }
      },
      error: (err) => {
        this.errMsg = err.message;
        console.error("Error:", this.errMsg);
      }
    });
  }




  // step 1 validation
  registerForm1: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/.*[A-Za-z].*/)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    jobTitle: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, this.passwordComplexityValidator]),
    rePassword: new FormControl('', [Validators.required]),
  }, { validators: [this.confirmPassword] } as FormControlOptions);



  passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const errors: ValidationErrors = {};

    if (value.length < 8) {
      errors['minLength'] = 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(value)) {
      errors['uppercase'] = 'Password must contain at least one uppercase letter.';
    }
    if (!/[a-z]/.test(value)) {
      errors['lowercase'] = 'Password must contain at least one lowercase letter.';
    }
    if (!/[0-9]/.test(value)) {
      errors['digit'] = 'Password must contain at least one digit.';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors['specialChar'] = 'Password must contain at least one special character.';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  getPasswordErrors(): string[] {
    const errors = this.registerForm1.get('password')?.errors;
    if (!errors) return [];

    const messages: string[] = [];

    if (errors['required']) {
      messages.push('Pssword is Required');
    }
    if (errors['minLength']) {
      messages.push(errors['minLength']);
    }
    if (errors['uppercase']) {
      messages.push(errors['uppercase']);
    }
    if (errors['lowercase']) {
      messages.push(errors['lowercase']);
    }
    if (errors['digit']) {
      messages.push(errors['digit']);
    }
    if (errors['specialChar']) {
      messages.push(errors['specialChar']);
    }

    return messages;
  }



  confirmPassword(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const rePassword = group.get('rePassword')?.value;

    if (!rePassword) {
      group.get('rePassword')?.setErrors({ required: true });
      return { passwordMismatch: true };
    }

    if (password !== rePassword) {
      group.get('rePassword')?.setErrors({ mismatch: true });
      return { passwordMismatch: true };
    }

    group.get('rePassword')?.setErrors(null);
    return null;
  }


  emailAvailable: boolean = false;
  checkEmail(): void {
    const emailControl = this.registerForm1.get('email');
    if (!emailControl?.value) return;

    this._AuthenticationService.checkEmail(emailControl.value).subscribe({
      next: (response) => {
        this.emailMsg = 'Email available';
        this.emailAvailable = true;

        if (emailControl.hasError('emailTaken')) {
          const currentErrors = emailControl.errors;
          delete currentErrors?.['emailTaken'];
          emailControl.setErrors(Object.keys(currentErrors || {}).length ? currentErrors : null);
        }
      },
      error: (err: HttpErrorResponse) => {
        const details = err.error?.details || '';

        this.emailMsg = details;
        this.emailAvailable = false;
        emailControl.setErrors({ emailTaken: true });

        console.error("Email check error:", err);
      }
    });
  }



  // step 2 form
  registerForm2: FormGroup = new FormGroup({
    logo: new FormControl('', [Validators.required]),
    companyName: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    domain: new FormControl('', [
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9\\-]+$')
    ]),
    numOfEmployee: new FormControl('', [Validators.required]),

  });


  // Preview for uploaded image
  previewUrl: string | ArrayBuffer | null = null;
  markLogoTouched() {
    this.registerForm2.get('logo')?.markAsTouched();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const logoControl = this.registerForm2.get('logo');

    this.previewUrl = null;
    logoControl?.setErrors(null);
    logoControl?.markAsTouched();

    if (!file) {
      logoControl?.setErrors({ required: true });
      return;
    }

    const isPng = file.type === 'image/png';
    const isUnder5MB = file.size <= 5 * 1024 * 1024;

    if (!isPng) {
      logoControl?.setErrors({ invalidFormat: true });
      return;
    }

    if (!isUnder5MB) {
      logoControl?.setErrors({ maxSize: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
      logoControl?.setValue(file);
      logoControl?.setErrors(null);
    };
    reader.readAsDataURL(file);
  }


  domainMsg: string = '';
  domainAvailable: boolean = false;
  domainSuggestions: string[] = [];

  checkDomain(): void {
    const domainControl = this.registerForm2.get('domain');
    if (!domainControl?.value) return;

    this._AuthenticationService.checkDomain(domainControl.value).subscribe({
      next: (response) => {
        this.domainMsg = 'Domain is available';
        this.domainAvailable = true;
        this.domainSuggestions = [];

        domainControl.markAsTouched();

        if (domainControl.hasError('domainTaken')) {
          const currentErrors = domainControl.errors;
          delete currentErrors?.['domainTaken'];
          domainControl.setErrors(Object.keys(currentErrors || {}).length ? currentErrors : null);
        }

        domainControl.updateValueAndValidity({ onlySelf: true });
      },
      error: (err: HttpErrorResponse) => {
        const details = err.error?.details || 'This domain is not available.';
        const suggestions = err.error?.data?.list_items || [];

        this.domainMsg = details;
        this.domainAvailable = false;
        this.domainSuggestions = suggestions;

        domainControl.setErrors({ domainTaken: true });
        domainControl.markAsTouched();
      }
    });
  }
  selectSuggestion(suggestion: string): void {
    this.registerForm2.get('domain')?.setValue(suggestion);
    this.checkDomain();
  }

  timeLeftResend: number = 0;
  sendOtp(): void {
    this.errMsg = '';
    this.isLoading = true;
    const emailControl = this.registerForm1.get('email');
    if (!emailControl?.value) return;

    this._AuthenticationService.sendCode(emailControl.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.timeLeftResend = response.data.re_send_seconds_left;
        this.startCountdown();
        this.goNext();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error("Email check error:", err);
        this.errMsg = err.error?.details || 'An error occurred';
      }
    });
  }




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

  // step 3 form
  async createAccount(): Promise<void> {
    this.isLoading = true;
    this.errMsg = '';

    // Initialize session before account creation
    await this.initializeSession();

    const device_token = localStorage.getItem('device_token');
    const formData = new FormData();
    formData.append('name', this.registerForm1.get('name')?.value);
    formData.append('email', this.registerForm1.get('email')?.value);
    formData.append('job_title', this.registerForm1.get('jobTitle')?.value);
    formData.append('password', this.registerForm1.get('password')?.value);
    formData.append('re_password', this.registerForm1.get('rePassword')?.value);
    formData.append('company_name', this.registerForm2.get('companyName')?.value);
    formData.append('company_domain', this.registerForm2.get('domain')?.value);
    formData.append('company_emp_number', this.registerForm2.get('numOfEmployee')?.value);
    formData.append('company_logo', this.registerForm2.get('logo')?.value);
    formData.append('verification_code', this.otpForm.get('otp')?.value);
    formData.append('device_token', device_token!);

    this._AuthenticationService.createAcount(formData).subscribe({
      next: (response) => {
        this.isLoading = false;

        // Check both root level and data level for response structure
        const session = response?.session || response?.data?.session;
        const companyInfo = response?.company_info || response?.data?.company_info;
        const userInfo = response?.user_info || response?.data?.user_info;
        const authToken = session?.auth_token;
        const session_token = session?.session_token;
        const domain = companyInfo?.domain;

        const hasAuthToken = authToken !== undefined && authToken !== null && authToken !== false;
        const hasDomain = domain !== undefined && domain !== null && domain !== '';

        if (hasAuthToken && hasDomain) {
          this.cookieService.set('token', authToken);
          localStorage.setItem('token', JSON.stringify(authToken));
          localStorage.setItem('session_token', JSON.stringify(session_token));

          if (userInfo) {
            localStorage.setItem('user_info', JSON.stringify(userInfo));
          }
          if (companyInfo) {
            localStorage.setItem('company_info', JSON.stringify(companyInfo));
          }

          // Get sub_domain and construct redirect URL
          const subDomain = companyInfo?.sub_domain;
          const redirectUrl = this.constructSubdomainUrl(subDomain);

          // Call S-L API directly after successful account creation
          const requestData = {
            request_data: {
              s_l_c: {
                nonce: session.s_l_c?.nonce,
                ciphertext: session.s_l_c?.ciphertext
              },
              s_l_t: {
                nonce: session.s_l_t?.nonce,
                ciphertext: session.s_l_t?.ciphertext
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
          this.errMsg = 'Invalid response from server.';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Account creation error:', err);
        this.errMsg = err.error?.details || 'An error occurred while creating account.';
      }
    });
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

  otpCode: string = '';
  otpForm: FormGroup = new FormGroup({
    otp: new FormControl('', [Validators.required, Validators.minLength(6)]),

  });

  onOtpChange(otp: string): void {
    this.otpCode = otp;
    const control = this.otpForm.controls['otp'];
    control.setValue(otp);
    control.markAsTouched();
    control.markAsDirty();
    control.updateValueAndValidity();
  }




  // Timer for Resend Email
  minutes: string = '00';
  seconds: string = '00';
  canResend = false;
  private countdown: any;


  startCountdown() {
    this.canResend = false;
    let remaining = this.timeLeftResend;

    this.updateDisplay(remaining);

    this.countdown = setInterval(() => {
      remaining--;
      this.updateDisplay(remaining);

      if (remaining <= 0) {
        clearInterval(this.countdown);
        this.countdown = null;
        this.canResend = true;
      }
    }, 1000);
  }


  updateDisplay(remaining: number) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    this.minutes = mins < 10 ? '0' + mins : '' + mins;
    this.seconds = secs < 10 ? '0' + secs : '' + secs;
  }

  // Resend Email
  resendEmail(event: Event): void {
    event.preventDefault();

    if (!this.canResend) return;

    const emailControl = this.registerForm1.get('email');
    if (!emailControl?.value) return;

    this.canResend = false;

    this._AuthenticationService.sendCode(emailControl.value).subscribe({
      next: (response) => {
        this.timeLeftResend = response.data.re_send_seconds_left;
        this.startCountdown();
      },
      error: (err: HttpErrorResponse) => {
        this.canResend = true;
        this.errMsg = err.error?.details || 'An error occurred';
      }
    });
  }


  ngOnDestroy() {
    if (this.countdown) {
      clearInterval(this.countdown);
    }
  }

  togglePassword(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
  togglerePassword(): void {
    this.isrePasswordVisible = !this.isrePasswordVisible;
  }

}
