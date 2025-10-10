import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { PopupComponent } from '../../shared/popup/popup.component';
import { SystemCloudService } from '../../../core/services/system-cloud/system-cloud.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { BreadcrumbService } from 'app/core/services/system-cloud/breadcrumb.service';
interface FileItem {
  id: string;
  name: string;
  type: 'File' | 'Folder';
  parent: string | null;
  children?: FileItem[];
}
interface storageInfo {
  total_size: string;
  used_size: string;
  free_size: string;
  percentage: number;
};
@Component({
  selector: 'app-system-cloud',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './system-cloud.component.html',
  styleUrl: './system-cloud.component.css',
  encapsulation: ViewEncapsulation.None
})
export class SystemCloudComponent implements OnInit {
  constructor(
    private _systemCloudService: SystemCloudService,
    private http: HttpClient,
    private toasterService: ToastrService,
    private router: Router,
    private breadcrumbService: BreadcrumbService
  ) { }
  // load data and spinner show
  dataLoaded: boolean = false;
  loadData: boolean = true;
  loadFiles: boolean = true;
  silentReload: boolean = false;

  isLoading: boolean = false;

  uploadProgress: number = 0;

  newFolderName: string = '';

  errMsg: string = '';

  openedFolderId: string | null = null;
  files: any[] = [];
  allFiles: any[] = [];
  storageInfo: storageInfo | undefined;

  searchFolderText: string = '';
  filteredFiles: any[] = [];
  breadcrumb: { id: string | null; name: string }[] = [];

  systemTemplates: any[] = [];
  searchText: string = '';
  filteredTemplates: any[] = [];


  ngOnInit(): void {
    const tempFolderId = this.breadcrumbService.getReturnFolderId();
    // check from route or systemfile id
    if (tempFolderId) {
      this.getAllFoldersFiles(tempFolderId);
      this.breadcrumb = this.breadcrumbService.getBreadcrumb();
      this.openedFolderId = tempFolderId;

      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 300);

      this.breadcrumbService.clearReturnFolderId();
    } else {
      this.breadcrumbService.clear();
      this.getAllFoldersFiles(null);
      this.breadcrumb = [{ id: null, name: 'My Drive' }];
      this.openedFolderId = null;
    }

    this.getAllSystemTemplates();
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

    if (!this.silentReload) {
      this.loadFiles = true;
    }

