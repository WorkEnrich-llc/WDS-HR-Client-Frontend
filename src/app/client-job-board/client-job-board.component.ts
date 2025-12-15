import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent, LogoData, SocialMediaLinks } from './layouts/navbar/navbar.component';
import { FooterComponent } from './layouts/footer/footer.component';
import { ClientJobBoardService } from './services/client-job-board.service';
import { ThemeService } from './services/theme.service';

@Component({
    selector: 'app-client-job-board',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterOutlet, NavbarComponent, FooterComponent],
    templateUrl: './client-job-board.component.html',
    styleUrls: ['./client-job-board.component.css']
})
export class ClientJobBoardComponent implements OnInit {
    private fb = inject(FormBuilder);
    private jobBoardService = inject(ClientJobBoardService);
    private themeService = inject(ThemeService);

    applicationForm!: FormGroup;
    uploadedFiles: { name: string; type: string; uploaded: boolean }[] = [];

    // Navbar data - initialized as empty, populated from API
    logoData: LogoData = {};
    socialMediaLinks: SocialMediaLinks = {};
    websiteUrl: string | null = null;

    // About section data for child components
    aboutTitle: string | null = null;
    aboutDescription: string | null = null;

    // Store reference to active child component
    private activeChildComponent: any = null;

    ngOnInit(): void {
        this.initForm();
        this.loadCompanySettings();
    }

    private loadCompanySettings(): void {
        this.jobBoardService.getCompanySettings().subscribe({
            next: (response) => {
                const objectInfo = response.data?.object_info;

                if (objectInfo) {
                    // Update logo data - only set if values exist
                    this.logoData = {};
                    if (objectInfo.logo) {
                        this.logoData.icon = objectInfo.logo;
                    }
                    if (objectInfo.name) {
                        this.logoData.companyName = objectInfo.name;
                    }
                    if (objectInfo.title) {
                        this.logoData.tagline = objectInfo.title;
                    }

                    // Update social media links - only set if values exist
                    this.socialMediaLinks = {};
                    if (objectInfo.social_links) {
                        if (objectInfo.social_links.facebook) {
                            this.socialMediaLinks.facebook = objectInfo.social_links.facebook;
                        }
                        if (objectInfo.social_links.instagram) {
                            this.socialMediaLinks.instagram = objectInfo.social_links.instagram;
                        }
                        if (objectInfo.social_links.x) {
                            this.socialMediaLinks.twitter = objectInfo.social_links.x;
                        }
                        if (objectInfo.social_links.linkedin) {
                            this.socialMediaLinks.linkedin = objectInfo.social_links.linkedin;
                        }
                    }

                    // Update website URL - only set if exists
                    this.websiteUrl = objectInfo.social_links?.website || null;

                    // Update about section data for child components
                    this.aboutTitle = objectInfo.title || null;
                    this.aboutDescription = objectInfo.description || null;

                    // Pass data to child component if it's already activated
                    this.passDataToChild();

                    // Apply theme color dynamically
                    if (objectInfo.theme_color) {
                        console.log('Setting theme color from API:', objectInfo.theme_color);
                        this.themeService.setThemeColor(objectInfo.theme_color);
                    } else {
                        console.warn('No theme_color found in API response');
                    }
                }
            },
            error: (error) => {
                console.error('Error loading company settings:', error);
                // Keep empty values on error - navbar will not display anything
            }
        });
    }

    private initForm(): void {
        this.applicationForm = this.fb.group({
            // Resume
            resume: [null],

            // Personal Details
            fullName: ['Ahmed', Validators.required],
            email: ['email.123@gmail.com', [Validators.required, Validators.email]],
            phoneNumber: ['01012345678', Validators.required],
            gender: ['Female', Validators.required],
            age: ['25', Validators.required],

            // Education Details
            university: ['', Validators.required],
            department: ['', Validators.required],
            major: ['', Validators.required],
            graduationYear: ['', Validators.required],

            // Address Information
            country: ['Egypt', Validators.required],
            city: ['Nasr City', Validators.required],
            stateProvince: ['Nasr City', Validators.required],

            // Links
            github: [''],
            portfolio: [''],
            linkedin: [''],

            // Professional Details
            currentCompany: ['', Validators.required],
            currentJobTitle: ['', Validators.required],
            jobLevel: ['', Validators.required],
            yearsOfExperience: ['', Validators.required],
            currentSalary: ['', Validators.required],
            expectedSalary: ['', Validators.required]
        });
    }

    onFileUpload(event: Event, fileType: string): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            // Handle file upload logic here
            console.log('File uploaded:', file.name, fileType);
        }
    }

    onFileDelete(fileName: string): void {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.name !== fileName);
    }

    onSubmit(): void {
        if (this.applicationForm.valid) {
            console.log('Form submitted:', this.applicationForm.value);
            // Handle form submission
        } else {
            console.log('Form is invalid');
        }
    }

    onDiscard(): void {
        if (confirm('Are you sure you want to discard this application?')) {
            this.applicationForm.reset();
            this.uploadedFiles = [];
        }
    }

    onChildActivate(component: any): void {
        // Store reference to active child component
        this.activeChildComponent = component;
        // Pass about section data to child component if it's activated
        this.passDataToChild();
    }

    /**
     * Pass about section data to child component if available
     */
    private passDataToChild(): void {
        if (this.activeChildComponent && typeof this.activeChildComponent.setAboutData === 'function') {
            this.activeChildComponent.setAboutData(this.aboutTitle, this.aboutDescription);
        }
    }
}
