// src/app/core/rbac/has-permission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { ContextService } from '../context/context.service';

@Directive({ selector: '[hogHasPermission]' })
export class HasPermissionDirective {
  private tpl = inject(TemplateRef<any>);
  private vcr = inject(ViewContainerRef);
  private ctx = inject(ContextService);
  private needed: string[] = [];

  constructor() {
    // Re-evaluate when roles or store change
    effect(() => { this.render(); });
  }

  @Input() set hogHasPermission(value: string | string[]) {
    this.needed = Array.isArray(value) ? value : [value];
    this.render();
  }

  private render() {
    this.vcr.clear();
    const perms = new Set<string>(this.rolesToPermissions());
    const ok = this.needed.every(p => perms.has('*') || perms.has(p));
    if (ok) this.vcr.createEmbeddedView(this.tpl);
  }

  // Naive role→permission mapping; replace with server-provided perms later
  private rolesToPermissions(): string[] {
    const roles = this.ctx.roles();
    if (roles.includes('OWNER') || roles.includes('ADMIN')) return ['*'];

    const map: Record<string, string[]> = {
      MANAGER:  ['store.view','sales.view','inventory.view','service.view','delivery.view','rentals.view','reports.view'],
      SALES:    ['sales.view','sales.edit'],
      SERVICE:  ['service.view','service.edit'],
      DELIVERY: ['delivery.view','delivery.edit'],
      RENTALS:  ['rentals.view','rentals.edit'],
      CS:       ['store.view']
    };

    const set = new Set<string>();
    roles.forEach(r => (map[r] ?? []).forEach(p => set.add(p)));
    return Array.from(set);
  }
}
