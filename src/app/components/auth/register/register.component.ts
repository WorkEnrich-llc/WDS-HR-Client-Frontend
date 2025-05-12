import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgOtpInputComponent } from 'ng-otp-input';
import { AuthenticationService } from '../../../core/services/authentication/authentication.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, NgOtpInputComponent, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnDestroy, OnInit {

  errMsg: string = '';
  jobTitleData: any = [];
groupedJobs: { name: string, jobs: any[] }[] = [];

  constructor(
    private _AuthenticationService: AuthenticationService,
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

  // Preview for uploaded image
  previewUrl: string | ArrayBuffer | null = null;

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        alert('Only PNG files are allowed.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // OTP
  otpCode: string = '';

  onOtpChange(otp: string) {
    this.otpCode = otp;
    console.log('OTP:', otp);
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
