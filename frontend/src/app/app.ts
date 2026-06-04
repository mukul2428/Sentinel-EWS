import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <nav class="navbar" *ngIf="auth.isLoggedIn()">
        <div class="nav-brand">
          <span class="brand-icon">⬡</span>
          <span class="brand-text">SENTINEL <span class="brand-sub">EWS</span></span>
        </div>

        <button class="hamburger" *ngIf="auth.isLoggedIn()" (click)="toggleMenu()" aria-label="Toggle menu">
          <span [class.open]="menuOpen"></span>
        </button>

        <div class="nav-links" [class.open]="menuOpen">
          <a routerLink="/dashboard" routerLinkActive="active" (click)="closeMenu()">Dashboard</a>
          <a routerLink="/query" routerLinkActive="active" *ngIf="auth.isAnalyst()" (click)="closeMenu()">Query</a>
          <a routerLink="/portfolio" routerLinkActive="active" *ngIf="auth.isAnalyst()" (click)="closeMenu()">Portfolio</a>
        </div>

        <div class="nav-user">
          <span class="user-badge" [ngClass]="auth.getUser()?.role">{{ auth.getUser()?.role }}</span>
          <span class="user-name">{{ auth.getUser()?.name }}</span>
          <button class="logout-btn" (click)="auth.logout()">Sign Out</button>
        </div>
      </nav>
      <div class="overlay" *ngIf="menuOpen" (click)="closeMenu()"></div>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrl: './app.scss'
})
export class App {
  menuOpen = false;
  constructor(public auth: AuthService) {}

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
}
