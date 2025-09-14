import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { CustomersService, Customer, Pipeline, Stage } from '../services/customer.service';

@Component({
  standalone: true,
  selector: 'hog-customers-dashboard',
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatChipsModule, MatDividerModule
  ],
  styles: [`
    :host { --ink:#0f172a; --muted:#64748b; --primary:#1d4ed8; display:block; }
    .page { max-width: 1180px; margin: 8px auto 24px; padding: 0 12px; color: var(--ink); }
    .head { display:flex; align-items:center; gap:12px; margin: 4px 0 16px; }
    .title { font-size: 22px; font-weight: 700; }
    .sub { color: var(--muted); font-size: 12px; }
    .spacer { flex:1 1 auto; }

    .kpi-grid { display:grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap:12px; margin-bottom: 12px; }
    @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px)  { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi { display:flex; align-items:center; gap:12px; }
    .kpi .num { font-size: 26px; font-weight: 700; }
    .kpi .label { color: var(--muted); font-size: 12px; }

    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }

    .list-empty { color: var(--muted); padding: 12px; }

    .pill { cursor:pointer; }
    .pill:hover { opacity: .9; }
  `],
  template: `
    <div class="page">
      <div class="head">
        <div class="title">Customers — Dashboard</div>
        <span class="spacer"></span>
        <button mat-stroked-button color="primary" (click)="goList()">
          <mat-icon>list</mat-icon>&nbsp;Open List
        </button>
        <button mat-flat-button color="primary" (click)="newCustomer()">
          <mat-icon>person_add</mat-icon>&nbsp;New Customer
        </button>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <mat-card appearance="outlined"><mat-card-content class="kpi">
          <mat-icon color="primary">groups</mat-icon>
          <div>
            <div class="num">{{ total() }}</div>
            <div class="label">Total Customers</div>
          </div>
        </mat-card-content></mat-card>

        <mat-card appearance="outlined"><mat-card-content class="kpi">
          <mat-icon color="primary">new_releases</mat-icon>
          <div>
            <div class="num">{{ newThisWeek() }}</div>
            <div class="label">New This Week</div>
          </div>
        </mat-card-content></mat-card>

        <mat-card appearance="outlined"><mat-card-content class="kpi">
          <mat-icon color="primary">account_tree</mat-icon>
          <div>
            <div class="num">{{ openQualified() }}</div>
            <div class="label">Qualified</div>
          </div>
        </mat-card-content></mat-card>

        <mat-card appearance="outlined"><mat-card-content class="kpi">
          <mat-icon color="primary">local_shipping</mat-icon>
          <div>
            <div class="num">{{ wonDelivered() }}</div>
            <div class="label">Won + Delivered</div>
          </div>
        </mat-card-content></mat-card>
      </div>

      <!-- Breakdowns + Recent -->
      <div class="grid">
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>By Stage</mat-card-title>
            <mat-card-subtitle class="sub">Click to filter list</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip class="pill" *ngFor="let s of stages" (click)="goList({ stage: s })" color="primary" selected>
                {{ s }} — {{ stageCount(s) }}
              </mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>By Pipeline</mat-card-title>
            <mat-card-subtitle class="sub">Click to filter list</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip class="pill" *ngFor="let p of pipelines" (click)="goList({ pipeline: p })" color="primary" selected>
                {{ p }} — {{ pipelineCount(p) }}
              </mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Top Owners</mat-card-title>
            <mat-card-subtitle class="sub">Click to filter list</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-list *ngIf="owners().length; else emptyOwners">
              <mat-list-item *ngFor="let o of owners()">
                <div matListItemTitle class="pill" (click)="goList({ owner: o.name })">{{ o.name }}</div>
                <div matListItemMeta>{{ o.count }}</div>
              </mat-list-item>
            </mat-list>
            <ng-template #emptyOwners><div class="list-empty">No owners found.</div></ng-template>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Recent Customers</mat-card-title>
            <mat-card-subtitle class="sub">Last 10 created</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-list *ngIf="recent().length; else emptyRecent">
              <mat-list-item *ngFor="let c of recent()" [routerLink]="['../customers', c.id]">
                <mat-icon matListItemIcon color="primary">person</mat-icon>
                <div matListItemTitle>{{ c.name }}</div>
                <div matListItemLine class="sub">{{ c.createdAt | date:'MMM d, y, h:mm a' }}</div>
              </mat-list-item>
            </mat-list>
            <ng-template #emptyRecent><div class="list-empty">No recent customers.</div></ng-template>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `
})
export class CustomersDashboardPage {
  private svc = inject(CustomersService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  private items = computed(() => this.svc.items());

  total    = computed(() => this.items().length);
  stages: Stage[] = ['Intake','Qualified','Quoted','Won','Delivered','Lost'];
  pipelines: Pipeline[] = ['Sheds','Barns','Cabins','Furniture','Swing Sets','Trampolines','Playgrounds','Golf Carts','E-Bikes'];

  newThisWeek = computed(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return this.items().filter(c => c.createdAt >= weekAgo).length;
  });

  openQualified = computed(() => this.items().filter(c => c.stage === 'Qualified').length);
  wonDelivered  = computed(() => this.items().filter(c => c.stage === 'Won' || c.stage === 'Delivered').length);

  stageCount = (s: Stage) => this.items().filter(c => c.stage === s).length;
  pipelineCount = (p: Pipeline) => this.items().filter(c => c.pipeline === p).length;

  owners = computed(() => {
    const map = new Map<string, number>();
    this.items().forEach(c => { const key = c.owner || 'Unassigned'; map.set(key, (map.get(key) || 0) + 1); });
    // return top 8
    return [...map.entries()].map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count).slice(0, 8);
  });

  recent = computed(() => [...this.items()].sort((a,b) => +b.createdAt - +a.createdAt).slice(0, 10));

  goList(q?: { owner?: string; pipeline?: Pipeline; stage?: Stage }) {
    this.router.navigate(['../customers'], {
      relativeTo: this.route,
      queryParams: {
        owner: q?.owner ?? null,
        pipeline: q?.pipeline ?? null,
        stage: q?.stage ?? null
      },
      queryParamsHandling: 'merge'
    });
  }

  newCustomer() {
    // open the list page since creation lives there (and users know that flow)
    this.router.navigate(['../customers'], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
