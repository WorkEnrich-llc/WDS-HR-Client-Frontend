import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Branch } from '../../../../core/interfaces/branch';
import { Department } from '../../../../core/interfaces/department';
import { JobTitle } from '../../../../core/interfaces/job-title';
import { WorkSchedule } from '../../../../core/interfaces/work-schedule';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { WorkSchaualeService } from '../../../../core/services/personnel/work-schaduale/work-schauale.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { PageHeaderComponent } from './../../../shared/page-header/page-header.component';
import { COUNTRIES, Country } from './countries-list';

@Component({
  selector: 'app-create-employee',
  imports: [PageHeaderComponent, CommonModule, FormsModule, PopupComponent],
  providers: [DatePipe],
  templateUrl: './create-employee.component.html',
  styleUrl: './create-employee.component.css',
})
export class CreateEmployeeComponent implements OnInit {
  // inject services without constructor
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private toasterMessageService = inject(ToasterMessageService);
  private branchesService = inject(BranchesService);
  private departmentsService = inject(DepartmentsService);
  private jobsService = inject(JobsService);
  private workScheduleService = inject(WorkSchaualeService);

  // component state as signals
  readonly todayFormatted = signal<string>('');
  readonly errMsg = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly branches = signal<Branch[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly jobTitles = signal<JobTitle[]>([]);
  readonly workSchedules = signal<WorkSchedule[]>([]);
  readonly selectedBranchId = signal<number | null>(null);
  readonly selectedDepartmentId = signal<number | null>(null);
  readonly selectedJobTitleId = signal<number | null>(null);
  readonly selectedWorkScheduleId = signal<number | null>(null);
  readonly selectedSectionId = signal<number | null>(null);
  readonly currentStep = signal<number>(1);
  readonly selectAll = signal<boolean>(false);
  readonly isModalOpen = signal<boolean>(false);
  readonly isSuccessModalOpen = signal<boolean>(false);
  readonly dropdownOpen = signal<boolean>(false);
  readonly countries = signal<Country[]>(COUNTRIES);
  readonly selectedCountry = signal<Country>(COUNTRIES[0]);

  constructor() {
    const today = new Date();
    this.todayFormatted.set(this.datePipe.transform(today, 'dd/MM/yyyy')!);
  }
  @ViewChild('dropdownContainer') dropdownRef!: ElementRef;
  ngOnInit(): void {
    // load branches using object literal subscribe to avoid deprecated overload
    this.branchesService.getAllBranches(1, 100).subscribe({
      next: (res) => this.branches.set(res.data.list_items),
      error: (err) => console.error('Error loading branches', err),
    });

    // load departments
    this.departmentsService.getAllDepartment(1, 100).subscribe({
      next: (res) => this.departments.set(res.data.list_items),
      error: (err) => console.error('Error loading departments', err),
    });

    // load job titles
    this.jobsService.getAllJobTitles(1, 100).subscribe({
      next: (res) => this.jobTitles.set(res.data.list_items),
      error: (err) => console.error('Error loading job titles', err),
    });

    // load work schedules
    this.workScheduleService.getAllWorkSchadule(1, 100).subscribe({
      next: (res) => this.workSchedules.set(res.data.list_items),
      error: (err) => console.error('Error loading work schedules', err),
    });
  }

  selectCountry(country: any) {
    this.selectedCountry.set(country);
  }

  selectBranch(branchId: number) {
    this.selectedBranchId.set(branchId);
  }

  selectDepartment(departmentId: number) {
    this.selectedDepartmentId.set(departmentId);
    // Reset section when department changes
    console.log('Selected Department ID:', departmentId);
    this.selectedSectionId.set(null);
  }

  selectJobTitle(jobTitleId: number) {
    this.selectedJobTitleId.set(jobTitleId);
  }

  selectWorkSchedule(workScheduleId: number) {
    this.selectedWorkScheduleId.set(workScheduleId);
  }

  selectSection(sectionId: number) {
    this.selectedSectionId.set(sectionId);
  }

  // Get sections for selected department
  getSections() {
    const selectedDepartment = this.departments().find(
      (dept) => dept.id === this.selectedDepartmentId()
    );
    return selectedDepartment?.sections?.filter((section) => section.is_active) || [];
  }

  // Get branch name by ID
  getBranchName(branchId: number | null): string {
    if (!branchId) return 'Select Branch';
    const branch = this.branches().find((b) => b.id === branchId);
    return branch?.name || 'Select Branch';
  }

  // Get department name by ID
  getDepartmentName(departmentId: number | null): string {
    if (!departmentId) return 'Select Department';
    const department = this.departments().find((d) => d.id === departmentId);
    return department?.name || 'Select Department';
  }

  // Get job title name by ID
  getJobTitleName(jobTitleId: number | null): string {
    if (!jobTitleId) return 'Select Job Title';
    const jobTitle = this.jobTitles().find((j) => j.id === jobTitleId);
    return jobTitle?.name || 'Select Job Title';
  }

  // Get work schedule name by ID
  getWorkScheduleName(workScheduleId: number | null): string {
    if (!workScheduleId) return 'Select Work Schedule';
    const workSchedule = this.workSchedules().find((w) => w.id === workScheduleId);
    return workSchedule?.name || 'Select Work Schedule';
  }

  // Get section name by ID
  getSectionName(sectionId: number | null): string {
    if (!sectionId) return 'Select Section';
    const sections = this.getSections();
    const section = sections.find((s) => s.id === sectionId);
    return section?.name || 'Select Section';
  }

  // Get active departments
  getActiveDepartments(): Department[] {
    return this.departments().filter((d) => d.is_active);
  }

  // Get active job titles
  getActiveJobTitles(): JobTitle[] {
    return this.jobTitles().filter((j) => j.is_active);
  }

  // Get active work schedules
  getActiveWorkSchedules(): WorkSchedule[] {
    return this.workSchedules().filter((w) => w.is_active);
  }

  // Get active branches
  getActiveBranches(): Branch[] {
    return this.branches().filter((b) => b.is_active);
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(target)) {
      this.dropdownOpen.set(false);
    }
  }

  goNext() {
    this.currentStep.set(this.currentStep() + 1);
  }

  goPrev() {
    this.currentStep.set(this.currentStep() - 1);
  }

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  confirmAction() {
    this.isModalOpen.set(false);
    this.router.navigate(['/employees/all-employees']);
  }

  openSuccessModal() {
    this.isSuccessModalOpen.set(true);
  }

  closeSuccessModal() {
    this.isSuccessModalOpen.set(false);
  }

  viewEmployees() {
    this.closeSuccessModal();
    this.router.navigate(['/employees/all-employees']);
  }

  createAnother() {
    this.closeSuccessModal();
    // Reset form or navigate to create again
  }
}
