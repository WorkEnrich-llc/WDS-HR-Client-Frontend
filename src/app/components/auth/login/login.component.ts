import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../../../core/services/authentication/authentication.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  errMsg: string = '';
  isLoading: boolean = false;
  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });
  cookieService: any;
  constructor(
    private _AuthenticationService: AuthenticationService, private _Router: Router
  ) { }
  login(): void {
    this.isLoading = true;
    this.errMsg = '';

    const formData = new FormData();
    formData.append('username', this.loginForm.get('email')?.value);
    formData.append('password', this.loginForm.get('password')?.value);

    this._AuthenticationService.login(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        // console.log("Login response:", response);

        const authToken = response.data?.session?.auth_token;
        const domain = response.data?.company_info?.domain;

        if (authToken && domain) {

          this.cookieService.set('token', authToken);

          const { session, ...dataWithoutToken } = response.data || {};
          localStorage.setItem('user_data', JSON.stringify(dataWithoutToken));

          window.location.href = `https://${domain}/departments`;
        } else {
          this.errMsg = 'Invalid response from server.';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error("Login error:", err);
        this.errMsg = err.error?.details || 'An error occurred';
      }
    });
  }


}
