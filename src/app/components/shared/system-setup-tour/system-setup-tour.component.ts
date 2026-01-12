import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ISystemSetupStepItem, SystemSetupService } from 'app/core/services/main/system-setup.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-system-setup-tour',
  standalone: true,
  imports: [],
  templateUrl: './system-setup-tour.component.html',
  styleUrls: ['./system-setup-tour.component.css'],
})
export class SystemSetupTourComponent implements OnInit, OnDestroy {
  private readonly tourDoneKey = 'system_setup_tour_done';
  private readonly tourCompletedKey = 'system_setup_tour_completed_steps';
  private readonly tourCurrentKey = 'system_setup_tour_current_step';
  private destroy$ = new Subject<void>();

  isLoading = true;
  error: string | null = null;
  items: ISystemSetupStepItem[] = [];
  currentStepIndex = 0;
  isOverlayOpen = false;
  lastCreatedModule: string | null = null;

  // Celebration properties
  isCelebrating = false;
  celebrationMessage: string = '';
  celebrationStep: ISystemSetupStepItem | null = null;

  constructor(private systemSetupService: SystemSetupService, private router: Router) { }

  ngOnInit(): void {
    this.load();
    this.setupReactiveUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get total(): number {
    return this.items.length;
  }

  get progressPercent(): number {
    if (this.total <= 0) return 0;
    return Math.round((this.completedCount / this.total) * 100);
  }

  get allStepsCompleted(): boolean {
    return false;
    // return this.items.length > 0 && this.items.every(item => item.checked === true);
  }

  isStepRecentlyCompleted(step: ISystemSetupStepItem): boolean {
    return this.lastCreatedModule !== null &&
      step.title.toLowerCase().includes(this.lastCreatedModule.toLowerCase()) &&
      this.isStepCompleted(step);
  }

  private setupReactiveUpdates(): void {
    // Listen for module changes and auto-refresh
    this.systemSetupService.moduleChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(moduleName => {
        if (moduleName) {
          this.lastCreatedModule = moduleName;
          // Show a subtle notification that the step was updated
          console.log(`✅ Item created in ${moduleName}! Refreshing system setup...`);
        }
      });

    // Listen for system setup data changes
    this.systemSetupService.systemSetup$
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        if (response?.data?.list_items) {
          this.items = [...(response.data.list_items || [])].sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
          this.syncIndexFromStorage();
        }
      });
  }

  toggleOverlay(): void {
    this.isOverlayOpen = !this.isOverlayOpen;
  }

  closeOverlay(): void {
    this.isOverlayOpen = false;
  }

  /**
   * Show celebration for a completed step with message
   * This method is called externally after successful module item creation
   */
  showCelebration(moduleName: string): void {
    // Find the step that was just completed
    const completedStep = this.items.find(item =>
      item.title.toLowerCase().includes(moduleName.toLowerCase())
    );

    if (!completedStep) return;

    // Set celebration properties
    this.celebrationStep = completedStep;
    this.celebrationMessage = this.getMessage(completedStep);

    // Show celebration animation
    this.isCelebrating = true;

    // Open overlay to show the celebration
    this.isOverlayOpen = true;

    // Mark step as completed if not already
    const completed = new Set(this.completedSteps);
    if (!completed.has(completedStep.step)) {
      completed.add(completedStep.step);
      this.completedSteps = Array.from(completed);
    }

    // Auto-navigate to next step after 3 seconds
    setTimeout(() => {
      this.navigateToNextStep();
      this.isCelebrating = false;
      this.celebrationStep = null;
    }, 3000);
  }

  private navigateToNextStep(): void {
    const completed = new Set(this.completedSteps);
    const nextIncompleteIndex = this.items.findIndex(item => !completed.has(item.step));

    if (nextIncompleteIndex >= 0) {
      this.currentStepIndex = nextIncompleteIndex;
      this.currentStepStored = this.items[nextIncompleteIndex].step;
    } else {
      // All steps completed - finish tour
      this.done = true;
      this.currentStepStored = null;
      this.isOverlayOpen = false;
    }
  }

  private get done(): boolean {
    return localStorage.getItem(this.tourDoneKey) === 'true';
  }

  private set done(v: boolean) {
    localStorage.setItem(this.tourDoneKey, v ? 'true' : 'false');
  }

  private get completedSteps(): number[] {
    try {
      const raw = localStorage.getItem(this.tourCompletedKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'number') : [];
    } catch {
      return [];
    }
  }

  private set completedSteps(steps: number[]) {
    const unique = Array.from(new Set(steps)).sort((a, b) => a - b);
    localStorage.setItem(this.tourCompletedKey, JSON.stringify(unique));
  }

  private get currentStepStored(): number | null {
    const raw = localStorage.getItem(this.tourCurrentKey);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }

  private set currentStepStored(step: number | null) {
    if (step === null) {
      localStorage.removeItem(this.tourCurrentKey);
      return;
    }
    localStorage.setItem(this.tourCurrentKey, String(step));
  }

  get completedCount(): number {
    return this.items.filter((i) => i.checked === true).length;
  }

  get current(): ISystemSetupStepItem | null {
    if (!this.items.length) return null;
    return this.items[Math.min(Math.max(this.currentStepIndex, 0), this.items.length - 1)] || null;
  }

  get visible(): boolean {
    // Hide if all steps are completed based on API response
    if (this.allStepsCompleted) return false;
    // Show arrow button when not done and has items
    return !this.done && this.total > 0;
  }

  close(): void {
    this.isOverlayOpen = false;
  }


  prev(): void {
    this.currentStepIndex = Math.max(0, this.currentStepIndex - 1);
    const c = this.current;
    const completed = new Set(this.completedSteps);
    if (c && !completed.has(c.step)) this.currentStepStored = c.step;
  }

  next(): void {
    const c = this.current;
    if (!c) return;

    const completed = new Set(this.completedSteps);
    completed.add(c.step);
    this.completedSteps = Array.from(completed);

    const nextIdx = this.items.findIndex((x, idx) => idx > this.currentStepIndex && !completed.has(x.step));
    if (nextIdx >= 0) {
      this.currentStepIndex = nextIdx;
      this.currentStepStored = this.items[nextIdx].step;
      return;
    }

    const anyIncomplete = this.items.findIndex((x) => !completed.has(x.step));
    if (anyIncomplete >= 0) {
      this.currentStepIndex = anyIncomplete;
      this.currentStepStored = this.items[anyIncomplete].step;
      return;
    }

    // finished
    this.done = true;
    this.currentStepStored = null;
    this.isOverlayOpen = false;
  }

  goToStep(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.items.length) {
      this.currentStepIndex = stepIndex;
      const step = this.items[stepIndex];
      if (step) {
        this.currentStepStored = step.step;
      }
    }
  }

  isStepCompleted(step: ISystemSetupStepItem): boolean {
    // Use API response checked status instead of local storage
    return step.checked === true;
  }

  isStepCurrent(stepIndex: number): boolean {
    return stepIndex === this.currentStepIndex;
  }

  isStepEnabled(stepIndex: number): boolean {
    // Current step is always enabled, completed steps are enabled, next incomplete step is enabled
    if (stepIndex === this.currentStepIndex) return true;
    if (this.isStepCompleted(this.items[stepIndex])) return true;

    // Check if this is the next incomplete step based on API response
    const firstIncompleteIndex = this.items.findIndex(item => item.checked === false);

    return stepIndex === firstIncompleteIndex;
  }

  openModule(): void {
    const c = this.current;
    if (!c) return;
    const route = this.getStepRoute(c.title);
    if (!route) return;
    this.router.navigateByUrl(route);
    this.isOverlayOpen = false;
  }


  getMessage(item: ISystemSetupStepItem): string {
    // Only show messages for completed steps (checked: true)
    if (!item.checked) {
      return 'Not completed yet';
    }

    const lang = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
    const msg = item?.message?.[lang] || item?.message?.en || item?.message?.ar;
    return msg || 'Completed';
  }

  private load(): void {
    // Check localStorage flag to skip API call if all steps completed
    // const allDoneFlag = localStorage.getItem('system_setup_tour_all_done');
    // if (allDoneFlag === 'true') {
    //   this.isLoading = false;
    //   this.error = null;
    //   this.items = [];
    //   return;
    // }

    this.isLoading = true;
    this.error = null;

    this.systemSetupService.getSystemSetup().subscribe({
      next: (res) => {
        this.items = [...(res?.data?.list_items || [])].sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
        this.isLoading = false;
        this.syncIndexFromStorage();
        // If all items are checked, set the flag in localStorage
        if (this.items.length > 0 && this.items.every(item => item.checked === true)) {
          localStorage.setItem('system_setup_tour_all_done', 'true');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.items = [];
        this.error = err?.error?.details || 'Failed to load system setup.';
      },
    });
  }


  private syncIndexFromStorage(): void {
    if (!this.items.length) {
      this.currentStepIndex = 0;
      return;
    }

    // Find first uncompleted step based on API response (checked: false)
    const firstIncomplete = this.items.findIndex((i) => i.checked === false);
    this.currentStepIndex = firstIncomplete >= 0 ? firstIncomplete : 0;

    const c = this.current;
    if (c && !c.checked) {
      this.currentStepStored = c.step;
    }
  }

  private getStepRoute(title: string): string | null {
    const t = (title || '').trim().toLowerCase();
    if (t === 'goals') return '/goals';
    if (t === 'departments') return '/departments';
    if (t === 'branches') return '/branches';
    if (t === 'job titles') return '/jobs';
    if (t === 'work schedules') return '/schedule';
    if (t === 'employees') return '/employees';
    return null;
  }
}

