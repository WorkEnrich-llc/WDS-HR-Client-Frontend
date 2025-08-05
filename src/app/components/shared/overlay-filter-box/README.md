# Shared Components Library

This directory contains reusable shared components used across the WDS HR Client Frontend application. Each component encapsulates a common UI pattern or utility.

## Available Components

- **Overlay Filter Box** (`overlay-filter-box.component`)
- *(Add more shared components here as you create them.)*

---

## Overlay Filter Box

The `OverlayFilterBoxComponent` provides a modal-like overlay container that you can open to display custom content (forms, filters, details, etc.). It supports animations and custom sizing.

### Selector

```html
<app-overlay-filter-box
  [title]="string"
  [isOverlayVisible]="boolean"
  [customWidth]="string"
  (closeOverlay)="eventHandler()">
  <!-- Insert any content here -->
</app-overlay-filter-box>
```

### Inputs

| Input Name        | Type      | Description                              |
| ----------------- | --------- | ---------------------------------------- |
| `title`           | `string`  | Title text displayed at the top.         |
| `isOverlayVisible`| `boolean` | Controls whether the overlay is shown.   |
| `customWidth`     | `string`  | Width of the overlay container (e.g., `400px`, `50%`). |

### Outputs

| Output Event    | Type     | Description                                |
| --------------- | -------- | ------------------------------------------ |
| `closeOverlay`  | `Event`  | Emitted when the overlay is requested to close.

### Usage Example

```html
<!-- In your component template -->
<button (click)="showOverlay()">Open Filter</button>

<app-overlay-filter-box
  [title]="'Filter Options'"
  [isOverlayVisible]="isFilterOpen"
  [customWidth]="'600px'"
  (closeOverlay)="onFilterClose()">
  <!-- Your filter form or controls go here -->
  <form>
    <!-- ... -->
  </form>
</app-overlay-filter-box>
```

```ts
// In your component class
isFilterOpen = false;

showOverlay() {
  this.isFilterOpen = true;
}

onFilterClose() {
  this.isFilterOpen = false;
  // Handle any reset logic
}
```

### Styling and Animation

The overlay uses simple CSS classes for sliding in/out. You can override or extend these animations in your global styles or component styles if needed.

---

*(This README serves as living documentation. Keep it updated when shared components change or new ones are added.)*
