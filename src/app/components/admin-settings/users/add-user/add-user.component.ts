import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-user',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css'
})
export class AddUserComponent implements OnInit {

  public usersForm!: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  createDate: string = '';
  updatedDate: string = '';
  isEditMode = false;
  // id?: number;

  constructor(
    private datePipe: DatePipe,
    // private router: Router
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }


  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.isEditMode = params.has('id');
    });
    // this.isEditMode = this.route.snapshot.paramMap.has('id');
    this.initFormModel();
    const today = new Date().toLocaleDateString('en-GB');
    this.createDate = today;
  }


  private initFormModel(): void {
    this.usersForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      userId: [''],
      userName: ['', [Validators.required]],
      userRole: ['', [Validators.required]],
    });
  }


  // popups
  isModalOpen = false;
  isSuccessModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/users']);
  }
}
