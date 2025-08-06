import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { PopupComponent } from '../../shared/popup/popup.component';
import { SystemCloudService } from '../../../core/services/system-cloud/system-cloud.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
interface FileItem {
  id: string;
  name: string;
  type: 'File' | 'Folder';
  parent: string | null;
  children?: FileItem[];
}

@Component({
  selector: 'app-system-cloud',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './system-cloud.component.html',
  styleUrl: './system-cloud.component.css',
  encapsulation: ViewEncapsulation.None
})
export class SystemCloudComponent implements OnInit {
  constructor(private _systemCloudService: SystemCloudService, private http: HttpClient, private toasterService: ToastrService
  ) { }
  dataLoaded: boolean = false;
  loadData: boolean = true;
  loadFiles: boolean = true;
  isLoading: boolean = false;
  uploadProgress: number = 0;
  newFolderName: string = '';
  errMsg: string = '';
  openedFolderId: string | null = null;
  files: any[] = [];
  allFiles: any[] = [];
  searchFolderText: string = '';
  filteredFiles: any[] = [];
  breadcrumb: { id: string | null; name: string }[] = [];

  systemTemplates: any[] = [];
  searchText: string = '';
  filteredTemplates: any[] = [];
  ngOnInit(): void {
    this.getAllSystemTemplates();
    this.getAllFoldersFiles();
  }
  // check all loaded
  get isAllLoaded(): boolean {
    return !this.loadData && !this.loadFiles;
  }
  // get all system templates 
  getAllSystemTemplates() {
    this.loadData = true;
    this._systemCloudService.getAllTemplates().subscribe({
      next: (response) => {
        this.systemTemplates = response?.data?.object_info || [];
        this.filteredTemplates = [...this.systemTemplates];

      },
      error: (err) => {
        console.log(err.error?.details);

      },
      complete: () => {
        this.loadData = false;
      }
    });
  }

  filterTemplates() {
    const text = this.searchText.toLowerCase();
    this.filteredTemplates = this.systemTemplates.filter(template =>
      template.label?.toLowerCase().includes(text)
    );
  }

  // get all files and folder
  getAllFoldersFiles(parentId: string | null = null) {
    if (this.dataLoaded) {
      this.updateCurrentFilesView(parentId);
      return;
    }

    this.loadFiles = true;

    this._systemCloudService.getFoldersFiles().subscribe({
      next: (response) => {
        const objects: FileItem[] = response?.data?.object_info ?? [];

        this.allFiles = this.flattenFilesRecursively(objects);
        this.dataLoaded = true;

        this.updateCurrentFilesView(parentId);
      },
      error: (err) => {
        console.log(err.error?.details);
      },
      complete: () => {
        this.loadFiles = false;
      }
    });
  }

  updateCurrentFilesView(parentId: string | null) {
    this.files = this.allFiles
      .filter(item =>
        (item.parent === null && parentId === null) ||
        (item.parent !== null && item.parent === parentId)
      )
      .reverse();

    this.filteredFiles = [...this.files];

    if (parentId === null) {
      this.breadcrumb = [{ id: null, name: 'My Drive' }];
    }
  }

  filterFolders() {
    const search = this.searchFolderText.trim().toLowerCase();

    if (!search) {
      this.filteredFiles = [...this.files];
      return;
    }

    this.filteredFiles = this.files.filter(item =>
      item.name?.toLowerCase().includes(search)
    );
  }

  getCleanName(name: string): string {
  if (!name) return '';

  const withoutExtension = name.replace(/\.[^/.]+$/, '');
  return withoutExtension.replace(/^\d{8}_\d{6}_/, '');
}


  // tree filter to folders
  flattenFilesRecursively(items: FileItem[], parentId: string | null = null): FileItem[] {
    let result: FileItem[] = [];

    items.forEach(item => {
      const currentItem = { ...item, parent: parentId };
      result.push(currentItem);

      if (item.children && item.children.length > 0) {
        const childrenFlattened = this.flattenFilesRecursively(item.children, item.id);
        result = result.concat(childrenFlattened);
      }
    });

    return result;
  }

