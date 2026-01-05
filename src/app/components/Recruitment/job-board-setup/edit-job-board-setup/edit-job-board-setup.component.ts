import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { JobBoardSetupService } from '../../../../core/services/recruitment/job-board-setup/job-board-setup.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-edit-job-board-setup',
    standalone: true,
    imports: [PageHeaderComponent, FormsModule, PopupComponent, NgClass],
    providers: [DatePipe],
    templateUrl: './edit-job-board-setup.component.html',
    styleUrl: './edit-job-board-setup.component.css'
})
export class EditJobBoardSetupComponent implements OnInit {
    private router = inject(Router);
    private datePipe = inject(DatePipe);
    private jobBoardSetupService = inject(JobBoardSetupService);
    private toastr = inject(ToastrService);

    todayFormatted: string = '';
    isLoading: boolean = false;
    isSaving: boolean = false;
    isModalOpen: boolean = false;
    isSaveConfirmModalOpen: boolean = false;
    activeTab: string = 'about-company';

    // Logo upload properties
    selectedLogoFile: File | null = null;
    logoPreviewUrl: string | null = null;
    companyLogoUrl: string | null = null;
    isSavingLogo: boolean = false;
    isDeletingLogo: boolean = false;
    isDeleteLogoModalOpen: boolean = false;
    logoError: string | null = null;

    // Form data
    jobBoardSetup: any = {
        title: '',
        description: '',
        social_links: {
            website: '',
            linkedin: '',
            facebook: '',
            instagram: '',
            x: ''
        },
        theme: null
    };

    // Track which social media links are enabled (checked)
    socialMediaEnabled: any = {
        website: false,
        linkedin: false,
        facebook: false,
        instagram: false,
        x: false
    };

    // Theme options
    themes: any[] = [
        { id: 1, name: 'Blue', color: '#377AFD' },
        { id: 2, name: 'Indigo', color: '#6366F1' },
        { id: 3, name: 'Cyan', color: '#06B6D4' },
        { id: 4, name: 'Green', color: '#10B981' },
        { id: 5, name: 'Yellow', color: '#F59E0B' },
        { id: 6, name: 'Red', color: '#EF4444' },
        { id: 7, name: 'Black', color: '#1F2937' },
        { id: 8, name: 'Grey', color: '#6B7280' }
    ];

    // Original data for change detection
    originalData: any = null;
    originalSocialMediaEnabled: any = null;

    // Track if form has changes
    hasChanges: boolean = false;

    // Dates
    createdAt: string = '';
    updatedAt: string = '';

    // Validation errors
    validationErrors: any = {
        title: '',
        description: '',
        socialMedia: {
            website: '',
            linkedin: '',
            facebook: '',
            instagram: '',
            x: ''
        }
    };

    // Track if form has been touched/validated
    isFormTouched: boolean = false;

    // Track which fields have been blurred (touched by user)
    fieldTouched: any = {
        title: false,
        description: false,
        socialMedia: {
            website: false,
            linkedin: false,
            facebook: false,
            instagram: false,
            x: false
        }
    };

    constructor() {
        const today = new Date();
        this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
    }

    ngOnInit(): void {
        // Load job board setup data for editing
        this.loadJobBoardSetup();
    }

