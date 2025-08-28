// src/app/app.component.ts (or src/app/app.ts)
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<h2>Hello</h2>',
})
export class AppComponent {}
