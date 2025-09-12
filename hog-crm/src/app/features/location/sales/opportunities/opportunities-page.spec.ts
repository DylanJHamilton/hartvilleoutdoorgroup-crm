import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunitiesPage } from './opportunities-page';

describe('OpportunitiesPage', () => {
  let component: OpportunitiesPage;
  let fixture: ComponentFixture<OpportunitiesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunitiesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpportunitiesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
