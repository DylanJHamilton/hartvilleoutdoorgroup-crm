import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesPipelinePage } from './sales-pipeline-page';

describe('SalesPipelinePage', () => {
  let component: SalesPipelinePage;
  let fixture: ComponentFixture<SalesPipelinePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesPipelinePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesPipelinePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
