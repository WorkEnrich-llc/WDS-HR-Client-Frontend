import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormControlOptions, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgOtpInputComponent } from 'ng-otp-input';
import { AuthenticationService } from '../../../core/services/authentication/authentication.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, NgOtpInputComponent, RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnDestroy, OnInit {
  private _currentStep = 1;
  get currentStep() {
    return this._currentStep;
  }
  set currentStep(value: number) {
    this._currentStep = value;

    if (value === 3 && !this.countdown) {
      this.startCountdown();
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
    private _AuthenticationService: AuthenticationService, private _Router: Router
  ) { }

  ngOnInit(): void {
    this.loadJobTitles();

  }


  loadJobTitles(): void {
    this._AuthenticationService.getJobTitles().subscribe({
      next: (response) => {
        this.jobTitleData = response.data.list_items;
        // console.log("Job Titles Data:", this.jobTitleData);
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
    name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    jobTitle: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, this.passwordComplexityValidator]),
    rePassword: new FormControl(''),
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
        if (details.includes('already')) {
          this.emailMsg = 'Email is already registered';
          this.emailAvailable = false;
          emailControl.setErrors({ emailTaken: true });
        }
        console.error("Email check error:", err);
      }
    });
  }



  // step 2 form
  registerForm2: FormGroup = new FormGroup({
    logo: new FormControl('', [Validators.required]),
    companyName: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    domain: new FormControl('', [Validators.required, Validators.email]),
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



  checkDomain(): void {
    const domainControl = this.registerForm2.get('domain');
    if (!domainControl?.value) return;

    this._AuthenticationService.checkDomain(domainControl.value).subscribe({
      next: (response) => {
        this.emailMsg = response;
        console.log(this.emailMsg);
        // if (response?.details) {
        //   this.emailMsg = response.details;
        //   emailControl.setErrors({ domainTaken: true });
        // } else {
        //   this.emailMsg = '';
        //   if (emailControl.hasError('domainTaken')) {
        //     const currentErrors = emailControl.errors;
        //     delete currentErrors?.['domainTaken'];
        //     if (Object.keys(currentErrors || {}).length === 0) {
        //       emailControl.setErrors(null);
        //     } else {
        //       emailControl.setErrors(currentErrors);
        //     }
        //   }
        // }
      },
      error: (err) => {
        this.errMsg = err;
        console.error("Error:", this.errMsg);
      }
    });
  }

  // step 3 form
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
  minutes: string = '02';
  seconds: number = 30;
  canResend = false;
  private countdown: any;
  private totalSeconds = 150;

  startCountdown() {
    this.canResend = false;
    let remaining = this.totalSeconds;

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
    this.seconds = secs;
  }

  resendEmail() {
    if (!this.canResend) return;

    // logic in resend mail
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.countdown) {
      clearInterval(this.countdown);
    }
  }

}
