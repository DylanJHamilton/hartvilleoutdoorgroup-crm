import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesQuickLinks } from './sales-quick-links';

describe('SalesQuickLinks', () => {
  let component: SalesQuickLinks;
  let fixture: ComponentFixture<SalesQuickLinks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesQuickLinks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesQuickLinks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
