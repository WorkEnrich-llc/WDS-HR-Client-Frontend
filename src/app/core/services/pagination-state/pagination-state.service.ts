import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaginationStateService {

  private pages: Record<string, number> = {};

  // Store current page for a specific component
  setPage(moduleKey: string, page: number): void {
    this.pages[moduleKey] = page;
  }

  // Retrieve current page (default 1 if not stored)
  getPage(moduleKey: string): number {
    return this.pages[moduleKey] ?? 1;
  }

  // (Optional) clear one component’s page state
  clearPage(moduleKey: string): void {
    delete this.pages[moduleKey];
  }

  // (Optional) clear all stored pagination
  clearAll(): void {
    this.pages = {};
  }
}
