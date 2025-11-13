import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NetworkService } from '../../../core/services/network/network.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-network-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!(isOnline$ | async)) {
      <div
        class="network-status-banner offline"
        role="alert">
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-width="1.5"><path d="M22 12a10 10 0 1 1-20.001 0A10 10 0 0 1 22 12Z"/><path d="M16 12c0 1.313-.104 2.614-.305 3.827c-.2 1.213-.495 2.315-.867 3.244c-.371.929-.812 1.665-1.297 2.168c-.486.502-1.006.761-1.531.761s-1.045-.259-1.53-.761c-.486-.503-.927-1.24-1.298-2.168c-.372-.929-.667-2.03-.868-3.244A23.6 23.6 0 0 1 8 12c0-1.313.103-2.614.304-3.827s.496-2.315.868-3.244c.371-.929.812-1.665 1.297-2.168C10.955 2.26 11.475 2 12 2s1.045.259 1.53.761c.486.503.927 1.24 1.298 2.168c.372.929.667 2.03.867 3.244C15.897 9.386 16 10.687 16 12Z"/><path stroke-linecap="round" d="M2 12h20"/></g></svg>
        <span>No internet connection. Please check your connection.</span>
      </div>
    }
    
    @if (showOnlineMessage && (isOnline$ | async)) {
      <div
        class="network-status-banner online"
        role="alert">
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-width="1.5"><path d="M22 12a10 10 0 1 1-20.001 0A10 10 0 0 1 22 12Z"/><path d="M16 12c0 1.313-.104 2.614-.305 3.827c-.2 1.213-.495 2.315-.867 3.244c-.371.929-.812 1.665-1.297 2.168c-.486.502-1.006.761-1.531.761s-1.045-.259-1.53-.761c-.486-.503-.927-1.24-1.298-2.168c-.372-.929-.667-2.03-.868-3.244A23.6 23.6 0 0 1 8 12c0-1.313.103-2.614.304-3.827s.496-2.315.868-3.244c.371-.929.812-1.665 1.297-2.168C10.955 2.26 11.475 2 12 2s1.045.259 1.53.761c.486.503.927 1.24 1.298 2.168c.372.929.667 2.03.867 3.244C15.897 9.386 16 10.687 16 12Z"/><path stroke-linecap="round" d="M2 12h20"/></g></svg>
        <span>Connection restored!</span>
      </div>
    }
    `,
  styles: [`
    .network-status-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      padding: 8px 16px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      animation: slideDown 0.3s ease-in-out;
    }

    .offline {
      background-color: #dc3545;
      color: white;
      border-bottom: 1px solid #b02a37;
    }

    .online {
      background-color: #28a745;
      color: white;
      border-bottom: 1px solid #1e7e34;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .fas {
      font-size: 16px;
    }
  `]
})
export class NetworkStatusComponent implements OnInit {
  isOnline$: Observable<boolean>;
  showOnlineMessage = false;
  private wasOffline = false;

  constructor(private networkService: NetworkService) {
    this.isOnline$ = this.networkService.getOnlineStatus();
  }

  ngOnInit() {
    this.isOnline$.subscribe(isOnline => {
      if (!isOnline) {
        this.wasOffline = true;
        this.showOnlineMessage = false;
      } else if (this.wasOffline && isOnline) {
        this.showOnlineMessage = true;
        // Hide the "connection restored" message after 3 seconds
        setTimeout(() => {
          this.showOnlineMessage = false;
        }, 3000);
      }
    });
  }
}
