import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateOffCyclePayrollComponent } from './create-off-cycle-payroll.component';

describe('CreateOffCyclePayrollComponent', () => {
    let component: CreateOffCyclePayrollComponent;
    let fixture: ComponentFixture<CreateOffCyclePayrollComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CreateOffCyclePayrollComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CreateOffCyclePayrollComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
