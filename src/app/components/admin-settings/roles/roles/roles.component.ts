import { Component, inject, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { OverlayFilterBoxComponent } from 'app/components/shared/overlay-filter-box/overlay-filter-box.component';
import { TableComponent } from 'app/components/shared/table/table.component';
import { debounceTime, filter, Subject } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminRolesService } from 'app/core/services/admin-settings/roles/admin-roles.service';
import { RolesService } from 'app/core/services/roles/roles.service';
import { ModulePermission, Roles } from 'app/core/models/roles';
import { mapRoleAllResponse } from 'app/core/adapter/adapter';

@Component({
  selector: 'app-roles',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, FormsModule, CommonModule, RouterLink, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent {

  private adminRolesService = inject(AdminRolesService);
  private roleService = inject(RolesService);
  roles: Roles[] = [];
  copyRoles: Roles[] = [];
  filteredList: Roles[] = [];

  filterForm!: FormGroup;
  toasterSubscription: any;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

  // roles = [
  //   {
  //     id: 1,
  //     role: "Admin",
  //     added_date: "2025-08-01",
  //     status: "active"
  //   },
  //   {
  //     id: 2,
  //     role: "Editor",
  //     added_date: "2025-08-05",
  //     status: "inactive"
  //   },
  //   {
  //     id: 3,
  //     role: "Viewer",
  //     added_date: "2025-08-10",
  //     status: "active"
  //   }
  // ];
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  loadData: boolean = false;
  private searchSubject = new Subject<string>();


  moduleNames: string[] = [];
  serviceNames: string[] = [];


  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      this.getAllRoles(this.currentPage);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllRoles(this.currentPage, value);
    });
    this.filterForm = this.fb.group({
      status: [''],
      activeModules: [''],
      activeServices: [''],
    });

    this.filterForm.get('activeModules')?.valueChanges.subscribe(selectedModule => {
      this.filterServicesByModule(selectedModule);
    });
  }

  getAllRoles(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      status?: string;
      created_from?: string;
    }
  ) {
    this.loadData = true;

    this.adminRolesService.getAllRoles(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (res) => {
        this.currentPage = res.page;
        this.totalItems = res.total_items;
        this.totalPages = res.total_pages;
        this.roles = res.roles;
        this.copyRoles = [...res.roles];
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();

        const modules = this.copyRoles.flatMap((role: any) =>
          role.permissions.map((p: any) => p.moduleName).filter((name: any) => !!name)
        );
        this.moduleNames = [...new Set(modules)];
        const selectedModule = this.filterForm.value.activeModules
        const services = this.roles
          .flatMap(role => role.permissions || [])
          .filter(p => p.moduleName === selectedModule)
          .flatMap(p => (p.subModules || [])
            .filter(sub => (sub.actions || []).length > 0)
            .map(sub => sub.subName?.trim())
            .filter((name): name is string => !!name)
          );
        this.serviceNames = Array.from(new Set(services));
        this.loadData = false;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }


  getPermissionsCounts(role: Roles): number {
    return role.permissions.reduce((total, module) => {
      return total + module.subModules.reduce((subTotal, sub) => subTotal + sub.actions.length, 0);
    }, 0);
  }

  getModuleCount(role: Roles): number {
    return role.permissions.length;
  }

  getPermissionsCount(role: Roles): number {
    return role.permissions.reduce((total, module) => {
      return total + module.subModules.reduce((subTotal, sub) => {
        return subTotal + (sub.activeActions?.filter(a => a.status).length ?? 0);
      }, 0);
    }, 0);
  }


  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.roles.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      if (this.sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }


  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  // resetFilterForsm(): void {
  //   this.filterBox.closeOverlay();
  //   this.searchTerm = '';
  //   this.filteredList = [...this.roles];
  // }

  resetFilterForm() {
    this.filterForm.reset();
    this.currentPage = 1;
    this.filterBox.closeOverlay();
    this.getAllRoles(this.currentPage);
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;
      const filters = {
        status: rawFilters.status || undefined,
        activeModules: rawFilters.activeModules || undefined,
        activeServices: rawFilters.activeServices || undefined,
      };

      this.filterBox.closeOverlay();
      this.adminRolesService.getAllRoles(this.currentPage, 10, filters).subscribe({
        next: (res) => {
          let filteredRoles = res.roles;
          if (filters.activeModules) {
            filteredRoles = filteredRoles.filter((role: any) =>
              role.permissions.some((p: any) => p.moduleName === filters.activeModules)
            );
          }
          if (filters.activeServices) {
            filteredRoles = filteredRoles.filter((role: any) =>
              role.permissions.some((p: any) =>
                p.subModules?.some((sub: any) => sub.subName === filters.activeServices)
              )
            );
          }
          if (filters.status) {
            const statusFilter = filters.status === '1' ? 'Active' : 'Inactive';
            filteredRoles = filteredRoles.filter((role: any) => role.status === statusFilter);
          }

          this.roles = filteredRoles;
        },
        error: (err) => console.error("Error fetching roles", err),
      });
    }
  }


  filterServicesByModule(selectedModule: string) {
    if (!this.copyRoles) {
      return;
    }
    if (!selectedModule) {
      this.serviceNames = [...new Set(
        this.copyRoles.flatMap(role =>
          role.permissions.flatMap(perm =>
            (perm.subModules || [])
              .map(s => s.subName?.trim())
              .filter((s): s is string => !!s)
          )
        )
      )];
      return;
    }
    const services = this.copyRoles
      .flatMap(role => role.permissions || [])
      .filter(p => p.moduleName === selectedModule)
      .flatMap(p => p.subModules || [])
      .map(sub => sub.subName?.trim())
      .filter((name): name is string => !!name);

    this.serviceNames = [...new Set(services)];
  }


  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
  }
  onPageChange(page: number): void {
    this.currentPage = page;
  }
}
