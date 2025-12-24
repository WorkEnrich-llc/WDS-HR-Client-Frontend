import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-create-bonus-deduction',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './create-bonus-deduction.component.html',
    styleUrls: ['./create-bonus-deduction.component.css']
})
export class CreateBonusDeductionComponent {
    constructor(private router: Router) { }
}
