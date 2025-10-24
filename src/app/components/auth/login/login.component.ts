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
  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    private _AuthenticationService: AuthenticationService, private _Router: Router, private cookieService: CookieService, private toasterMessageService: ToasterMessageService,
    private toastr: ToastrService, private subService: SubscriptionService
  ) { }


  login(): void {
    this.isLoading = true;
    this.errMsg = '';
    const device_token = localStorage.getItem('device_token');
    const formData = new FormData();
    formData.append('username', this.loginForm.get('email')?.value);
    formData.append('password', this.loginForm.get('password')?.value);
    formData.append('device_token', device_token!);

    this._AuthenticationService.login(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        const authToken = response.data?.session?.auth_token;
        const session_token = response.data?.session?.session_token;
        const domain = response.data?.company_info?.domain;

        if (authToken && domain) {
          this.cookieService.set('token', authToken);
          localStorage.setItem('token', JSON.stringify(authToken));
          localStorage.setItem('session_token', JSON.stringify(session_token));

          const userInfo = response.data?.user_info;
          const companyInfo = response.data?.company_info;

          if (userInfo) {
            localStorage.setItem('user_info', JSON.stringify(userInfo));
          }

          if (companyInfo) {
            localStorage.setItem('company_info', JSON.stringify(companyInfo));
          }


          // this.subService.getSubscription().subscribe({
          //   next: (sub) => {
          //     if (sub) {
          //       this.subService.setSubscription(sub);
          //     }
          //   },
          //   error: (err) => {
          //     console.error('Subscription load error:', err);
          //   }
          // });

          this._Router.navigate(['/dashboard']);
        } else {
          this.errMsg = 'Invalid response from server.';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.errMsg = err.error?.details;
      }
    });
  }



  togglePassword(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }


}