    loadJobBoardSetup(): void {
        this.isLoading = true;
        this.jobBoardSetupService.getJobBoardSetup().subscribe({
            next: (response: any) => {
                const data = response.data?.object_info || response.data || response;

                // Populate form data
                this.jobBoardSetup.title = data.title || '';
                this.jobBoardSetup.description = data.description || '';
                this.jobBoardSetup.social_links = {
                    website: data.social_links?.website || '',
                    linkedin: data.social_links?.linkedin || '',
                    facebook: data.social_links?.facebook || '',
                    instagram: data.social_links?.instagram || '',
                    x: data.social_links?.x || data.social_links?.twitter || ''
                };
                // Set theme - if theme is an object, use its id, otherwise use the value directly
                if (data.theme) {
                    this.jobBoardSetup.theme = typeof data.theme === 'object' ? data.theme.id : data.theme;
                } else {
                    this.jobBoardSetup.theme = null;
                }

                // Set enabled state based on whether URLs exist
                this.socialMediaEnabled = {
                    website: !!(data.social_links?.website),
                    linkedin: !!(data.social_links?.linkedin),
                    facebook: !!(data.social_links?.facebook),
                    instagram: !!(data.social_links?.instagram),
                    x: !!(data.social_links?.x || data.social_links?.twitter)
                };

                // Store original data for change detection
                this.originalData = JSON.parse(JSON.stringify(this.jobBoardSetup));
                this.originalSocialMediaEnabled = JSON.parse(JSON.stringify(this.socialMediaEnabled));

                // Initialize hasChanges (should be false initially since data just loaded)
                this.hasChanges = false;

                // Extract dates
                if (data.created_at) {
                    this.createdAt = this.formatDate(data.created_at);
                }
                if (data.updated_at) {
                    this.updatedAt = this.formatDate(data.updated_at);
                }

                // Set company logo URL if available
                if (data.company_logo) {
                    // Use generate_signed_url if available, otherwise fallback to image_url or direct value
                    if (data.company_logo.generate_signed_url) {
                        this.companyLogoUrl = data.company_logo.generate_signed_url;
                    } else if (data.company_logo.image_url) {
                        this.companyLogoUrl = data.company_logo.image_url;
                    } else if (typeof data.company_logo === 'string') {
                        this.companyLogoUrl = data.company_logo;
                    }
                }

                this.isLoading = false;

                // Check for changes after data is loaded (should be false initially)
                this.checkForChanges();
            },
            error: (error: any) => {
                console.error('Error loading job board setup:', error);
                this.isLoading = false;
            }
        });
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }

    handleTabClick(tab: string): void {
        // If clicking on the same tab, allow it
        if (tab === this.activeTab) {
            return;
        }

        // Validate current tab before allowing navigation
        if (!this.validateCurrentTab()) {
            // Validation failed, stay on current tab
            return;
        }
        this.activeTab = tab;
    }

    goToNextTab(): void {
        // Validate current tab before allowing navigation
        if (!this.validateCurrentTab()) {
            // Validation failed, stay on current tab
            return;
        }

        // Navigate to next tab based on current tab
        if (this.activeTab === 'about-company') {
            this.activeTab = 'social-media';
        } else if (this.activeTab === 'social-media') {
            this.activeTab = 'theme-selection';
        }
    }

    goToPrevTab(): void {
        // No validation needed for going back
        if (this.activeTab === 'social-media') {
            this.activeTab = 'about-company';
        } else if (this.activeTab === 'theme-selection') {
            this.activeTab = 'social-media';
        }
    }

    isActive(tab: string): boolean {
        return this.activeTab === tab;
    }

    onSaveClick(): void {
        if (this.isSaving) {
            return;
        }

        // Mark form as touched to show validation messages
        this.isFormTouched = true;

        // Validate all tabs and navigate to first invalid tab
        if (!this.validateAllTabs()) {
            // Find first invalid tab and navigate to it
            if (!this.validateAboutCompanyTab()) {
                this.activeTab = 'about-company';
            } else if (!this.validateSocialMediaTab()) {
                this.activeTab = 'social-media';
            }
            // Theme selection doesn't need validation
            return;
        }

        // All validations passed, open confirmation modal
        this.openSaveConfirmModal();
    }

    openSaveConfirmModal(): void {
        this.isSaveConfirmModalOpen = true;
    }

    closeSaveConfirmModal(): void {
        this.isSaveConfirmModalOpen = false;
    }

