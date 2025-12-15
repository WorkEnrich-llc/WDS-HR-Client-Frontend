import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CloseDropdownDirective } from '../../../core/directives/close-dropdown.directive';
import { ClientJobBoardService } from '../../services/client-job-board.service';

export interface JobOpening {
  id: string;
  department: string;
  title: string;
  category: string;
  isNew: boolean;
  employmentType: string;
  workMode: string;
  location: string;
  description: string;
}

@Component({
  selector: 'app-open-positions',
  standalone: true,
  imports: [FormsModule, CloseDropdownDirective, RouterLink],
  templateUrl: './open-positions.component.html',
  styleUrl: './open-positions.component.css'
})
export class OpenPositionsComponent implements OnInit {
  router = inject(Router);
  private jobBoardService = inject(ClientJobBoardService);

  isLoading: boolean = false;
  errorMessage: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  totalPages: number = 1;
  itemsPerPage: number = 10;

  // About section data from company settings (set by parent component)
  aboutTitle: string | null = null;
  aboutDescription: string | null = null;

  /**
   * Set about section data from parent component
   * This method is called by the parent ClientJobBoardComponent to avoid duplicate API calls
   */
  setAboutData(title: string | null, description: string | null): void {
    this.aboutTitle = title;
    this.aboutDescription = description;
  }

  ngOnInit(): void {
    this.loadJobListings(this.currentPage, this.itemsPerPage);
    // Company settings are loaded by parent ClientJobBoardComponent
    // to avoid duplicate API calls
    // If data wasn't passed, load it directly as fallback
    if (!this.aboutTitle && !this.aboutDescription) {
      this.loadCompanySettingsFallback();
    }
  }

  /**
   * Fallback: Load company settings directly if parent didn't pass data
   */
  private loadCompanySettingsFallback(): void {
    this.jobBoardService.getCompanySettings().subscribe({
      next: (response) => {
        const objectInfo = response.data?.object_info;
        if (objectInfo) {
          this.aboutTitle = objectInfo.title || null;
          this.aboutDescription = objectInfo.description || null;
        }
      },
      error: (error) => {
        // Silently fail - parent component should handle this
      }
    });
  }

  /**
   * Check if a job is considered "new" based on creation date
   * A job is considered new if it was created within the last 7 days
   */
  private isJobNew(createdAt: string): boolean {
    if (!createdAt) return false;

    const createdDate = new Date(createdAt);
    const now = new Date();
    const daysDifference = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysDifference <= 7; // Consider jobs created within last 7 days as "new"
  }


  loadJobListings(page: number = 1, perPage: number = 10): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.jobBoardService.getJobListings(page, perPage).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Map the API response to your JobOpening interface
        // The API returns jobs in response.data.list_items
        const jobsData = response.data?.list_items || [];

        // Store pagination data from API response
        this.totalItems = response.data?.total_items || 0;
        this.currentPage = parseInt(response.data?.page || '1', 10);
        this.totalPages = response.data?.total_pages || 1;

