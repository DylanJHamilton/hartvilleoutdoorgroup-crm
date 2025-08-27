import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div style="min-height:60vh;display:grid;place-items:center;padding:24px">
      <div>
        <h2 style="margin:0 0 8px">Access denied</h2>
        <p>You don’t have permission to view the portal.</p>
      </div>
    </div>
  `,
})
export class UnauthorizedPage {}
