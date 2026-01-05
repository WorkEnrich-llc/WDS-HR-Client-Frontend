# Adding Network Status Component to Your App

To display the network status banner across your entire application, add the `NetworkStatusComponent` to your main app component or layout.

## Example: Adding to App Component

```html
<!-- app.component.html -->
<app-network-status></app-network-status>
<router-outlet></router-outlet>
```

```typescript
// app.component.ts
import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NetworkStatusComponent } from "./components/shared/network-status/network-status.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, NetworkStatusComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  title = "WDS-HR-Client-Frontend";
}
```

## Example: Adding to Layout Components

For different layouts, you can add it to specific layout components:

```html
<!-- auth-layout.component.html -->
<app-network-status></app-network-status>
<div class="auth-container">
  <router-outlet></router-outlet>
</div>
```

## CSS Adjustments

If you have a fixed header, you might need to adjust the top position:

```css
/* In your global styles or component styles */
app-network-status .network-status-banner {
  top: 60px; /* Adjust based on your header height */
}
```

## Demo Component Usage

To test the error handling functionality, you can temporarily add the demo component:

```html
<!-- Add this to any component template for testing -->
<app-error-handling-demo></app-error-handling-demo>
```

```typescript
import { ErrorHandlingDemoComponent } from './components/shared/error-handling-demo/error-handling-demo.component';

@Component({
  // ...
  imports: [ErrorHandlingDemoComponent],
  // ...
})
```
