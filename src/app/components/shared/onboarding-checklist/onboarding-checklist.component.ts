import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from '@angular/core';

export interface OnboardingListItem {
  title: string;
  status: boolean;
}

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-checklist.component.html',
  styleUrl: './onboarding-checklist.component.css'
})
export class OnboardingChecklistComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() checklistItems: OnboardingListItem[] = [];
  @Input() showBadge: boolean = true;
  @Input() completed: number = 0;
  @Input() total: number = 0;
  @Input() loadingItemTitle: string | null = null;
  @Input() allowToggle: boolean = false; // Allow toggling completed items (default: false for backward compatibility)
  @Input() disabledItemTitles: string[] = []; // Titles of items that should not be clickable
  @Input() showAutoSaveHint: boolean = true; // Show auto-save hint when allowToggle is true
  @Input() readOnly: boolean = false; // Make the entire checklist read-only (no clicks allowed)
  @Output() close = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<OnboardingListItem>();
  @Output() badgeClick = new EventEmitter<void>();

  isAnimatingOut: boolean = false;
  isReadOnlyMode: boolean = false; // Flag to ensure read-only state is set immediately
  private isProcessingClick: boolean = false;
  private expectedStatusChanges: Map<string, boolean> = new Map(); // Track expected status for each item
  private previousChecklistItems: OnboardingListItem[] = []; // Track previous items to detect actual changes

  ngOnInit(): void {
    // Set read-only flag as fallback (ngOnChanges should have already set it)
    // This ensures it's set even if ngOnChanges didn't run
    this.isReadOnlyMode = this.readOnly;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Always update read-only flag in ngOnChanges (runs before ngOnInit and on every input change)
    // This ensures the flag is set immediately when the component receives inputs
    this.isReadOnlyMode = this.readOnly;

    // Unified handler: Keep rows disabled until BOTH:
    // 1. loadingItemTitle is null (API completed)
    // 2. checklistItems has the expected status (status actually updated)
    // This prevents flickering and ensures smooth UI updates

    // Update previous items tracking
    if (changes['checklistItems']) {
      this.previousChecklistItems = changes['checklistItems'].previousValue
        ? [...(changes['checklistItems'].previousValue as OnboardingListItem[])]
        : [...this.checklistItems];
    }

    // Only process if we have expected changes to track
    if (this.expectedStatusChanges.size === 0) {
      // No expected changes, but if loading just completed, clear processing flag
      if (changes['loadingItemTitle']) {
        const currentValue = changes['loadingItemTitle'].currentValue;
        if (currentValue === null) {
          this.isProcessingClick = false;
        }
      }
      return;
    }

    // Only proceed if loading is complete (null)
    if (this.loadingItemTitle !== null) {
      return; // Still loading, wait
    }

    // Loading is complete - now verify that checklistItems has the expected status
    // Only clear when status actually matches expected OR when status has changed (update completed)
    const itemsToRemove: string[] = [];

    for (const [itemTitle, expectedStatus] of this.expectedStatusChanges.entries()) {
      const actualItem = this.checklistItems.find(item => item.title === itemTitle);
      const previousItem = this.previousChecklistItems.find(item => item.title === itemTitle);

      if (actualItem) {
        // Check if status matches expected (success case)
        if (actualItem.status === expectedStatus) {
          // Success: status matches expected and loading is complete
          itemsToRemove.push(itemTitle);
        } else if (previousItem && previousItem.status !== actualItem.status) {
          // Status changed from previous but doesn't match expected
          // This means the update completed (status changed) but was reverted (error case)
          // Since the update is complete (status changed), clear it
          itemsToRemove.push(itemTitle);
        }
        // If status hasn't changed from previous, keep waiting
        // This ensures we wait for the actual status update before enabling rows
      } else {
        // Item not found - clear it (edge case)
        itemsToRemove.push(itemTitle);
      }
    }

    // Remove only items that have confirmed status updates
    itemsToRemove.forEach(title => this.expectedStatusChanges.delete(title));

    // If no more expected changes, clear processing flag
    if (this.expectedStatusChanges.size === 0) {
      this.isProcessingClick = false;
    }
  }

  isItemLoading(itemTitle: string): boolean {
    return this.loadingItemTitle === itemTitle;
  }

  // Expose Math to template
  Math = Math;

  // Circle progress calculations
  private readonly circleRadius = 30;
  private readonly circleCircumference = 2 * Math.PI * this.circleRadius;

  getCircleCircumference(): number {
    return this.circleCircumference;
  }

  getCircleOffset(): number {
    if (this.total === 0) return this.circleCircumference;
    const progress = (this.completed / this.total) * 100;
    return this.circleCircumference - (progress / 100 * this.circleCircumference);
  }

  closeModal(): void {
    this.isAnimatingOut = true;
    setTimeout(() => {
      this.isAnimatingOut = false;
      this.close.emit();
    }, 300);
  }

  onItemClick(item: OnboardingListItem, event: Event): void {
    // If readOnly is true or flag is set, prevent all clicks
    if (this.isReadOnlyMode || this.readOnly) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // Prevent multiple simultaneous clicks
    if (this.isProcessingClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // Don't emit if any item is currently loading - stop event propagation
    if (this.loadingItemTitle !== null) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // Don't emit if item is disabled - stop event propagation
    if (this.disabledItemTitles.includes(item.title)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // If allowToggle is true, allow clicking any item; otherwise only pending items
    if (this.allowToggle || !item.status) {
      // Set processing flag immediately to prevent other clicks
      this.isProcessingClick = true;

      // Track the expected status change (toggle the current status)
      const expectedStatus = !item.status;
      this.expectedStatusChanges.set(item.title, expectedStatus);

      // Remove focus from the clicked element
      const target = event.target as HTMLElement;
      const itemElement = target.closest('.onboarding-checklist-item') as HTMLElement;
      if (itemElement) {
        itemElement.blur();
      }

      // Emit the event - parent will set loadingItemTitle and update checklistItems
      this.itemClick.emit(item);

      // Note: isProcessingClick will be cleared automatically when:
      // 1. loadingItemTitle changes to null (API completed)
      // 2. AND checklistItems reflects the expected status change
      // This ensures rows stay disabled until the status is actually updated
    } else {
      // Prevent click if item doesn't meet clickable criteria
      event.preventDefault();
      event.stopPropagation();
    }
  }

  isItemDisabled(item: OnboardingListItem): boolean {
    // Disable item if:
    // 1. readOnly is true (entire checklist is view-only) - use flag for immediate effect
    // 2. It's in the disabled list
    // 3. Any item is currently loading
    // 4. Processing a click (waiting for status update)
    // 5. There are pending expected status changes (waiting for checklistItems to update)
    return this.isReadOnlyMode
      || this.readOnly
      || this.disabledItemTitles.includes(item.title)
      || this.loadingItemTitle !== null
      || this.isProcessingClick
      || this.expectedStatusChanges.size > 0;
  }

  onBadgeClick(): void {
    this.badgeClick.emit();
  }
}

