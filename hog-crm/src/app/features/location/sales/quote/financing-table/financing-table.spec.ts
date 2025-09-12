import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancingTable } from './financing-table';

describe('FinancingTable', () => {
  let component: FinancingTable;
  let fixture: ComponentFixture<FinancingTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancingTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancingTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
