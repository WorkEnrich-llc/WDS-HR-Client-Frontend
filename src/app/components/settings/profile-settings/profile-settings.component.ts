import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile } from 'app/core/models/profile';
import { ProfileService } from 'app/core/services/settings/profile/profile.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { fourPartsValidator } from './profile.validators';

@Component({
  selector: 'app-profile-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
})
export class ProfileSettingsComponent implements OnInit {
  profileForm!: FormGroup;
  currentProfileData!: Profile;
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private toasterService = inject(ToasterMessageService);
  profile!: Profile;
  ngOnInit(): void {
    this.getProfileInformation();
    this.initFormModel();
  }



  private initFormModel(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, fourPartsValidator()]],
      phone: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{9,}$/)]],
      email: [{ value: '', disabled: true }],
      department: [{ value: '', disabled: true }],
    });
  }


  private patchValue(): void {
    if (!this.profileForm) return;
    this.profileForm.patchValue({
      name: this.profile?.name ?? '',
      phone: this.profile?.mobile?.phone_number ?? '',
      email: this.profile?.email ?? '',
      department: this.profile?.department?.name ?? ''
    });
  }



  private getProfileInformation(): void {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.currentProfileData = { ...data };
        this.patchValue();
      },
      error: (err) => console.error('Failed to load profile', err)
    });
  }




  saveChanges(): void {
    if (this.profileForm.valid && this.profile) {
      const formData = new FormData();
      formData.append('name', this.profileForm.value.name);
      formData.append('phone', this.profileForm.value.phone);
      this.profileService.updateProfile(formData).subscribe({
        next: (data) => {
          this.profile = data;
          this.currentProfileData = { ...data };
          this.patchValue();
          this.profileForm.markAsPristine();
          this.toasterService.showSuccess('Profile updated successfully.',"Updated Successfully");
        },
        error: (err) => {
          this.toasterService.showError('Failed to update profile. Please try again later.');
        }
      });
    }
  }


  discardChanges(): void {
    this.profile = {
      ...this.currentProfileData,
    };
    this.patchValue();
  }
}