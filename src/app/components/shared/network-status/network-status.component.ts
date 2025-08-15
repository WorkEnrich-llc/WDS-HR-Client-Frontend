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
        <i class="fas fa-wifi"></i>
        <span>No internet connection. Please check your connection.</span>
      </div>
    }
    
    @if (showOnlineMessage && (isOnline$ | async)) {
      <div
        class="network-status-banner online"
        role="alert">
        <i class="fas fa-wifi"></i>
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
