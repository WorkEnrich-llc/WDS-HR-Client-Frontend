import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

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
export class OnboardingChecklistComponent {
  @Input() isOpen: boolean = false;
  @Input() checklistItems: OnboardingListItem[] = [];
  @Input() showBadge: boolean = true;
  @Input() completed: number = 0;
  @Input() total: number = 0;
  @Input() loadingItemTitle: string | null = null;
  @Input() allowToggle: boolean = false; // Allow toggling completed items (default: false for backward compatibility)
  @Input() disabledItemTitles: string[] = []; // Titles of items that should not be clickable
  @Input() showAutoSaveHint: boolean = true; // Show auto-save hint when allowToggle is true
  @Output() close = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<OnboardingListItem>();
  @Output() badgeClick = new EventEmitter<void>();

  isAnimatingOut: boolean = false;

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
    // Don't emit if item is disabled
    if (this.disabledItemTitles.includes(item.title)) {
      return;
    }
    // If allowToggle is true, allow clicking any item; otherwise only pending items
    if (this.allowToggle || !item.status) {
      // Remove focus from the clicked element
      const target = event.target as HTMLElement;
      const itemElement = target.closest('.onboarding-checklist-item') as HTMLElement;
      if (itemElement) {
        itemElement.blur();
      }
      this.itemClick.emit(item);
    }
  }

  isItemDisabled(item: OnboardingListItem): boolean {
    return this.disabledItemTitles.includes(item.title);
  }

  onBadgeClick(): void {
    this.badgeClick.emit();
  }
}

