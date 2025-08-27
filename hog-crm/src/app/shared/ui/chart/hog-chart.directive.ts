import { Directive, ElementRef, Input, OnChanges, SimpleChanges, OnDestroy, AfterViewInit } from '@angular/core';
import ApexCharts from 'apexcharts';

@Directive({
  standalone: true,
  selector: '[hogChart]',
})
export class HogChartDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input('hogChart') options: any;

  private chart?: ApexCharts;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (!this.options) return;
    this.chart = new ApexCharts(this.el.nativeElement, this.options);
    this.chart.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chart || !changes['options']) return;
    // soft update; no animations on option change for MVP
    this.chart.updateOptions(this.options, false, true);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
