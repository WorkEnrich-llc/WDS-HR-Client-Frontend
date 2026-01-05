import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Theme Service for Client Job Board
 * 
 * This service manages the dynamic theme color for all client job board components.
 * The theme color is loaded from the company-settings API response (theme_color field).
 * 
 * Usage in components:
 * 1. Inject ThemeService: private themeService = inject(ThemeService);
 * 2. Subscribe to theme changes: this.themeService.themeColor$.subscribe(...)
 * 3. Or use CSS variable: var(--client-job-board-primary) in your CSS
 * 
 * The service automatically applies the theme to the document root as CSS variables:
 * - --client-job-board-primary: Main theme color
 * - --client-job-board-primary-light: Lighter variant
 * - --client-job-board-primary-dark: Darker variant
 */

/**
 * Theme color mapping based on the theme selector options
 * Maps theme color names to their hex values
 */
const THEME_COLOR_MAP: { [key: string]: string } = {
  'Blue': '#377afd',
  'Indigo': '#6366f1',
  'Cyan': '#06b6d4',
  'Green': '#10b981',
  'Yellow': '#f59e0b',
  'Red': '#ef4444',
  'Black': '#1f2937',
  'Grey': '#6b7280'
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeColorSubject = new BehaviorSubject<string>('#377afd'); // Default to Blue
  public themeColor$: Observable<string> = this.themeColorSubject.asObservable();

  constructor() {
    // Initialize with default theme
    this.setThemeColor('#377afd');
  }

  /**
   * Get hex color from theme color name or value
   * @param themeColor Theme color name (e.g., 'Blue') or hex value
   * @returns Hex color value
   */
  private getThemeColorHex(themeColor: string): string {
    if (!themeColor) {
      console.warn('Theme color is empty, using default Blue');
      return '#377afd'; // Default to Blue
    }

    // If it's already a hex color, return it
    if (themeColor.startsWith('#')) {
      return themeColor;
    }

    // Map theme color name to hex value
    const normalizedName = themeColor.trim();
    const mappedColor = THEME_COLOR_MAP[normalizedName] || THEME_COLOR_MAP[normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1).toLowerCase()];

    if (mappedColor) {
      return mappedColor;
    }

    console.warn('Theme color not found in map:', normalizedName, 'using default Blue');
    return '#377afd';
  }

  /**
   * Set the theme color and apply it to the document root
   * @param themeColor Theme color name or hex value from API
   */
  setThemeColor(themeColor: string): void {
    const hexColor = this.getThemeColorHex(themeColor);
    this.themeColorSubject.next(hexColor);
    this.applyThemeToDocument(hexColor);
  }

  /**
   * Get current theme color
   */
  getThemeColor(): string {
    return this.themeColorSubject.value;
  }

  /**
   * Apply theme color to document root as CSS variable
   * This makes it available to all components
   */
  private applyThemeToDocument(hexColor: string): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      // Set primary color
      root.style.setProperty('--client-job-board-primary', hexColor);

      // Calculate and set lighter/darker variants
      const lighterColor = this.lightenColor(hexColor, 0.2);
      const darkerColor = this.darkenColor(hexColor, 0.2);

      root.style.setProperty('--client-job-board-primary-light', lighterColor);
      root.style.setProperty('--client-job-board-primary-dark', darkerColor);
    }
  }

  /**
   * Lighten a hex color
   */
  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + Math.floor((255 - (num >> 16)) * percent));
    const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.floor((255 - ((num >> 8) & 0x00FF)) * percent));
    const b = Math.min(255, (num & 0x0000FF) + Math.floor((255 - (num & 0x0000FF)) * percent));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Darken a hex color
   */
  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.floor((num >> 16) * (1 - percent));
    const g = Math.floor(((num >> 8) & 0x00FF) * (1 - percent));
    const b = Math.floor((num & 0x0000FF) * (1 - percent));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}
