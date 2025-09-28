import { ActivateAccountService } from './../../../core/services/authentication/activate-account.service';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ValidationService } from 'app/core/services/settings/change-password/validation.service';

@Component({
  selector: 'app-activate-account',
  imports: [ReactiveFormsModule],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css'
})
export class ActivateAccountComponent {

  acceptInvitationForm!: FormGroup;
  private fb = inject(FormBuilder);
  private activateRoute = inject(ActivatedRoute);
  private activateAccountService = inject(ActivateAccountService);
  // private toasterService = inject(ToasterMessageService);

  isLoading = false;
  errMsg = '';
  email!: string;
  sender!: string;
  company!: string;
  securityKey!: string;





  isVisible: { [key: string]: boolean } = {
    old: false,
    new: false,
    confirm: false
  };

  ngOnInit(): void {
    this.initFormModels();

    const routeParams = this.activateRoute.snapshot.queryParams;

    this.email = routeParams['email'];
    this.company = routeParams['company'];
    this.sender = routeParams['sender'];

    const data = this.activateRoute.snapshot.data['invitation'];
    this.securityKey = data?.data?.security_key;
  }

  private initFormModels(): void {

    this.acceptInvitationForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), ValidationService.passwordPattern()]],
      re_password: ['', [Validators.required, Validators.minLength(8)]],
    },
      {
        validators: ValidationService.mustMatch('password', 're_password')
      });

  }


  onSubmit(): void {
    if (this.acceptInvitationForm.invalid) {
      this.acceptInvitationForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errMsg = '';
    const { password, re_password } = this.acceptInvitationForm.value;

    this.activateAccountService.resetPassword({
      username: this.email,
      password: password,
      re_password: re_password,
      security_key: this.securityKey
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('Password reset success', res);
      },
      error: (err) => {
        this.isLoading = false;
        this.errMsg = err?.error?.details || 'Something went wrong, please try again.';
        console.error('Password reset failed', err);
      }
    });
  }



  toggleVisibility(field: string) {
    this.isVisible[field] = !this.isVisible[field];
  }



  discardChanges(): void {
    this.acceptInvitationForm.reset();
  }

  getErrorMessage(controlName: string): string {
    const control: AbstractControl | null = this.acceptInvitationForm.get(controlName);
    if (control && control.errors && control.touched) {
      if (control.hasError('required')) return 'This field is required.';
      if (control.hasError('minlength')) return `Must be at least ${control.errors['minlength'].requiredLength} characters.`;
      if (control.hasError('passwordPattern')) return 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).';
      if (controlName === 're_password' && this.acceptInvitationForm.hasError('mustMatch')) return 'Passwords do not match.';
    }
    return '';
  }
}
