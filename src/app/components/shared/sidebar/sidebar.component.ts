import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith, switchMap, catchError } from 'rxjs/operators';
import { fromEvent, of } from 'rxjs';

import { OverlayFilterBoxComponent } from '../overlay-filter-box/overlay-filter-box.component';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { NotificationsService } from 'app/core/services/admin-settings/notifications/notifications.service';
import { LanguageService } from 'app/core/services/language/language.service';
import { LayoutService } from 'app/core/services/layout/layout.service';

import { NAV_SECTIONS } from './sidebar-nav.data';
import { NavSection, NavItem, SideNavToggle } from './models';
import { SafeHtmlPipe } from './safe-html.pipe';
import {
  DASHBOARD_ICON,
  PROFILE_ICON,
  NOTIFICATIONS_ICON,
  MENU_ICON,
  LANGUAGE_ICON,
  LANG_ENGLISH_ICON,
  LANG_ARABIC_ICON,
  LANG_OPTION_CHECK_ICON,
} from './icons';

export type { SideNavToggle };

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, OverlayFilterBoxComponent, NgClass, SafeHtmlPipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit, AfterViewInit {
  // ── Injections ───────────────────────────────────────────────────────────
  private router = inject(Router);
  private subService = inject(SubscriptionService);
  private notificationsService = inject(NotificationsService);
  private languageService = inject(LanguageService);
  private layoutService = inject(LayoutService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);

  // ── ViewChildren ─────────────────────────────────────────────────────────
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('accordionWrapper') accordionWrapper!: ElementRef;

  // ── Outputs ──────────────────────────────────────────────────────────────
  @Output() onToggleSideNav = new EventEmitter<SideNavToggle>();

  // ── Static nav data & icons exposed to template ──────────────────────────
  readonly navSections = NAV_SECTIONS;
  readonly DASHBOARD_ICON = DASHBOARD_ICON;
  readonly PROFILE_ICON = PROFILE_ICON;
  readonly NOTIFICATIONS_ICON = NOTIFICATIONS_ICON;
  readonly MENU_ICON = MENU_ICON;
  readonly LANGUAGE_ICON = LANGUAGE_ICON;
  readonly LANG_ENGLISH_ICON = LANG_ENGLISH_ICON;
  readonly LANG_ARABIC_ICON = LANG_ARABIC_ICON;
  readonly LANG_OPTION_CHECK_ICON = LANG_OPTION_CHECK_ICON;

  // ── Reactive state (link to LayoutService signals) ────────────────────────
  readonly collapsed = this.layoutService.isSidebarCollapsed;
  readonly screenWidth = this.layoutService.screenWidth;
  readonly showText = signal(this.layoutService.screenWidth() > 768);
  
  readonly currentLang = signal(this.languageService.getLanguage());

  // Language dropdown (fixed to viewport so it is not clipped by .sidenav overflow)
  readonly langDropdownOpen = signal(false);
  /** Language button (click target) */
  private langDropdownAnchor: HTMLElement | null = null;

  // Notification state
  readonly isNotificationOpen = signal(false);
  readonly hasNewNotifications = signal(true);
  readonly notifications = signal<any[]>([]);
  readonly isLoadingNotifications = signal(false);

  // Company branding
  readonly logo = signal<string | null>(null);
  readonly companyName = signal<string | null>(null);

  // ── Translations (assets/i18n/{lang}/sidebar.json) ────────────────────────
  private readonly sidebarI18n = toSignal(
    toObservable(this.currentLang).pipe(
      switchMap(lang =>
        this.http
          .get<Record<string, unknown>>(`./assets/i18n/${lang}/sidebar.json`)
          .pipe(catchError(() => of({} as Record<string, unknown>))),
      ),
    ),
    { initialValue: {} as Record<string, unknown> },
  );

  readonly t = computed<Record<string, any>>(() => this.sidebarI18n() as Record<string, any>);

  // ── Observables → signals ─────────────────────────────────────────────────
  readonly features = toSignal(
    this.subService.allFeatures$.pipe(
      filter((f): f is Record<string, boolean> => !!f && Object.keys(f).length > 0),
    ),
    { initialValue: {} as Record<string, boolean> },
  );

  readonly currentRoute = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  // ── Computed ─────────────────────────────────────────────────────────────
  readonly activeAccordionId = computed(() =>
    this.getAccordionIdForRoute(this.currentRoute() ?? ''),
  );

  constructor() {
    // Keep panel + section-active in sync on every navigation (including sub-routes where
    // activeAccordionId stays the same string — computed would not notify dependents alone).
    effect(() => {
      void this.currentRoute();
      const accordionId = this.activeAccordionId();
      Promise.resolve().then(() => this.openAccordion(accordionId));
    });

    // Keep showText in sync (300 ms delay on expand for CSS animation)
    effect(() => {
      const expanded = this.collapsed();
      if (expanded) {
        setTimeout(() => {
          this.showText.set(true);
          this.cdr.markForCheck();
        }, 350);
      } else {
        this.showText.set(false);
      }
    });

    // Mirror updates to legacy output for layout coordinator backwards compatibility
    effect(() => {
      this.onToggleSideNav.emit({ collapsed: this.collapsed(), screenWidth: this.screenWidth() });
    });
  }

  ngOnInit(): void {
    this.loadCompanyBranding();

    fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        filter(e => e.key === 'company_info' || e.key === null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadCompanyBranding());

    // Service now handles window resize directly
  }

  ngAfterViewInit(): void {
    this.overlay.onClose.subscribe(() => {
      this.isNotificationOpen.set(false);
      this.cdr.markForCheck();
    });
    this.openAccordion(this.activeAccordionId());
  }

  // ── Click-outside closes language dropdown ───────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('.lang-toggle-wrapper')) {
      this.langDropdownOpen.set(false);
      this.langDropdownAnchor = null;
    }
  }

  // ── Public helpers ────────────────────────────────────────────────────────

  isSectionVisible(section: NavSection): boolean {
    const f = this.features();
    return section.featureKeys.some(k => !!f[k]);
  }

  isItemVisible(item: NavItem): boolean {
    if (!item.featureKey) return true;
    return !!this.features()[item.featureKey];
  }

  isSectionActive(section: NavSection): boolean {
    return this.activeAccordionId() === section.collapseId;
  }

  /** Retrieve translated label for a section */
  sectionLabel(section: NavSection): string {
    return this.t()['sections']?.[section.labelKey] ?? section.label;
  }

  /** Retrieve translated label for an item */
  itemLabel(item: NavItem): string {
    return this.t()['items']?.[item.labelKey] ?? item.label;
  }

  /** Retrieve a translation string by dot-path e.g. 'nav.dashboard' */
  tr(path: string): string {
    const [group, key] = path.split('.');
    return this.t()?.[group]?.[key] ?? path;
  }

  // ── Toggle / collapse ─────────────────────────────────────────────────────

  toggleCollapse(): void {
    this.layoutService.toggleSidebar();
  }

  closeSidenav(): void {
    this.layoutService.closeSidebar();
  }

  // ── Language toggle ───────────────────────────────────────────────────────

  toggleLangDropdown(event: Event): void {
    event.stopPropagation();
    const opening = !this.langDropdownOpen();
    const btn = event.currentTarget as HTMLElement;
    const wrap = btn.closest('.lang-toggle-wrapper') as HTMLElement | null;

    if (opening && wrap) {
      this.langDropdownAnchor = btn;
      this.langDropdownOpen.set(true);
    } else {
      this.langDropdownOpen.set(false);
      this.langDropdownAnchor = null;
    }
  }

  // Layout logic moved to CSS absolute positioning

  selectLanguage(lang: 'en' | 'ar', event: Event): void {
    event.stopPropagation();
    this.languageService.setLanguage(lang);
    this.currentLang.set(lang);
    this.langDropdownOpen.set(false);
    this.langDropdownAnchor = null;
  }

  // ── Accordion management ──────────────────────────────────────────────────

  closeAllAccordions(): void {
    if (!this.accordionWrapper) return;
    const wrapper = this.accordionWrapper.nativeElement as HTMLElement;

    wrapper.querySelectorAll<HTMLElement>('.accordion-collapse.show').forEach(el => {
      el.classList.remove('show');
    });
    wrapper.querySelectorAll<HTMLElement>('.accordion-button').forEach(btn => {
      btn.classList.add('collapsed');
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  private openAccordion(targetId: string | null): void {
    if (!this.accordionWrapper) return;
    const wrapper = this.accordionWrapper.nativeElement as HTMLElement;

    if (!targetId) {
      this.closeAllAccordions();
      return;
    }

    this.closeAllAccordions();

    const panel = wrapper.querySelector<HTMLElement>(`#${targetId}`);
    const button = wrapper.querySelector<HTMLElement>(`[data-bs-target="#${targetId}"]`);

    if (panel && button) {
      panel.classList.add('show');
      button.classList.remove('collapsed');
      button.setAttribute('aria-expanded', 'true');
    }
  }

  /**
   * Resolves which accordion section owns the URL: item `route` prefix (child routes) first,
   * then `routePatterns` as path segments from the root (avoids loose substring false positives).
   */
  private getAccordionIdForRoute(rawUrl: string): string | null {
    const path = this.normalizeNavPath(rawUrl);
    for (const section of NAV_SECTIONS) {
      if (this.isRouteInSection(path, section)) {
        return section.collapseId;
      }
    }
    return null;
  }

  private normalizeNavPath(url: string): string {
    const raw = (url.split(/[?#]/)[0] || '/').trim();
    const withLead = raw.startsWith('/') ? raw : `/${raw}`;
    if (withLead.length > 1) {
      return withLead.replace(/\/+$/, '');
    }
    return withLead;
  }

  private isRouteInSection(path: string, section: NavSection): boolean {
    for (const item of section.items) {
      const base = this.normalizeNavPath(item.route);
      if (path === base || path.startsWith(`${base}/`)) {
        return true;
      }
    }
    for (const pattern of section.routePatterns) {
      if (this.pathStartsWithSegment(path, pattern)) {
        return true;
      }
    }
    return false;
  }

  /** True if path is `/segment` or `/segment/...` (case-insensitive segment). */
  private pathStartsWithSegment(path: string, segment: string): boolean {
    const seg = segment.trim().replace(/^\/+|\/+$/g, '');
    if (!seg) return false;
    const escaped = seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^/${escaped}(/|$)`, 'i').test(path);
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  handleNotificationClick(): void {
    this.closeAllAccordions();
    this.langDropdownOpen.set(false);

    if (this.isNotificationOpen()) {
      this.overlay.closeOverlay();
    } else {
      this.overlay.openOverlay();
      this.isNotificationOpen.set(true);
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.isLoadingNotifications.set(true);
    this.notificationsService.getNotifications().subscribe({
      next: response => {
        this.notifications.set(response?.data?.object_info?.list_items ?? []);
        this.isLoadingNotifications.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.notifications.set([]);
        this.isLoadingNotifications.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // ── Company branding ──────────────────────────────────────────────────────

  private loadCompanyBranding(): void {
    try {
      const raw = localStorage.getItem('company_info');
      if (raw) {
        const info = JSON.parse(raw);
        this.logo.set(info?.logo ?? null);
        this.companyName.set(info?.name ?? null);
      }
    } catch {
      this.logo.set(null);
      this.companyName.set(null);
    }
    this.cdr.markForCheck();
  }

  // ── Time helper ───────────────────────────────────────────────────────────

  getTimeAgo(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    const date = this.parseIsoToLocal(dateString);
    if (!date) return 'N/A';

    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 60) return 'Just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  private parseIsoToLocal(s: string): Date | null {
    try {
      const clean = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s)
        ? s
        : s.replace(/\.(\d+)$/, (_, f) => '.' + f.slice(0, 3)) + 'Z';
      const d = new Date(clean);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
}
