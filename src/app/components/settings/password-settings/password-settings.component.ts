import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChangePasswordService } from 'app/core/services/settings/change-password/change-password.service';
import { ValidationService } from 'app/core/services/settings/change-password/validation.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-password-settings',
  templateUrl: './password-settings.component.html',
  styleUrl: './password-settings.component.css',
  imports: [ReactiveFormsModule]
})
export class PasswordSettingsComponent implements OnInit {

  changePasswordForm!: FormGroup;
  private fb = inject(FormBuilder);
  private changePasswordService = inject(ChangePasswordService);
  private toasterService = inject(ToasterMessageService);

  isVisible: { [key: string]: boolean } = {
    old: false,
    new: false,
    confirm: false
  };

  ngOnInit(): void {
    this.initFormModels();
  }

  private initFormModels(): void {

    this.changePasswordForm = this.fb.group({
      old_password: ['', [Validators.required, Validators.minLength(8)]],
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

  changePassword(): void {
    if (this.changePasswordForm.valid) {
      const { old_password, password, re_password } = this.changePasswordForm.value;
      this.changePasswordService.changePassword(old_password!, password!, re_password!).subscribe({
        next: (res) => {
          this.toasterService.showSuccess('Password updated successfully.',"Updated Successfully");
          this.changePasswordForm.reset();
        },
        error: (err) => {
          console.error('Failed to change password', err);
          this.toasterService.showError(err.error?.details || 'Failed to change password.');
        }
      });
    }
  }

  discardChanges(): void {
    this.changePasswordForm.reset();
  }

  getErrorMessage(controlName: string): string {
    const control: AbstractControl | null = this.changePasswordForm.get(controlName);
    if (control && control.errors && control.touched) {
      if (control.hasError('required')) return 'This field is required.';
      if (control.hasError('minlength')) return `Must be at least ${control.errors['minlength'].requiredLength} characters.`;
      if (control.hasError('passwordPattern')) return 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).';
      if (controlName === 're_password' && this.changePasswordForm.hasError('mustMatch')) return 'Passwords do not match.';
    }
    return '';
  }
}
