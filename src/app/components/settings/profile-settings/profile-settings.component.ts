import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile } from 'app/core/models/profile';
import { ProfileService } from 'app/core/services/settings/profile/profile.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-profile-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
})
export class ProfileSettingsComponent implements OnInit {
  profileForm!: FormGroup;
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private toasterService = inject(ToasterMessageService);
  profile: Profile | null = null;
  ngOnInit(): void {
    this.getProfileInformation();
    this.initFormModel();
  }



  private initFormModel(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
    });
  }


  private patchValue(): void {
    if (!this.profileForm) return;
    this.profileForm.patchValue({
      name: this.profile?.name ?? '',
      phone: this.profile?.mobile?.phone_number ?? '',
      email: this.profile?.email ?? '',
    });
  }



  private getProfileInformation(): void {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        console.log('Profile data:', data);
        this.profile = data;
        this.patchValue();
      },
      error: (err) => console.error('Failed to load profile', err)
    });
  }


  saveChanges(): void {
    if (this.profileForm.valid) {
      const updatedProfile: Profile = {
        ...this.profile,
        name: this.profileForm.value.name,
        email: this.profile?.email ?? '',
        mobile: {
          phone_prefix: '',
          phone_number: this.profileForm.value.phone
        }
      };

      this.profileService.updateProfile(updatedProfile).subscribe({
        next: (data) => {
          console.log('Profile updated successfully:', data);
          this.profile = data;
          this.patchValue();
          this.toasterService.showSuccess('Profile updated successfully.');
        },
        error: (err) => {
          console.error('Failed to update profile', err);
          this.toasterService.showError('Failed to update profile. Please try again later.');
        }
      });
    }
  }
}