        if (Array.isArray(jobsData) && jobsData.length > 0) {
          this.jobOpenings = jobsData
            .map((job) => {
              // Helper function to extract name from object or string
              const getName = (value: any): string => {
                if (!value) return '';
                if (typeof value === 'string') return value;
                if (typeof value === 'object' && value.name) return value.name;
                return '';
              };

              // Map API response fields to JobOpening interface
              // Fields are now objects with {id, name} structure
              const mappedJob: JobOpening = {
                id: job.id?.toString() || '',
                department: job.job_level || getName(job.work_mode) || '',
                title: getName(job.job_title),
                category: job.job_level || getName(job.work_mode) || '',
                isNew: this.isJobNew(job.created_at),
                employmentType: getName(job.employment_type),
                workMode: getName(job.work_schedule),
                location: getName(job.branch),
                description: job.job_description || ''
              };
              return mappedJob;
            })
            .filter((job: JobOpening) => job.id && job.title); // Only include jobs with required fields
        } else {
          this.jobOpenings = [];
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'We encountered an issue while fetching job openings. Please try again in a moment.';
        console.error('Error loading job listings:', error);
        this.jobOpenings = [];
        this.totalItems = 0;
        this.currentPage = 1;
        this.totalPages = 1;
      }
    });
  }
  selectedDepartment: string = '';
  selectedCity: string = '';
  selectedEmploymentType: string = '';
  selectedWorkMode: string = '';

  // Dropdown open states
  isDepartmentOpen: boolean = false;
  isCityOpen: boolean = false;
  isEmploymentTypeOpen: boolean = false;
  isWorkModeOpen: boolean = false;

  // Active descendant tracking for keyboard navigation
  private activeDescendantIndex: { [key: string]: number } = {
    department: -1,
    city: -1,
    employmentType: -1,
    workMode: -1
  };

  toggleDropdown(dropdown: 'department' | 'city' | 'employmentType' | 'workMode', event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const wasOpen = this.isDropdownOpen(dropdown);

    // Close all other dropdowns
    this.isDepartmentOpen = false;
    this.isCityOpen = false;
    this.isEmploymentTypeOpen = false;
    this.isWorkModeOpen = false;

    // Reset all active descendant indices
    Object.keys(this.activeDescendantIndex).forEach(key => {
      this.activeDescendantIndex[key] = -1;
    });

    // Toggle the selected dropdown
    switch (dropdown) {
      case 'department':
        this.isDepartmentOpen = !wasOpen;
        break;
      case 'city':
        this.isCityOpen = !wasOpen;
        break;
      case 'employmentType':
        this.isEmploymentTypeOpen = !wasOpen;
        break;
      case 'workMode':
        this.isWorkModeOpen = !wasOpen;
        break;
    }

    // Announce to screen readers
    if (!wasOpen && this.isDropdownOpen(dropdown)) {
      this.announceToScreenReader(`${this.getDropdownLabel(dropdown)} filter opened`);
    }
  }

  private getDropdownLabel(dropdown: 'department' | 'city' | 'employmentType' | 'workMode'): string {
    const labels: { [key: string]: string } = {
      department: 'Department',
      city: 'City',
      employmentType: 'Employment type',
      workMode: 'Work mode'
    };
    return labels[dropdown];
  }

  private announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  selectOption(dropdown: 'department' | 'city' | 'employmentType' | 'workMode', value: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const previousValue = this.getSelectedValue(dropdown);
    const displayValue = value || this.getDropdownLabel(dropdown);

    switch (dropdown) {
      case 'department':
        this.selectedDepartment = value;
        break;
      case 'city':
        this.selectedCity = value;
        break;
      case 'employmentType':
        this.selectedEmploymentType = value;
        break;
      case 'workMode':
        this.selectedWorkMode = value;
        break;
    }

    // Announce selection to screen readers
    if (previousValue !== value) {
      const filterLabel = this.getDropdownLabel(dropdown);
      const announcement = value
        ? `${filterLabel} filter set to ${displayValue}`
        : `${filterLabel} filter cleared`;
      this.announceToScreenReader(announcement);
    }

    // Close dropdown after selection
    this.closeAllDropdowns();

    // Return focus to button
    setTimeout(() => {
      const button = document.querySelector(`[aria-controls="${this.getDropdownId(dropdown)}"]`) as HTMLElement;
      if (button) {
        button.focus();
      }
    }, 0);
  }

  private getSelectedValue(dropdown: 'department' | 'city' | 'employmentType' | 'workMode'): string {
    switch (dropdown) {
      case 'department':
        return this.selectedDepartment;
      case 'city':
        return this.selectedCity;
      case 'employmentType':
        return this.selectedEmploymentType;
      case 'workMode':
        return this.selectedWorkMode;
    }
  }

  getDisplayValue(type: 'department' | 'city' | 'employmentType' | 'workMode'): string {
    switch (type) {
      case 'department':
        return this.selectedDepartment || 'Department';
      case 'city':
        return this.selectedCity || 'City';
      case 'employmentType':
        return this.selectedEmploymentType || 'Employment Type';
      case 'workMode':
        return this.selectedWorkMode || 'Work Mode';
    }
  }

  handleKeyDown(event: KeyboardEvent, dropdown: 'department' | 'city' | 'employmentType' | 'workMode'): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleDropdown(dropdown);
      if (this.isDropdownOpen(dropdown)) {
        // Focus first option when opening
        setTimeout(() => {
          const firstOption = document.querySelector(`#${this.getDropdownId(dropdown)} .dropdown-item[tabindex="0"]`) as HTMLElement;
          if (firstOption) {
            firstOption.focus();
            this.activeDescendantIndex[dropdown] = 0;
          }
        }, 0);
      }
    } else if (event.key === 'Escape') {
      this.closeAllDropdowns();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isDropdownOpen(dropdown)) {
        this.toggleDropdown(dropdown);
      }
      this.navigateDropdown(dropdown, 'down');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.isDropdownOpen(dropdown)) {
        this.navigateDropdown(dropdown, 'up');
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      if (this.isDropdownOpen(dropdown)) {
        this.focusDropdownItem(dropdown, 0);
      }
    } else if (event.key === 'End') {
      event.preventDefault();
      if (this.isDropdownOpen(dropdown)) {
        const items = this.getDropdownItems(dropdown);
        this.focusDropdownItem(dropdown, items.length - 1);
      }
    }
  }

  handleDropdownItemKeyDown(event: KeyboardEvent, dropdown: 'department' | 'city' | 'employmentType' | 'workMode', value: string, target: any): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectOption(dropdown, value, event);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeAllDropdowns();
      // Return focus to button
      const button = document.querySelector(`[aria-controls="${this.getDropdownId(dropdown)}"]`) as HTMLElement;
      if (button) {
        button.focus();
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateDropdown(dropdown, 'down');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateDropdown(dropdown, 'up');
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.focusDropdownItem(dropdown, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      const items = this.getDropdownItems(dropdown);
      this.focusDropdownItem(dropdown, items.length - 1);
    } else if (event.key === 'Tab') {
      // Allow tab to close dropdown and move focus
      this.closeAllDropdowns();
    }
  }

  private navigateDropdown(dropdown: 'department' | 'city' | 'employmentType' | 'workMode', direction: 'up' | 'down'): void {
    const items = this.getDropdownItems(dropdown);
    if (items.length === 0) return;

    let currentIndex = this.activeDescendantIndex[dropdown];
    if (currentIndex === -1) {
      currentIndex = 0;
    }

    if (direction === 'down') {
      currentIndex = (currentIndex + 1) % items.length;
    } else {
      currentIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    }

    this.focusDropdownItem(dropdown, currentIndex);
  }

  private focusDropdownItem(dropdown: 'department' | 'city' | 'employmentType' | 'workMode', index: number): void {
    const items = this.getDropdownItems(dropdown);
    if (index < 0 || index >= items.length) return;

    // Remove tabindex from all items
    items.forEach(item => {
      item.setAttribute('tabindex', '-1');
    });

    // Set tabindex on focused item
    const targetItem = items[index] as HTMLElement;
    targetItem.setAttribute('tabindex', '0');
    targetItem.focus();
    this.activeDescendantIndex[dropdown] = index;
  }

  private getDropdownItems(dropdown: 'department' | 'city' | 'employmentType' | 'workMode'): NodeListOf<Element> {
    const listboxId = this.getDropdownId(dropdown);
    const listbox = document.getElementById(listboxId);
    if (!listbox) return document.querySelectorAll('.dropdown-item');
    return listbox.querySelectorAll('.dropdown-item');
  }

  private getDropdownId(dropdown: 'department' | 'city' | 'employmentType' | 'workMode'): string {
    const ids: { [key: string]: string } = {
      department: 'department-listbox',
      city: 'city-listbox',
      employmentType: 'employment-type-listbox',
      workMode: 'work-mode-listbox'
    };
    return ids[dropdown];
  }

  private isDropdownOpen(dropdown: 'department' | 'city' | 'employmentType' | 'workMode'): boolean {
    switch (dropdown) {
      case 'department':
        return this.isDepartmentOpen;
      case 'city':
        return this.isCityOpen;
      case 'employmentType':
        return this.isEmploymentTypeOpen;
      case 'workMode':
        return this.isWorkModeOpen;
    }
  }

  getActiveDescendantId(dropdown: 'department' | 'city' | 'employmentType' | 'workMode'): string | null {
    if (!this.isDropdownOpen(dropdown)) return null;
    const index = this.activeDescendantIndex[dropdown];
    if (index === -1) return null;

    const prefix: { [key: string]: string } = {
      department: 'dept-option-',
      city: 'city-option-',
      employmentType: 'employment-type-option-',
      workMode: 'work-mode-option-'
    };

    if (index === 0) {
      const allOptionIds: { [key: string]: string } = {
        department: 'dept-option-all',
        city: 'city-option-all',
        employmentType: 'employment-type-option-all',
        workMode: 'work-mode-option-all'
      };
      return allOptionIds[dropdown];
    }

    return prefix[dropdown] + (index - 1);
  }

  private closeAllDropdowns(): void {
    this.isDepartmentOpen = false;
    this.isCityOpen = false;
    this.isEmploymentTypeOpen = false;
    this.isWorkModeOpen = false;
    // Reset active descendant indices
    Object.keys(this.activeDescendantIndex).forEach(key => {
      this.activeDescendantIndex[key] = -1;
    });
  }

  jobOpenings: JobOpening[] = [];

  get filteredJobOpenings(): JobOpening[] {
    return this.jobOpenings.filter(job => {
      return (!this.selectedDepartment || job.department === this.selectedDepartment) &&
        (!this.selectedCity || job.location.includes(this.selectedCity)) &&
        (!this.selectedEmploymentType || job.employmentType === this.selectedEmploymentType) &&
        (!this.selectedWorkMode || job.workMode === this.selectedWorkMode);
    });
  }

  get uniqueDepartments(): string[] {
    if (!this.jobOpenings || this.jobOpenings.length === 0) {
      return [];
    }
    return Array.from(new Set(this.jobOpenings.map(job => job.department))).sort();
  }

  get uniqueCities(): string[] {
    if (!this.jobOpenings || this.jobOpenings.length === 0) {
      return [];
    }
    const cities = this.jobOpenings
      .map(job => job.location.split(',')[0].trim())
      .filter((city, index, self) => self.indexOf(city) === index)
      .sort();
    return cities;
  }

  get uniqueEmploymentTypes(): string[] {
    if (!this.jobOpenings || this.jobOpenings.length === 0) {
      return [];
    }
    return Array.from(new Set(this.jobOpenings.map(job => job.employmentType))).sort();
  }

  get uniqueWorkModes(): string[] {
    if (!this.jobOpenings || this.jobOpenings.length === 0) {
      return [];
    }
    return Array.from(new Set(this.jobOpenings.map(job => job.workMode))).sort();
  }

  // Expose Math to template
  Math = Math;



  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadJobListings(page, this.itemsPerPage);
      // Scroll to top of job listings
      const jobListingsSection = document.querySelector('.job-listings-section');
      if (jobListingsSection) {
        jobListingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /**
   * Get array of page numbers to display
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5; // Show max 5 page numbers

    if (this.totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisible - 1);

      // Adjust start if we're near the end
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  /**
   * Check if page number should be shown
   */
  shouldShowPageNumber(page: number): boolean {
    const pages = this.getPageNumbers();
    return pages.includes(page);
  }

  /**
   * Retry loading job listings after an error
   */
  retryLoadJobListings(): void {
    this.errorMessage = '';
    this.loadJobListings(this.currentPage, this.itemsPerPage);
  }
}
