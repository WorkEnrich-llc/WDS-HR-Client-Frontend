import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private breadcrumb: any[] = [];
  private currentFolder: any = null;
  private returnFolderId: string | null = null;

  setBreadcrumb(crumbs: any[]) {
    this.breadcrumb = crumbs;
    localStorage.setItem('breadcrumb', JSON.stringify(crumbs));
  }

  getBreadcrumb(): any[] {
    if (this.breadcrumb.length === 0) {
      const saved = localStorage.getItem('breadcrumb');
      if (saved) {
        this.breadcrumb = JSON.parse(saved);
      }
    }
    return this.breadcrumb;
  }

  setCurrentFolder(folder: any) {
    this.currentFolder = folder;
    localStorage.setItem('currentFolder', JSON.stringify(folder));
  }

  getCurrentFolder(): any {
    if (!this.currentFolder) {
      const saved = localStorage.getItem('currentFolder');
      if (saved) {
        this.currentFolder = JSON.parse(saved);
      }
    }
    return this.currentFolder;
  }

  // ✅ set/get/clear للـ folderId المؤقت
  setReturnFolderId(id: string | null) {
    this.returnFolderId = id;
  }

  getReturnFolderId(): string | null {
    return this.returnFolderId;
  }

  clearReturnFolderId() {
    this.returnFolderId = null;
  }

  clear() {
    this.breadcrumb = [];
    this.currentFolder = null;
    this.returnFolderId = null;
    localStorage.removeItem('breadcrumb');
    localStorage.removeItem('currentFolder');
  }
}