  // open folder
  openFolder(folder: { id: string, name: string }) {
    this.openedFolderId = folder.id;

    const exists = this.breadcrumb.find(b => b.id === folder.id);
    if (!exists) {
      this.breadcrumb.push({ id: folder.id, name: folder.name });
    }

    this.getAllFoldersFiles(folder.id);
  }

  // go to folder from 
  goToFolder(folderId: string | null): void {
    this.openedFolderId = folderId;

    this.files = this.allFiles
      .filter(item => item.parent === folderId)
      .reverse();

    this.filteredFiles = [...this.files];

    if (this.searchFolderText.trim()) {
      this.filterFolders();
    }

    const index = this.breadcrumb.findIndex(b => b.id === folderId);
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
  }

  // create new folder
  createFolder() {
    this.isLoading = true;
    this.errMsg = '';

    if (!this.newFolderName || !this.newFolderName.trim()) {
      this.errMsg = 'Please enter a valid folder name.';
      this.isLoading = false;
      return;
    }

    const formData = new FormData();
    formData.append('name', this.newFolderName);
    formData.append('type', 'Folder');
    formData.append('parent', this.openedFolderId ?? '');

    this._systemCloudService.createFolder(formData).subscribe({
      next: (response) => {
        this.newFolderName = '';
        this.errMsg = '';
        this.closeModalFolder();
        this.getAllFoldersFiles(this.openedFolderId ?? null);
        this.isLoading = false;
      },
      error: (err) => {
        if (err?.error?.data?.error_handling?.length > 0) {
          this.errMsg = err.error.data.error_handling[0].error;
        } else {
          this.errMsg = 'An unexpected error occurred.';
        }
        this.isLoading = false;
      }
    });
  }

  // upload file
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.') || file.name;

      const formData = new FormData();
      formData.append('name', fileNameWithoutExtension);
      formData.append('type', 'File');
      formData.append('parent', this.openedFolderId ?? '');
      formData.append('file', file);
      this.fileUpload(formData);
    } else {
      console.log('No file selected');
    }
  }

  // file upload
  fileUpload(formData: FormData) {
    this.isLoading = true;
    this.errMsg = '';
    this.uploadProgress = 0;

    this._systemCloudService.createUploadFile(formData).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            this.uploadProgress = Math.round((event.loaded / event.total) * 100);
          }
        } else if (event.type === HttpEventType.Response) {
          this.getAllFoldersFiles(this.openedFolderId ?? null);
          this.isLoading = false;
          this.uploadProgress = 0;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.uploadProgress = 0;

        let errorMessage = 'An error occurred';

        if (
          err?.error?.data?.error_handling &&
          Array.isArray(err.error.data.error_handling) &&
          err.error.data.error_handling.length > 0 &&
          err.error.data.error_handling[0].error
        ) {
          errorMessage = err.error.data.error_handling[0].error;
        } else if (err?.message) {
          errorMessage = err.message;
        }

        this.toasterService.error(errorMessage);
      }

    });
  }

  // get file type
  getFileTypeText(fileType: string): string {
    return (fileType || '').toUpperCase().slice(0, 4);
  }
  // drag and drop
  isDragOver: boolean = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.') || file.name;

        const formData = new FormData();
        formData.append('name', fileNameWithoutExtension);
        formData.append('type', 'File');
        formData.append('parent', this.openedFolderId ?? '');
        formData.append('file', file);

        this.fileUpload(formData);
      }
    }
  }



  getTextX(fileType: string): number {
    const length = (fileType || '').length;
    if (length === 3) {
      return 28;
    } else {
      return 21;
    }
  }

  // format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);

    return size.toFixed(2) + ' ' + sizes[i];
  }

  // exxpand and collapse file templates
  isExpanded = true;
  toggleCollapse() {
    this.isExpanded = !this.isExpanded;
  }


  // change view style grid and list
  selectedView: 'grid' | 'list' = 'grid';

  setView(view: 'grid' | 'list') {
    this.selectedView = view;
  }


  // create File Popup
  createFilePop = false;
  openModalNewFile() {
    this.createFilePop = true;
  }

  closeModalFile() {
    this.createFilePop = false;
  }

  // create Folder Popup
  createFolderPop = false;
  openModalNewFolder() {
    this.createFolderPop = true;
  }

  closeModalFolder() {
    this.createFolderPop = false;
  }
}
