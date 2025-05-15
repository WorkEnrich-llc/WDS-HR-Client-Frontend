import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgOtpInputComponent } from 'ng-otp-input';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule, NgOtpInputComponent, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  currentStep = 1;
 

  goNext() {
    this.currentStep++;
  }

  goPrev() {
    this.currentStep--;
  }

  // OTP
  otpCode: string = '';

  onOtpChange(otp: string) {
    this.otpCode = otp;
    console.log('OTP:', otp);
  }

}
