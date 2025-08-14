import { Component } from '@angular/core';
import { VersionService } from '../../../core/services/version.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-version-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="version-display" [ngClass]="{'production': versionService.isProduction(), 'staging': versionService.isStaging(), 'development': versionService.isDevelopment()}">
      <small>
        <span class="version-text">{{versionService.getVersionString()}}</span>
        @if (!versionService.isProduction()) {
          <span class="branch-text">{{versionService.getBranch()}}</span>
        }
      </small>
    </div>
    `,
  styles: [`
    .version-display {
      position: fixed;
      bottom: 10px;
      right: 10px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      z-index: 9999;
      opacity: 0.7;
      transition: opacity 0.3s;
    }
    
    .version-display:hover {
      opacity: 1;
    }
    
    .version-display.production {
      background-color: #4CAF50;
      color: white;
    }
    
    .version-display.staging {
      background-color: #FF9800;
      color: white;
    }
    
    .version-display.development {
      background-color: #2196F3;
      color: white;
    }
    
    .version-text {
      font-weight: bold;
    }
    
    .branch-text {
      margin-left: 4px;
      opacity: 0.8;
    }
    
    .branch-text::before {
      content: '(';
    }
    
    .branch-text::after {
      content: ')';
    }
  `]
})
export class VersionDisplayComponent {
  constructor(public versionService: VersionService) {}
}
