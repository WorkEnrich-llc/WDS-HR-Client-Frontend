import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AssignmentService } from '../../core/services/recruitment/assignment.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-assignment',
  imports: [],
  templateUrl: './assignment.component.html',
  styleUrl: './assignment.component.css'
})
export class AssignmentComponent implements OnInit {
  accessToken: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  assignmentData: any = null;

  constructor(
    private route: ActivatedRoute,
    private assignmentService: AssignmentService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.accessToken = params['s'] || null;

      if (this.accessToken) {
        this.loadAssignmentData();
      } else {
        this.isLoading = false;
        this.errorMessage = 'Invalid access token';
        this.toastr.error('Invalid access token');
      }
    });
  }

  private loadAssignmentData(): void {
    this.isLoading = true;
    this.assignmentService.getAssignmentData(this.accessToken!).subscribe({
      next: (data) => {
        this.assignmentData = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load assignment data';
        this.toastr.error('Failed to load assignment data');
        console.error('Error loading assignment data:', error);
      }
    });
  }
}