    confirmSave(): void {
        // Close the confirmation popup
        this.closeSaveConfirmModal();

        // Prevent action if already loading
        if (this.isSaving) {
            return;
        }

        this.isSaving = true;

        // Prepare social_links - only include enabled platforms with URLs
        const socialLinks: any = {};
        const platforms = ['website', 'linkedin', 'facebook', 'instagram', 'x'];

        platforms.forEach(platform => {
            if (this.socialMediaEnabled[platform] && this.jobBoardSetup.social_links[platform] && this.jobBoardSetup.social_links[platform].trim()) {
                socialLinks[platform] = this.jobBoardSetup.social_links[platform].trim();
            }
        });

        // Prepare theme - use 0 if not selected, otherwise use the theme ID (1-8)
        const theme = this.jobBoardSetup.theme || 0;

        // Prepare data for API in the expected format
        const updateData = {
            request_data: {
                title: this.jobBoardSetup.title,
                description: this.jobBoardSetup.description,
                social_links: socialLinks,
                theme: theme
            }
        };

        this.jobBoardSetupService.updateJobBoardSetup(updateData).subscribe({
            next: () => {
                this.isSaving = false;
                setTimeout(() => {
                    this.router.navigate(['/job-board-setup']);
                }, 500);
            },
            error: (error: any) => {
                console.error('Error updating job board setup:', error);
                this.isSaving = false;
            }
        });
    }

    openModal(): void {
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.isModalOpen = false;
    }

    confirmAction(): void {
        this.isModalOpen = false;
        this.router.navigate(['/job-board-setup']);
    }

    toggleSocialMedia(platform: string): void {
        this.socialMediaEnabled[platform] = !this.socialMediaEnabled[platform];
        // Clear URL and validation error if disabling
        if (!this.socialMediaEnabled[platform]) {
            this.jobBoardSetup.social_links[platform] = '';
            this.validationErrors.socialMedia[platform] = '';
        } else {
            // If enabling and field was touched, validate it
            if (this.fieldTouched.socialMedia[platform] || this.isFormTouched) {
                this.validateSocialMediaField(platform);
            }
        }
        this.checkForChanges();
    }

    isSocialMediaEnabled(platform: string): boolean {
        return this.socialMediaEnabled[platform] || false;
    }

    selectTheme(themeId: number): void {
        this.jobBoardSetup.theme = themeId;
        this.checkForChanges();
    }

    isThemeSelected(themeId: number): boolean {
        return this.jobBoardSetup.theme === themeId;
    }

    getThemeColor(theme: any): string {
        return theme.color || '#377AFD';
    }

    getThemeColorRgb(theme: any): string {
        const color = this.getThemeColor(theme);
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }

    getImageFilter(): string {
        if (!this.jobBoardSetup.theme) {
            return 'none';
        }

        const selectedTheme = this.themes.find(t => t.id === this.jobBoardSetup.theme);
        if (!selectedTheme) {
            return 'none';
        }

        const color = this.getThemeColor(selectedTheme);
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const themeName = selectedTheme.name.toLowerCase();

        // For black and grey, use hue-rotate to shift blue to neutral, then desaturate
        // This way only the colored elements (text) change, not the entire image
        if (themeName === 'black') {
            // Desaturate to make blue text appear black, without darkening the image
            // Only affects colored elements (text), not the whole image
            return 'saturate(0)';
        } else if (themeName === 'grey') {
            // Desaturate to make blue text appear grey, without darkening the image
            return 'saturate(0)';
        }

        // For other colors, calculate hue rotation based on the selected color
        // Blue is the base color (#377AFD = rgb(55, 122, 253))
        const baseR = 55;
        const baseG = 122;
        const baseB = 253;

        // Calculate hue shift
        const hueShift = this.calculateHueShift(baseR, baseG, baseB, r, g, b);

        // Apply hue rotation and saturation adjustments
        return `hue-rotate(${hueShift}deg) saturate(1.2)`;
    }

    calculateHueShift(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
        // Convert RGB to HSL for both colors
        const hsl1 = this.rgbToHsl(r1, g1, b1);
        const hsl2 = this.rgbToHsl(r2, g2, b2);

        // Calculate hue difference
        let hueDiff = hsl2.h - hsl1.h;

        // Normalize to -180 to 180 range
        if (hueDiff > 180) hueDiff -= 360;
        if (hueDiff < -180) hueDiff += 360;

        return hueDiff;
    }

    rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / d + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / d + 4) / 6;
                    break;
            }
        }

        return { h: h * 360, s, l };
    }

    // Validation methods
    validateCurrentTab(): boolean {
        if (this.activeTab === 'about-company') {
            return this.validateAboutCompanyTab();
        } else if (this.activeTab === 'social-media') {
            return this.validateSocialMediaTab();
        }
        // Theme selection doesn't need validation
        return true;
    }

    validateAboutCompanyTab(): boolean {
        this.isFormTouched = true;
        let isValid = true;

        // Validate Title
        if (!this.jobBoardSetup.title || !this.jobBoardSetup.title.trim()) {
            this.validationErrors.title = 'Title is required';
            isValid = false;
        } else {
            this.validationErrors.title = '';
        }

        // Validate Description
        if (!this.jobBoardSetup.description || !this.jobBoardSetup.description.trim()) {
            this.validationErrors.description = 'Description is required';
            isValid = false;
        } else {
            this.validationErrors.description = '';
        }

        return isValid;
    }

    validateSocialMediaTab(): boolean {
        this.isFormTouched = true;
        let isValid = true;

        // Validate each enabled social media link
        const platforms = ['website', 'linkedin', 'facebook', 'instagram', 'x'];

        platforms.forEach(platform => {
            if (this.socialMediaEnabled[platform]) {
                const url = this.jobBoardSetup.social_links[platform] || '';

                if (!url || !url.trim()) {
                    this.validationErrors.socialMedia[platform] = `${this.formatPlatformName(platform)} URL is required`;
                    isValid = false;
                } else {
                    // Validate URL format and platform-specific domain
                    const urlIsValid = this.isValidUrl(url.trim(), platform);
                    if (!urlIsValid) {
                        // Get more specific error message if available
                        try {
                            const hostname = url.trim().replace(/^https?:\/\//i, '').split('/')[0];
                            const domainValidation = this.validatePlatformDomain(hostname, platform);
                            if (domainValidation.message) {
                                this.validationErrors.socialMedia[platform] = domainValidation.message;
                            } else {
                                this.validationErrors.socialMedia[platform] = 'Please enter a valid URL';
                            }
                        } catch {
                            this.validationErrors.socialMedia[platform] = 'Please enter a valid URL';
                        }
                        isValid = false;
                    } else {
                        this.validationErrors.socialMedia[platform] = '';
                    }
                }
            } else {
                this.validationErrors.socialMedia[platform] = '';
            }
        });

        return isValid;
    }

    validateAllTabs(): boolean {
        const aboutCompanyValid = this.validateAboutCompanyTab();
        const socialMediaValid = this.validateSocialMediaTab();
        // Theme selection doesn't need validation

        return aboutCompanyValid && socialMediaValid;
    }

    isValidUrl(urlString: string, platform?: string): boolean {
        if (!urlString || !urlString.trim()) {
            return false;
        }

        try {
            // Add protocol if missing
            let urlToValidate = urlString.trim();
            if (!urlToValidate.match(/^https?:\/\//i)) {
                urlToValidate = 'https://' + urlToValidate;
            }

            // Validate URL format
            const url = new URL(urlToValidate);

            // Basic URL validation - must have protocol and hostname
            if (!url.protocol || !url.hostname) {
                return false;
            }

            // Validate protocol is http or https
            if (!['http:', 'https:'].includes(url.protocol)) {
                return false;
            }

            // Validate hostname is complete (not just "www." or "www")
            const hostname = url.hostname.toLowerCase();

            // Check if hostname is just "www" or "www." without a domain
            if (hostname === 'www' || hostname === 'www.' || hostname.startsWith('www.') && hostname.split('.').length < 3) {
                return false;
            }

            // Validate hostname has a valid structure (must have at least one dot and a TLD)
            // A valid domain should have at least: subdomain.domain.tld or domain.tld
            const parts = hostname.split('.');
            if (parts.length < 2) {
                return false;
            }

            // Check that the last part (TLD) is at least 2 characters and contains only letters
            const tld = parts[parts.length - 1];
            if (!tld || tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
                return false;
            }

            // Check that hostname doesn't end with a dot
            if (hostname.endsWith('.')) {
                return false;
            }

            // Check that hostname doesn't contain consecutive dots
            if (hostname.includes('..')) {
                return false;
            }

            // Platform-specific domain validation (optional but recommended)
            if (platform) {
                const domainValidation = this.validatePlatformDomain(hostname, platform);
                if (!domainValidation.isValid) {
                    return false;
                }
            }

            return true;
        } catch {
            return false;
        }
    }

    validatePlatformDomain(hostname: string, platform: string): { isValid: boolean; message?: string } {
        const domainMap: { [key: string]: string[] } = {
            website: ['www', ''],
            linkedin: ['linkedin.com', 'www.linkedin.com'],
            facebook: ['facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com'],
            instagram: ['instagram.com', 'www.instagram.com'],
            x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com']
        };

        const allowedDomains: string[] = domainMap[platform] || [];

        // For website, accept any valid domain
        if (platform === 'website') {
            // Basic domain validation is already done in isValidUrl
            // Just ensure it's not just "www" or incomplete
            if (hostname === 'www' || hostname === 'www.' || (hostname.startsWith('www.') && hostname.split('.').length < 3)) {
                return { isValid: false, message: 'Please enter a complete website URL (e.g., www.example.com)' };
            }
            return { isValid: true };
        }

        // For social media platforms, check if hostname matches expected domains
        const hostnameLower = hostname.toLowerCase();
        const matches = allowedDomains.some((domain: string) => {
            if (domain === '') {
                return false;
            }
            return hostnameLower === domain || hostnameLower.endsWith('.' + domain);
        });

        if (!matches) {
            const platformName = this.formatPlatformName(platform);
            return {
                isValid: false,
                message: `Please enter a valid ${platformName} URL (e.g., ${allowedDomains[0]})`
            };
        }

        return { isValid: true };
    }

    formatPlatformName(platform: string): string {
        const names: any = {
            website: 'Website',
            linkedin: 'LinkedIn',
            facebook: 'Facebook',
            instagram: 'Instagram',
            x: 'X (Twitter)'
        };
        return names[platform] || platform;
    }

    getValidationError(field: string): string {
        return this.validationErrors[field] || '';
    }

    getSocialMediaValidationError(platform: string): string {
        return this.validationErrors.socialMedia[platform] || '';
    }

    isFieldInvalid(field: string): boolean {
        return (this.fieldTouched[field] || this.isFormTouched) && !!this.validationErrors[field];
    }

    isSocialMediaFieldInvalid(platform: string): boolean {
        return (this.fieldTouched.socialMedia[platform] || this.isFormTouched) && !!this.validationErrors.socialMedia[platform];
    }

    // Check if form has changes
    checkForChanges(): void {
        if (!this.originalData || !this.originalSocialMediaEnabled) {
            this.hasChanges = false;
            return;
        }

        // Check title
        const titleChanged = (this.jobBoardSetup.title || '').trim() !== (this.originalData.title || '').trim();

        // Check description
        const descriptionChanged = (this.jobBoardSetup.description || '').trim() !== (this.originalData.description || '').trim();

        // Check theme
        const originalTheme = this.originalData.theme || null;
        const currentTheme = this.jobBoardSetup.theme || null;
        const themeChanged = originalTheme !== currentTheme;

        // Check social media links
        let socialMediaChanged = false;
        const platforms = ['website', 'linkedin', 'facebook', 'instagram', 'x'];

        for (const platform of platforms) {
            // Check if enabled state changed
            if (this.socialMediaEnabled[platform] !== this.originalSocialMediaEnabled[platform]) {
                socialMediaChanged = true;
                break;
            }

            // If enabled, check if URL changed
            if (this.socialMediaEnabled[platform]) {
                const originalUrl = (this.originalData.social_links?.[platform] || '').trim();
                const currentUrl = (this.jobBoardSetup.social_links[platform] || '').trim();
                if (originalUrl !== currentUrl) {
                    socialMediaChanged = true;
                    break;
                }
            }
        }

        this.hasChanges = titleChanged || descriptionChanged || themeChanged || socialMediaChanged;
    }

    // Handle field blur events
    onFieldBlur(field: string): void {
        this.fieldTouched[field] = true;
        this.validateField(field);
        this.checkForChanges();
    }

    onSocialMediaFieldBlur(platform: string): void {
        this.fieldTouched.socialMedia[platform] = true;
        this.validateSocialMediaField(platform);
        this.checkForChanges();
    }

    // Handle input events to clear errors when field becomes valid
    onFieldInput(field: string): void {
        if (this.fieldTouched[field] || this.isFormTouched) {
            this.validateField(field);
        }
        this.checkForChanges();
    }

    onSocialMediaFieldInput(platform: string): void {
        if (this.fieldTouched.socialMedia[platform] || this.isFormTouched) {
            this.validateSocialMediaField(platform);
        }
        this.checkForChanges();
    }

    // Validate individual field
    validateField(field: string): void {
        if (field === 'title') {
            if (!this.jobBoardSetup.title || !this.jobBoardSetup.title.trim()) {
                this.validationErrors.title = 'Title is required';
            } else {
                this.validationErrors.title = '';
            }
        } else if (field === 'description') {
            if (!this.jobBoardSetup.description || !this.jobBoardSetup.description.trim()) {
                this.validationErrors.description = 'Description is required';
            } else {
                this.validationErrors.description = '';
            }
        }
    }

    // Validate individual social media field
    validateSocialMediaField(platform: string): void {
        if (this.socialMediaEnabled[platform]) {
            const url = this.jobBoardSetup.social_links[platform] || '';

            if (!url || !url.trim()) {
                this.validationErrors.socialMedia[platform] = `${this.formatPlatformName(platform)} URL is required`;
            } else {
                // Validate URL format and platform-specific domain
                const isValid = this.isValidUrl(url.trim(), platform);
                if (!isValid) {
                    // Get more specific error message if available
                    try {
                        let urlToCheck = url.trim();
                        if (!urlToCheck.match(/^https?:\/\//i)) {
                            urlToCheck = 'https://' + urlToCheck;
                        }
                        const urlObj = new URL(urlToCheck);
                        const domainValidation = this.validatePlatformDomain(urlObj.hostname, platform);
                        if (domainValidation.message) {
                            this.validationErrors.socialMedia[platform] = domainValidation.message;
                        } else {
                            this.validationErrors.socialMedia[platform] = 'Please enter a valid URL';
                        }
                    } catch {
                        this.validationErrors.socialMedia[platform] = 'Please enter a valid URL';
                    }
                } else {
                    this.validationErrors.socialMedia[platform] = '';
                }
            }
        } else {
            this.validationErrors.socialMedia[platform] = '';
        }
    }

    // Logo upload methods
    @ViewChild('logoInput') logoInput!: any;

    openLogoPicker(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        if (this.logoInput && this.logoInput.nativeElement) {
            this.logoInput.nativeElement.click();
        }
    }

    onLogoFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        // Clear any previous errors first
        this.logoError = null;

        // Validate file type (images only)
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.logoError = 'Please select a valid image file (PNG, JPG, JPEG, or WEBP)';
            this.toastr.error(this.logoError, 'Invalid File Type');
            return;
        }

        // Validate file size (e.g., max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.logoError = 'File size must be less than 5MB';
            this.toastr.error(this.logoError, 'File Too Large');
            return;
        }

        this.selectedLogoFile = file;
        this.logoError = null;

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
            this.logoPreviewUrl = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    removeLogo(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        // Only remove preview if it's a newly selected file, not the existing company logo
        if (this.logoPreviewUrl && this.selectedLogoFile) {
            this.selectedLogoFile = null;
            this.logoPreviewUrl = null;
            if (this.logoInput && this.logoInput.nativeElement) {
                this.logoInput.nativeElement.value = '';
            }
        } else {
            // If removing the existing company logo, open delete modal
            this.openDeleteLogoModal();
        }
    }

    saveLogo(): void {
        if (!this.selectedLogoFile || this.isSavingLogo) {
            return;
        }

        this.isSavingLogo = true;

        const formData = new FormData();
        formData.append('is_remove', 'false');
        formData.append('company_logo', this.selectedLogoFile);

        this.jobBoardSetupService.updateCompanyLogo(formData).subscribe({
            next: (response: any) => {
                this.isSavingLogo = false;
                this.selectedLogoFile = null;

                // Update the logo URL if provided in response
                const logoData = response.data?.object_info?.company_logo || response.data?.company_logo || response.company_logo;
                if (logoData) {
                    // Use generate_signed_url if available, otherwise fallback to image_url or direct value
                    if (logoData.generate_signed_url) {
                        this.companyLogoUrl = logoData.generate_signed_url;
                    } else if (logoData.image_url) {
                        this.companyLogoUrl = logoData.image_url;
                    } else if (typeof logoData === 'string') {
                        this.companyLogoUrl = logoData;
                    }
                } else if (this.logoPreviewUrl) {
                    // Use preview as fallback
                    this.companyLogoUrl = this.logoPreviewUrl;
                }

                this.logoPreviewUrl = null;

                // Update logo in local storage
                this.updateLogoInLocalStorage(this.companyLogoUrl);

                // Reset file input
                const fileInput = document.getElementById('logoInput') as HTMLInputElement;
                if (fileInput) {
                    fileInput.value = '';
                }
            },
            error: (error: any) => {
                console.error('Error uploading logo:', error);
                this.isSavingLogo = false;
                this.toastr.error('Error uploading logo');
            }
        });
    }

    openDeleteLogoModal(): void {
        if (!this.companyLogoUrl && !this.selectedLogoFile) {
            return;
        }
        this.isDeleteLogoModalOpen = true;
    }

    closeDeleteLogoModal(): void {
        this.isDeleteLogoModalOpen = false;
    }

    confirmDeleteLogo(): void {
        this.closeDeleteLogoModal();

        if (this.isDeletingLogo) {
            return;
        }

        this.isDeletingLogo = true;

        const formData = new FormData();
        formData.append('is_remove', 'true');

        this.jobBoardSetupService.updateCompanyLogo(formData).subscribe({
            next: () => {
                this.isDeletingLogo = false;
                this.companyLogoUrl = null;
                this.selectedLogoFile = null;
                this.logoPreviewUrl = null;

                // Remove logo from local storage
                this.removeLogoFromLocalStorage();

                // Reset file input
                const fileInput = document.getElementById('logoInput') as HTMLInputElement;
                if (fileInput) {
                    fileInput.value = '';
                }

                // Show success toast
                this.toastr.success('Logo deleted successfully!');

                // Reload job board setup to get updated data
                this.loadJobBoardSetup();
            },
            error: (error: any) => {
                console.error('Error deleting logo:', error);
                this.isDeletingLogo = false;
                this.toastr.error('Error deleting logo');
            }
        });
    }

    /**
     * Update the logo URL in local storage company_info object
     */
    private updateLogoInLocalStorage(logoUrl: string | null): void {
        try {
            const storedData = localStorage.getItem('company_info');
            if (storedData) {
                const companyInfo = JSON.parse(storedData);
                if (logoUrl) {
                    companyInfo.logo = logoUrl;
                } else {
                    delete companyInfo.logo;
                }
                localStorage.setItem('company_info', JSON.stringify(companyInfo));
                // Dispatch custom event to notify other components of the change
                this.dispatchStorageChangeEvent();
            }
        } catch (error) {
            console.error('Error updating logo in local storage:', error);
        }
    }

    /**
     * Remove the logo from local storage company_info object
     */
    private removeLogoFromLocalStorage(): void {
        try {
            const storedData = localStorage.getItem('company_info');
            if (storedData) {
                const companyInfo = JSON.parse(storedData);
                if (companyInfo.logo) {
                    delete companyInfo.logo;
                    localStorage.setItem('company_info', JSON.stringify(companyInfo));
                    // Dispatch custom event to notify other components of the change
                    this.dispatchStorageChangeEvent();
                }
            }
        } catch (error) {
            console.error('Error removing logo from local storage:', error);
        }
    }

    /**
     * Dispatch a custom event to notify components about storage changes
     */
    private dispatchStorageChangeEvent(): void {
        // Create and dispatch a custom event for local component communication
        const storageEvent = new StorageEvent('storage', {
            key: 'company_info',
            newValue: localStorage.getItem('company_info')
        });
        window.dispatchEvent(storageEvent);
    }
}

