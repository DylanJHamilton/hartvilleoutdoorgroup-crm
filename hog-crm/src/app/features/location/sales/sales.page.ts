import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { HogChartDirective } from '../../../shared/ui/chart/hog-chart.directive';
import { StatCardComponent } from '../../../shared/ui/stat-card/stat-card.component';

import { mockStores, type LocationRef } from '../../../mock/locations.mock';
import { profileFor } from '../../../mock/store-profiles.mock';
import { makeSeed, seasonalityFactor, tfScale as tfScaleFn } from '../../../shared/demo/seed.util';

import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

type TF = 'MTD'|'WTD'|'DTD'|'QTD'|'YTD';
type RoleLabel = 'Owner/Admin'|'Manager'|'Sales'|'Other';

@Component({
  standalone: true,
  selector: 'hog-store-sales',
  imports: [
    CommonModule, RouterLink, RouterOutlet, NgOptimizedImage,
    MatCardModule, MatButtonModule, MatFormFieldModule, MatSelectModule,
    HogChartDirective, StatCardComponent
  ],
  templateUrl: './sales.page.html',
  styleUrls: ['./sales.page.scss']
})
export class SalesPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ===== Hub vs Child visibility =====
  // true when a segment exists after '/sales' (e.g., /sales/pipeline)
  private _childActive = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const url = this.router.url.split('?')[0];
        const parts = url.split('/').filter(Boolean);
        const idx = parts.indexOf('sales');
        return idx >= 0 && idx + 1 < parts.length;
      })
    ),
    { initialValue: false }
  );
  showHub = computed(() => !this._childActive());

  // ===== Store context =====
  readonly storeId   = computed(() => this.route.snapshot.paramMap.get('id') ?? mockStores[0]?.id ?? '1');
  readonly store     = computed<LocationRef|undefined>(() => mockStores.find(s => s.id === this.storeId()));
  readonly storeName = computed(() => this.store()?.name ?? `Store ${this.storeId()}`);

  // ===== Role (demo via ?role=admin|owner|manager|sales) =====
  readonly roleLabel = computed<RoleLabel>(() => {
    const qp = this.route.snapshot.queryParamMap.get('role')?.toLowerCase();
    if (qp === 'owner' || qp === 'admin') return 'Owner/Admin';
    if (qp === 'manager') return 'Manager';
    if (qp === 'sales')   return 'Sales';
    return 'Sales';
  });
  readonly isSales = computed(() => this.roleLabel() === 'Sales');

  // ===== Timeframe & seeding =====
  timeframe = signal<TF>('MTD');
  setTF(tf: TF){ this.timeframe.set(tf); }
  private profileId = computed(() => {
    const id = this.storeId();
    const pool = ['s1','s2','s3'];
    const num = parseInt(id.replace(/\D/g,''), 10);
    if (!Number.isNaN(num) && num >= 1) return pool[(num - 1) % pool.length];
    let h = 2166136261 ^ id.length;
    for (let i=0;i<id.length;i++){ h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
    return pool[(h >>> 0) % pool.length];
  });
  private profile = computed(() => profileFor(this.profileId()));
  private seedTick = signal(0);
  refresh(){ this.seedTick.update(v=>v+1); }

  private rng(key: string) {
    const seedKey = `${this.storeId()}|${this.profileId()}|${this.timeframe()}|SALES_HUB|${key}|${this.seedTick()}`;
    return makeSeed(seedKey);
  }
  private tfScale(): number { return tfScaleFn(this.timeframe()); }
  timeframeLabel = computed(() => ({MTD:'month',WTD:'week',DTD:'day',YTD:'year',QTD:'quarter'} as const)[this.timeframe()]);

  // ===== KPIs (compact) =====
  private kpiBlock = computed(() => {
    const r = this.rng('KPI');
    const p = this.profile();
    const month = new Date().getMonth();
    const noise = (lo=0.97, hi=1.05) => lo + (hi-lo) * r();
    const orders = Math.max(1, Math.round(12 * this.tfScale() * p.demandIndex * noise()));
    const mix = p.mix;
    const mixBoost = (mix.carts*0.35 + mix.sheds*0.18 + mix.play*0.06 + mix.cabins*0.04 - mix.parts*0.08);
    const aov = Math.round(3600 * (1 + mixBoost) * noise(0.98,1.04));
    const total = Math.round(orders * aov * seasonalityFactor(month, p.seasonality));
    const prev = Math.round(total * (0.90 + r()*0.06));
    const ordersPrev = Math.max(1, Math.round(orders * (0.86 + r()*0.08)));
    const aovPrev = Math.max(800, Math.round(aov * (0.96 + r()*0.03)));
    const refund = +(1.2 + r()*0.8).toFixed(1);
    return { total, prev, orders, ordersPrev, aov, aovPrev, refund };
  });

  totalSales     = computed(()=> this.kpiBlock().total);
  prevTotalSales = computed(()=> this.kpiBlock().prev);
  salesDelta     = computed(()=> this.deltaPct(this.prevTotalSales(), this.totalSales()));
  orders         = computed(()=> this.kpiBlock().orders);
  prevOrders     = computed(()=> this.kpiBlock().ordersPrev);
  ordersDelta    = computed(()=> this.deltaPct(this.prevOrders(), this.orders()));
  aov            = computed(()=> this.kpiBlock().aov);
  prevAov        = computed(()=> this.kpiBlock().aovPrev);
  refundRate     = computed(()=> this.kpiBlock().refund.toFixed(1));

  // ===== Charts =====
  chartKey = computed(() => `${this.storeId()}|${this.profileId()}|${this.timeframe()}|${this.seedTick()}`);
  private axisFromTF(): string[] {
    return this.timeframe()==='DTD' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      : this.timeframe()==='WTD' ? ['W1','W2','W3','W4']
      : this.timeframe()==='QTD' ? ['M1','M2','M3','M4']
      : this.timeframe()==='YTD' ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      : ['W1','W2','W3','W4','W5'];
  }
  private buildSalesSeries(): number[] {
    const axis = this.axisFromTF(); const n = axis.length;
    const total = this.totalSales(); const wobble = ({DTD:0.18,WTD:0.15,MTD:0.12,QTD:0.10,YTD:0.08} as Record<TF,number>)[this.timeframe()];
    const r = this.rng('SERIES'); const shift = Math.floor(r()*6);
    const out:number[] = [];
    for(let i=0;i<n;i++){
      const v = (total / n) * (0.9 + r()*0.2) * (1 + Math.sin((i+shift)/1.7)*wobble);
      out.push(Math.max(1, Math.round(v)));
    }
    return out;
  }
  salesChart = computed(() => ({
    chart: { id: this.chartKey(), type:'line', height:240, toolbar:{show:false}},
    series: [{ name: 'Sales', data: this.buildSalesSeries() }],
    xaxis: { categories: this.axisFromTF() },
    dataLabels:{enabled:false}, stroke:{curve:'smooth', width:3}, grid:{borderColor:'#eee'}
  }));

  private pipelineData = computed(() => {
    const base = Math.max(1, this.orders());
    const leads   = Math.max(1, Math.round(base * 30 / 7));
    const q       = Math.max(1, Math.round(leads * 0.66));
    const quoted  = Math.max(1, Math.round(q * 0.68));
    const verbal  = Math.max(1, Math.round(quoted * 0.60));
    const closed  = Math.max(1, Math.round(verbal * 0.53));
    return { leads, q, quoted, verbal, closed };
  });
  pipelineChart = computed(() => {
    const p = this.pipelineData();
    const seriesData = [
      {x:'Leads', y:p.leads}, {x:'Qualified', y:p.q}, {x:'Quoted', y:p.quoted},
      {x:'Verbal Yes', y:p.verbal}, {x:'Closed', y:p.closed}
    ];
    const max = seriesData.reduce((m,d)=>Math.max(m,d.y),0);
    return {
      chart:{ id: this.chartKey(), type:'bar', height:240, toolbar:{show:false}},
      plotOptions:{bar:{horizontal:true, distributed:true, borderRadius:4}},
      series:[{data:seriesData}],
      dataLabels:{enabled:true, formatter:(val:number)=>`${val} • ${max?Math.round(val/max*100):0}%`},
      grid:{borderColor:'#eee'}
    };
  });

  // ===== Rep (compact) =====
  salesId = computed(() => this.route.snapshot.queryParamMap.get('salesId') ?? 'rep-101');
  private seeded(mult=1, wobble=0){
    const key = `${this.storeId()}|${this.salesId()}|${this.timeframe()}|HUB_REP|${this.seedTick()}`;
    let h=2166136261; for(const ch of key){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const base = (h>>>0)/4294967295;
    return Math.max(0, (base*mult) + Math.sin(base*12.3)*wobble);
  }
  repWinRate  = computed(()=> Math.max(5, Math.min(95, Math.round(28 + this.seeded(1)*40))));
  repMeetings = computed(()=> Math.max(1, Math.round(3 + this.seeded(6)*6)));
  repCoverage = computed(()=> Math.round((2 + this.seeded(1.5))*10)/10);
  repAov      = computed(()=> Math.round(7500 + this.seeded(1)*1200));
  repForecastChart = computed(()=> {
    const data = [0.1,0.25,0.45,0.75,1].map((w,i)=> Math.round((w* (18000 + i*1200))*(0.8+this.seeded(0.4))));
    return {
      chart:{type:'area', height:220, toolbar:{show:false}},
      series:[{ name:'Forecast $', data }],
      xaxis:{ categories:['Lead','Qualified','Quoted','Verbal','Won'] },
      stroke:{curve:'smooth', width:2}, dataLabels:{enabled:false}, grid:{borderColor:'#eee'}
    };
  });
  repFunnelChart = computed(()=> {
    const base = 6 + Math.round(this.seeded(10)*10);
    const vals = [base*3, base*2.4, base*1.8, base*1.2, base*0.9].map(n=>Math.max(1, Math.round(n)));
    return {
      chart:{type:'bar', height:220, toolbar:{show:false}},
      plotOptions:{bar:{horizontal:true, distributed:true, borderRadius:4}},
      series:[{ data:[{x:'Lead',y:vals[0]},{x:'Qualified',y:vals[1]},{x:'Quoted',y:vals[2]},{x:'Verbal',y:vals[3]},{x:'Won',y:vals[4]}] }],
      dataLabels:{enabled:true}, grid:{borderColor:'#eee'}
    };
  });

  // ===== Helpers =====
  private deltaPct(prev:number, cur:number){ return (!prev ? 0 : Math.round(((cur-prev)/prev)*100)); }
}
