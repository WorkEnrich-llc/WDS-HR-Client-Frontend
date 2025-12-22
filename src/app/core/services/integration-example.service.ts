import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SystemSetupService } from './main/system-setup.service';

/**
 * EXAMPLE: How to integrate modules with System Setup Tour
 * 
 * This is an example showing the pattern to follow in your module services
 * (Goals, Departments, Branches, etc.)
 */

@Injectable({
  providedIn: 'root'
})
export class IntegrationExampleService {
  private http = inject(HttpClient);
  private systemSetupService = inject(SystemSetupService);

  /**
   * PATTERN 1: In your CREATE methods
   * After successfully creating an item, notify the system setup service
   */
  createGoal(goalData: any): Observable<any> {
    return this.http.post('/api/goals', goalData).pipe(
      tap((response) => {
        // ✅ Success! Notify system setup that a goal was created
        this.systemSetupService.notifyModuleItemCreated('goals');
      })
    );
  }

  createDepartment(deptData: any): Observable<any> {
    return this.http.post('/api/departments', deptData).pipe(
      tap((response) => {
        // ✅ Success! Notify system setup that a department was created
        this.systemSetupService.notifyModuleItemCreated('departments');
      })
    );
  }

  createBranch(branchData: any): Observable<any> {
    return this.http.post('/api/branches', branchData).pipe(
      tap((response) => {
        // ✅ Success! Notify system setup that a branch was created
        this.systemSetupService.notifyModuleItemCreated('branches');
      })
    );
  }

  /**
   * PATTERN 2: In your component's success handlers
   * You can also call this directly from components after successful operations
   */
  // In your component:
  /*
  onCreateSuccess() {
    this.systemSetupService.notifyModuleItemCreated('employees');
  }
  */

  /**
   * PATTERN 3: Module names mapping
   * Use these exact strings for consistency:
   * 
   * - 'goals' for Goals module
   * - 'departments' for Departments module  
   * - 'branches' for Branches module
   * - 'job-titles' for Job Titles module
   * - 'work-schedules' for Work Schedules module
   * - 'employees' for Employees module
   */
}

/**
 * IMPLEMENTATION STEPS:
 * 
 * 1. In each module service (GoalsService, DepartmentsService, etc.):
 *    - Inject SystemSetupService
 *    - Add .pipe(tap(() => this.systemSetupService.notifyModuleItemCreated('module-name')))
 *    - To your create/success methods
 * 
 * 2. The System Setup Tour will:
 *    - Automatically refresh its data
 *    - Show visual feedback (success pulse, "Just completed!" badge)
 *    - Update step completion status
 * 
 * 3. User Experience:
 *    - User opens System Setup Tour
 *    - Clicks "Open Goals" 
 *    - Creates a new goal
 *    - Returns to System Setup Tour (or it updates automatically)
 *    - Sees the step marked as completed with celebration animations
 */