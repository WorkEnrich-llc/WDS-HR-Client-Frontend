import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ValidationService } from 'app/core/services/settings/change-password/validation.service';

@Component({
  selector: 'app-activate-account',
  imports: [ReactiveFormsModule],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css'
})
export class ActivateAccountComponent {
  isLoading = false;
  errMsg = '';


  acceptInvitationForm!: FormGroup;
  private fb = inject(FormBuilder);
  // private changePasswordService = inject(ChangePasswordService);
  // private toasterService = inject(ToasterMessageService);

  isVisible: { [key: string]: boolean } = {
    old: false,
    new: false,
    confirm: false
  };

  ngOnInit(): void {
    this.initFormModels();
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