    this._systemCloudService.getFoldersFiles().subscribe({
      next: (response) => {
        const objects: FileItem[] = response?.data?.object_info ?? [];
        this.allFiles = this.flattenFilesRecursively(objects);
        // console.log(this.allFiles);
        this.dataLoaded = true;
        this.storageInfo = response?.data?.storage_size_info;
        // console.log(this.storageInfo);
        this.updateCurrentFilesView(parentId);
      },
      error: (err) => {
        console.log(err.error?.details);
      },
      complete: () => {
        this.loadFiles = false;
        this.silentReload = false;
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

    // this.filteredFiles = [...this.files];
    this.filteredFiles = [...this.files].sort((a, b) => {

      if (a.type === 'Folder' && b.type === 'File') return -1;
      if (a.type === 'File' && b.type === 'Folder') return 1;

      return a.name.localeCompare(b.name);
    });

    // if (parentId === null) {
    //   this.breadcrumb = [{ id: null, name: 'My Drive' }];
    // }
    // if return from systemfile breadcrumb
    if (parentId === null && this.breadcrumb.length === 0) {
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

    this.breadcrumbService.setBreadcrumb(this.breadcrumb);
    this.breadcrumbService.setCurrentFolder(folder);

    this.getAllFoldersFiles(folder.id);
  }

  // open system file
  openSystemFile(folder: any) {
    // send breadcramb
    const newBreadcrumb = [...this.breadcrumb, { id: folder.id, name: folder.name }];
    this.breadcrumbService.setBreadcrumb(newBreadcrumb);

    this.router.navigate(['/cloud/system-file', folder.id]);
  }

  // go to folder from 
  goToFolder(folderId: string | null): void {
    this.openedFolderId = folderId;

    this.files = this.allFiles
      .filter(item => item.parent === folderId);

    this.filteredFiles = [...this.files].sort((a, b) => {
      if (a.type === 'Folder' && b.type === 'File') return -1;
      if (a.type === 'File' && b.type === 'Folder') return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    if (this.searchFolderText.trim()) {
      this.filterFolders();
    }

    const index = this.breadcrumb.findIndex(b => b.id === folderId);
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);


    // update service
    this.breadcrumbService.setBreadcrumb(this.breadcrumb);

    const current = this.breadcrumb.find(b => b.id === folderId);
    if (current) {
      this.breadcrumbService.setCurrentFolder(current);
    }
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

    if (this.openedFolderId) {
      formData.append('parent', this.openedFolderId);
    }

    this._systemCloudService.createFolder(formData).subscribe({
      next: (response) => {
        this.newFolderName = '';
        this.errMsg = '';
        this.closeModalFolder();
        this.isLoading = false;

        const newFolder = {
          ...response?.data?.object_info,
          parent: this.openedFolderId ?? null
        };

        this.allFiles.push(newFolder);

        const exists = this.files.some(file => file.id === newFolder.id);
        if (!exists) {
          if (this.openedFolderId === newFolder.parent || (!this.openedFolderId && !newFolder.parent)) {
            this.files.push(newFolder);
          }
        }

        this.filteredFiles = [...this.files].sort((a, b) => {
          if (a.type === 'Folder' && b.type !== 'Folder') return -1;
          if (a.type !== 'Folder' && b.type === 'Folder') return 1;
          return a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: 'base'
          });
        });

        // console.log('✅ New folder added:', newFolder);
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
          this.isLoading = false;
          this.uploadProgress = 0;

          const newFile = {
            ...event.body?.data?.object_info,
            parent: this.openedFolderId ?? null
          };

          this.allFiles.push(newFile);

          if (newFile.parent === this.openedFolderId) {
            this.files.push(newFile);

            this.filteredFiles = [...this.files].sort((a, b) => {
              if (a.type === 'Folder' && b.type !== 'Folder') return -1;
              if (a.type !== 'Folder' && b.type === 'Folder') return 1;
              return a.name.localeCompare(b.name, undefined, {
                numeric: true,
                sensitivity: 'base'
              });
            });
          }

          if (this.openedFolderId) {
            const parentFolder = this.allFiles.find(f => f.id === this.openedFolderId && f.type === 'Folder');
            if (parentFolder) {
              if (!Array.isArray(parentFolder.children)) {
                parentFolder.children = [];
              }
              parentFolder.children.push(newFile);
            }
          }

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
  formatFileSize(bytes: number | undefined | null): string {
    if (!bytes && bytes !== 0) return '0 B';
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


  // =================== system files 
  // create File Popup

  createFilePop = false;
  sheetName: string = '';
  fileType: string = '';
  systemFileName: string = '';
  openModalNewFile(fileType: string, sheetName: string) {
    this.createFilePop = true;
    this.sheetName = sheetName;
    this.fileType = fileType;
  }

  closeModalFile() {
    this.createFilePop = false;
  }


  createSystemFile(fileType: string) {
    this.isLoading = true;
    this.errMsg = '';

    if (!this.systemFileName || !this.systemFileName.trim()) {
      this.errMsg = 'Please enter a valid folder name.';
      this.isLoading = false;
      return;
    }

    const formData = new FormData();
    formData.append('name', this.systemFileName);
    formData.append('type', 'System_File');
    formData.append('file_type', fileType);

    if (this.openedFolderId) {
      formData.append('parent', this.openedFolderId);
    }

    this._systemCloudService.createSystemFile(formData).subscribe({
      next: (response) => {
        this.systemFileName = '';
        this.errMsg = '';
        this.closeModalFile();
        this.isLoading = false;

        const newFile = {
          ...response?.data?.object_info,
          parent: this.openedFolderId ?? null
        };

        this.allFiles.push(newFile);

        const exists = this.files.some(file => file.id === newFile.id);
        if (!exists) {
          if (this.openedFolderId === newFile.parent || (!this.openedFolderId && !newFile.parent)) {
            this.files.push(newFile);
          }
        }

        this.filteredFiles = [...this.files].sort((a, b) => {
          if (a.type === 'Folder' && b.type !== 'Folder') return -1;
          if (a.type !== 'Folder' && b.type === 'Folder') return 1;
          return a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: 'base'
          });
        });

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




  // ====================== folders
  // create Folder Popup
  createFolderPop = false;
  openModalNewFolder() {
    this.createFolderPop = true;
  }

  closeModalFolder() {
    this.createFolderPop = false;
  }

  // rename Popup
  newName: string = '';
  renameFolderPop = false;
  folderIdToRename: string = '';
  folderNameToRename: string = '';
  folderTypeToRename: string = '';

  openModalrename(folderId: string, folderName: string, folderType: string) {
    this.renameFolderPop = true;
    this.folderIdToRename = folderId;
    this.folderNameToRename = folderName;
    this.folderTypeToRename = folderType;
    this.newName = folderName;
  }


  // rename folder
  renameFolder() {
    this.isLoading = true;
    this.errMsg = '';

    if (!this.newName || !this.newName.trim()) {
      this.errMsg = 'Please enter a valid folder name.';
      this.isLoading = false;
      return;
    }

    const formData = new FormData();
    formData.append('name', this.newName);

    this._systemCloudService.renameFile(this.folderIdToRename, formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        this.closeModalrename();

        const updatedName = this.newName;
        this.newName = '';


        const folderInAllFiles = this.allFiles.find(f => f.id === this.folderIdToRename);
        if (folderInAllFiles) {
          folderInAllFiles.name = updatedName;
        }

        const folderInFiles = this.files.find(f => f.id === this.folderIdToRename);
        if (folderInFiles) {
          folderInFiles.name = updatedName;
        }

        this.filteredFiles = [...this.files].sort((a, b) => {
          if (a.type === 'Folder' && b.type !== 'Folder') return -1;
          if (a.type !== 'Folder' && b.type === 'Folder') return 1;
          return a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: 'base'
          });
        });
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



  closeModalrename() {
    this.renameFolderPop = false;
  }

  // delete Popup
  deletePOP = false;
  folderIdToDelete: string = '';
  folderNameToDelete: string = '';
  folderTypeToDelete: string = '';
  openModalDelete(folderId: string, folderName: string, folderType: string) {
    this.folderIdToDelete = folderId;
    this.folderNameToDelete = folderName;
    this.folderTypeToDelete = folderType;
    this.deletePOP = true;
  }

  closeModalDelete() {
    this.deletePOP = false;
  }

  deleteFile(id: string): void {
    this.errMsg = '';
    this.uploadProgress = 0;
    this.closeModalDelete();
    this._systemCloudService.deleteFile(id).subscribe({
      next: () => {
        this.files = this.files.filter(file => file.id !== id);
        this.filteredFiles = this.filteredFiles.filter(file => file.id !== id);
        this.allFiles = this.allFiles.filter(file => file.id !== id);
        
      },
      error: (err: any) => {
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
      },
    });

  }


  // duplicate file
  dublicatePOP = false;
  folderIdToDublicate: string = '';
  folderNameToDublicate: string = '';
  openModalDublicate(folderId: string, folderName: string) {
    this.folderIdToDublicate = folderId;
    this.folderNameToDublicate = folderName;
    this.dublicatePOP = true;
  }

  closeModalDublicate() {
    this.dublicatePOP = false;
  }

  duplicateFile(id: string, name: string): void {
    this.errMsg = '';
    this.closeModalDublicate();
    this._systemCloudService.duplicateFile(id).subscribe({
      next: (response) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const timestamp = `${year}-${month}-${day}-${hours}:${minutes}:${seconds}`;
        const duplicatedName = `${name}-${timestamp}-copy`;

        const duplicatedFile = {
          ...response?.data?.object_info,
          name: duplicatedName,
          parent: this.openedFolderId ?? null
        };

        this.allFiles = [...this.allFiles, duplicatedFile];

        if (this.openedFolderId === duplicatedFile.parent || (!this.openedFolderId && !duplicatedFile.parent)) {
          this.files = [...this.files, duplicatedFile];
        }

        // this.filteredFiles = [...this.files].sort((a, b) => {
        //   if (a.type === 'Folder' && b.type !== 'Folder') return -1;
        //   if (a.type !== 'Folder' && b.type === 'Folder') return 1;
        //   return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        // });

        
      },
      error: () => {
        this.errMsg = 'Could not duplicate file.';
      }
    });
  }







  // ================= drag and drop moving files in folder 
  draggedFileIdForMove: string | null = null;
  dragOverCrumbId: string = '';


  onFileDragStart(event: DragEvent, file: any) {
    this.draggedFileIdForMove = file.id;
    event.dataTransfer?.setData('text/plain', file.id);
  }

  onFolderDragOver(event: DragEvent) {
    event.preventDefault();

    (event.currentTarget as HTMLElement).classList.add('folder-hover');
  }

  onFolderDrop(event: DragEvent, targetFolder: any) {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('folder-hover');

    const fileId = this.draggedFileIdForMove || event.dataTransfer?.getData('text/plain');
    if (!fileId || targetFolder.type !== 'Folder') return;

    const formData = new FormData();
    formData.append('parent', targetFolder.id);

    this._systemCloudService.renameFile(fileId, formData).subscribe({
      next: () => {
        const movedFile = this.allFiles.find(f => f.id === fileId);
        if (!movedFile) return;

        movedFile.parent = targetFolder.id;

        this.allFiles = this.allFiles.map(f => f.id === fileId ? movedFile : f);

        this.files = this.files.filter(f => f.id !== fileId);

        if (this.openedFolderId === targetFolder.id) {
          this.files = [...this.files, movedFile];
        }

        // this.filteredFiles = [...this.files].sort((a, b) => {
        //   if (a.type === 'Folder' && b.type !== 'Folder') return -1;
        //   if (a.type !== 'Folder' && b.type === 'Folder') return 1;
        //   return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        // });
      },
      error: (err) => {
        console.error(err);
      }
    });

    this.draggedFileIdForMove = null;
  }


  onFolderDragLeave(event: DragEvent) {
    (event.currentTarget as HTMLElement).classList.remove('folder-hover');
  }

  onCrumbDragOver(event: DragEvent, crumb: any) {
    event.preventDefault();
    this.dragOverCrumbId = crumb.id;
  }

  onCrumbDragLeave(event: DragEvent, crumb: any) {
    if (this.dragOverCrumbId === crumb.id) {
      this.dragOverCrumbId = '';
    }
  }


  onCrumbDrop(event: DragEvent, crumb: any) {
    event.preventDefault();
    this.dragOverCrumbId = '';

    const fileId = this.draggedFileIdForMove || event.dataTransfer?.getData('text/plain');
    if (!fileId) return;

    const parentId = crumb.id ?? null;

    const formData = new FormData();
    formData.append('parent', parentId ?? '');

    this._systemCloudService.renameFile(fileId, formData).subscribe({
      next: () => {
        const movedFile = this.allFiles.find(f => f.id === fileId);
        if (!movedFile) return;

        movedFile.parent = parentId;

        this.allFiles = this.allFiles.map(f => f.id === fileId ? movedFile : f);

        this.files = this.files.filter(f => f.id !== fileId);

        if (this.openedFolderId === parentId) {
          this.files = [...this.files, movedFile];
        }

        this.filteredFiles = [...this.files].sort((a, b) => {
          if (a.type === 'Folder' && b.type !== 'Folder') return -1;
          if (a.type !== 'Folder' && b.type === 'Folder') return 1;
          return a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: 'base'
          });
        });
      },
      error: (err) => {
        console.error(err);
      }
    });

    this.draggedFileIdForMove = null;
  }


}