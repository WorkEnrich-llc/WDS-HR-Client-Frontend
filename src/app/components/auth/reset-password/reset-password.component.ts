import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormControlOptions, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgOtpInputComponent } from 'ng-otp-input';
import { AuthenticationService } from '../../../core/services/authentication/authentication.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {  ToastrService } from 'ngx-toastr';
import { ToasterMessageService } from '../../../core/services/tostermessage/tostermessage.service';


@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule, NgOtpInputComponent, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {


  constructor(
    private _AuthenticationService: AuthenticationService, private _Router: Router,private toasterMessageService: ToasterMessageService
  ) { }

  emailForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),

  });


  emailAvailable: boolean = false;
  emailMsg: string = '';
  errMsg: string = '';
  isLoading: boolean = false;

  checkEmail(): void {
  const emailControl = this.emailForm.get('email');
  if (!emailControl || emailControl.invalid) return;

  this.isLoading = true;

  this._AuthenticationService.checkEmail(emailControl.value).subscribe({
    next: () => {
      this.emailMsg = 'Email is not registered';
      this.isLoading = false;
      emailControl.setErrors({ emailNotRegistered: true });
      emailControl.updateValueAndValidity(); 
    },
    error: () => {
      this.emailMsg = 'Email is registered';
      this.isLoading = false;
      emailControl.setErrors(null);
      emailControl.updateValueAndValidity(); 
    }
  });
}



  currentStep = 1;


  goNext() {
    this.currentStep++;
  }

  goPrev() {
    this.currentStep--;
  }


  timeLeftResend: number = 0;
  sendOtp(): void {
    this.errMsg = '';
    this.isLoading = true;
    const emailControl = this.emailForm.get('email');
    // console.log('emailControl', emailControl);
    if (!emailControl?.value) return;

    this._AuthenticationService.forgetPassSendCode(emailControl.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.goNext();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        // console.error("Email check error:", err);
        this.errMsg = err.error?.details || 'An error occurred';
      }
    });
  }


  // OTP
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
  }


  // check code
  checkCode(): void {
    this.isLoading = true;
    this.errMsg = '';

    const formData = new FormData();
    formData.append('username', this.emailForm.get('email')?.value);
    formData.append('verification_code', this.otpForm.get('otp')?.value);

    this._AuthenticationService.forgetCheckCode(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.goNext();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        // console.error("Account creation error:", err);
        this.errMsg = err.error?.details || 'An error occurred';
      }
    });

  }




  // password new
  passwordForm: FormGroup = new FormGroup({
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
    const errors = this.passwordForm.get('password')?.errors;
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



newPassword(): void {
  this.isLoading = true;
  this.errMsg = '';

  const formData = new FormData();
  formData.append('username', this.emailForm.get('email')?.value);
  formData.append('verification_code', this.otpForm.get('otp')?.value);
  formData.append('password', this.passwordForm.get('password')?.value);
  formData.append('re_password', this.passwordForm.get('rePassword')?.value);

  this._AuthenticationService.newPassword(formData).subscribe({
    next: (response) => {
      this.isLoading = false;

      this.emailForm.reset();
      this.otpForm.reset();
      this.passwordForm.reset();
// edit
    this.toasterMessageService.sendMessage(response.details);

    this._Router.navigate(['/auth/login']);
    },
    error: (err: HttpErrorResponse) => {
      this.isLoading = false;
      // console.error("Account creation error:", err);
      this.errMsg = err.error?.details || 'An error occurred';
    }
  });
}


}
