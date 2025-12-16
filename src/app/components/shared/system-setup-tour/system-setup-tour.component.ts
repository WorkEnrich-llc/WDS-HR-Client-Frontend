import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ISystemSetupStepItem, SystemSetupService } from 'app/core/services/main/system-setup.service';

@Component({
  selector: 'app-system-setup-tour',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './system-setup-tour.component.html',
  styleUrls: ['./system-setup-tour.component.css'],
})
export class SystemSetupTourComponent implements OnInit, OnDestroy {
  private readonly tourDoneKey = 'system_setup_tour_done';
  private readonly tourCompletedKey = 'system_setup_tour_completed_steps';
  private readonly tourCurrentKey = 'system_setup_tour_current_step';

  isLoading = true;
  error: string | null = null;
  items: ISystemSetupStepItem[] = [];
  index = 0;

  targetRect: { top: number; left: number; width: number; height: number; right: number; bottom: number } | null = null;
  cardPos: { top: number; left: number; placement: 'right' | 'left' } = { top: 0, left: 0, placement: 'right' };

  private anchorRetryCount = 0;
  private handleReposition?: () => void;
  isSwitching = false;
  private switchingTimer?: number;

  constructor(private systemSetupService: SystemSetupService, private router: Router) { }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    if (this.handleReposition) {
      window.removeEventListener('resize', this.handleReposition);
      window.removeEventListener('scroll', this.handleReposition, true);
    }
    if (this.switchingTimer) window.clearTimeout(this.switchingTimer);
  }

  get total(): number {
    return this.items.length;
  }

  get progressPercent(): number {
    if (this.total <= 0) return 0;
    return Math.round((this.completedCount / this.total) * 100);
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
    const completed = new Set(this.completedSteps);
    return this.items.filter((i) => completed.has(i.step)).length;
  }

  get current(): ISystemSetupStepItem | null {
    if (!this.items.length) return null;
    return this.items[Math.min(Math.max(this.index, 0), this.items.length - 1)] || null;
  }

  get visible(): boolean {
    // Only truly hide when user chose "Skip all"
    if (this.done) return false;
    return this.isLoading || !!this.error || this.total > 0;
  }

  close(): void {
    // Close only for now (no session storage); user can refresh to see again unless they skipped all.
    this.done = true;
  }

  skipAll(): void {
    this.done = true;
    this.currentStepStored = null;
  }

  prev(): void {
    this.triggerSwitchAnim();
    this.index = Math.max(0, this.index - 1);
    const c = this.current;
    const completed = new Set(this.completedSteps);
    if (c && !completed.has(c.step)) this.currentStepStored = c.step;
    setTimeout(() => this.ensureAnchor(), 0);
  }

  next(): void {
    const c = this.current;
    if (!c) return;
    this.triggerSwitchAnim();

    const completed = new Set(this.completedSteps);
    completed.add(c.step);
    this.completedSteps = Array.from(completed);

    const nextIdx = this.items.findIndex((x, idx) => idx > this.index && !completed.has(x.step));
    if (nextIdx >= 0) {
      this.index = nextIdx;
      this.currentStepStored = this.items[nextIdx].step;
      setTimeout(() => this.ensureAnchor(), 0);
      return;
    }

    const anyIncomplete = this.items.findIndex((x) => !completed.has(x.step));
    if (anyIncomplete >= 0) {
      this.index = anyIncomplete;
      this.currentStepStored = this.items[anyIncomplete].step;
      setTimeout(() => this.ensureAnchor(), 0);
      return;
    }

    // finished
    this.done = true;
    this.currentStepStored = null;
  }

  openModule(): void {
    const c = this.current;
    if (!c) return;
    const route = this.getStepRoute(c.title);
    if (!route) return;
    this.router.navigateByUrl(route);
  }

  private triggerSwitchAnim(): void {
    this.isSwitching = true;
    if (this.switchingTimer) window.clearTimeout(this.switchingTimer);
    this.switchingTimer = window.setTimeout(() => {
      this.isSwitching = false;
    }, 180);
  }

  getMessage(item: ISystemSetupStepItem): string {
    const lang = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
    const msg = item?.message?.[lang] || item?.message?.en || item?.message?.ar;
    return msg || (item.checked ? 'Completed' : 'Not completed yet');
  }

  private load(): void {
    this.isLoading = true;
    this.error = null;

    this.systemSetupService.getSystemSetup().subscribe({
      next: (res) => {
        this.items = [...(res?.data?.list_items || [])].sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
        this.isLoading = false;
        this.syncIndexFromStorage();
        this.installRepositionHandlers();
        setTimeout(() => this.ensureAnchor(), 0);
      },
      error: (err) => {
        this.isLoading = false;
        this.items = [];
        this.error = err?.error?.details || 'Failed to load system setup.';
      },
    });
  }

  private installRepositionHandlers(): void {
    if (this.handleReposition) return;
    this.handleReposition = () => this.ensureAnchor();
    window.addEventListener('resize', this.handleReposition);
    window.addEventListener('scroll', this.handleReposition, true);
  }

  private syncIndexFromStorage(): void {
    if (!this.items.length) {
      this.index = 0;
      return;
    }
    const completed = new Set(this.completedSteps);
    const stored = this.currentStepStored;
    if (stored !== null) {
      const idx = this.items.findIndex((i) => i.step === stored);
      if (idx >= 0 && !completed.has(stored)) {
        this.index = idx;
        return;
      }
    }
    const firstIncomplete = this.items.findIndex((i) => !completed.has(i.step));
    this.index = firstIncomplete >= 0 ? firstIncomplete : 0;
    const c = this.current;
    if (c && !completed.has(c.step)) this.currentStepStored = c.step;
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

  private getStepTargetKey(title: string): string {
    const t = (title || '').trim().toLowerCase();
    if (t === 'goals') return 'goals';
    if (t === 'departments') return 'departments';
    if (t === 'branches') return 'branches';
    if (t === 'job titles') return 'job-titles';
    if (t === 'work schedules') return 'work-schedules';
    if (t === 'employees') return 'employees';
    return 'od';
  }

  private openAccordionForStep(title: string): void {
    const t = (title || '').trim().toLowerCase();
    const collapseId =
      t === 'work schedules' ? 'collapseThree' : t === 'employees' ? 'collapseTwo' : 'collapseOne';
    const btn = document.querySelector(`[data-bs-target="#${collapseId}"]`) as HTMLElement | null;
    const panel = document.querySelector(`#${collapseId}`) as HTMLElement | null;
    if (btn && panel && !panel.classList.contains('show')) {
      btn.click(); // let Bootstrap handle collapse state
    }
  }

  private updateAnchor(): void {
    const c = this.current;
    if (!c) {
      this.targetRect = null;
      return;
    }

    this.openAccordionForStep(c.title);

    const key = this.getStepTargetKey(c.title);
    const el = document.querySelector(`[data-system-setup-target="${key}"]`) as HTMLElement | null;
    if (!el) {
      this.targetRect = null;
      return;
    }

    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    this.targetRect = { top: r.top, left: r.left, width: r.width, height: r.height, right: r.right, bottom: r.bottom };

    const margin = 14;
    const cardWidth = 340;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let placement: 'right' | 'left' = 'right';
    let left = r.right + margin;
    if (left + cardWidth > viewportW - 12) {
      placement = 'left';
      left = Math.max(12, r.left - margin - cardWidth);
    }

    const desiredTop = r.top - 10;
    const top = Math.min(Math.max(12, desiredTop), Math.max(12, viewportH - 12 - 240));
    this.cardPos = { top, left, placement };
  }

  private ensureAnchor(): void {
    this.updateAnchor();
    if (this.targetRect) {
      this.anchorRetryCount = 0;
      return;
    }
    if (this.anchorRetryCount >= 12) return;
    this.anchorRetryCount += 1;
    setTimeout(() => this.ensureAnchor(), 150);
  }
}

