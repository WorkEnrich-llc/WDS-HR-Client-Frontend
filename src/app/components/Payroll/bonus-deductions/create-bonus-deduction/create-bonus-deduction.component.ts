import { Component } from '@angular/core';

import { Router } from '@angular/router';

@Component({
    selector: 'app-create-bonus-deduction',
    standalone: true,
    imports: [],
    templateUrl: './create-bonus-deduction.component.html',
    styleUrls: ['./create-bonus-deduction.component.css']
})
export class CreateBonusDeductionComponent {
    constructor(private router: Router) { }
}
