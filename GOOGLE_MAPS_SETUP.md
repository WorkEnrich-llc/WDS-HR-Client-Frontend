# Google Maps Integration Setup Guide

## Overview
This guide will help you set up Google Maps integration in your Angular application with a working demo.

## Prerequisites
- Angular 20+ application
- Google Cloud Platform account
- Google Maps API key

## Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API (optional)
   - Directions API (optional)
4. Create credentials (API Key)
5. Restrict the API key (recommended for production):
   - Application restrictions: HTTP referrers
   - Add your domain(s)
   - API restrictions: Select the APIs you enabled

## Step 2: Configure Environment Variables

Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` in the following files with your actual API key:

### Development Environment
File: `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://dev-api.workenrich.com/',
  googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE', // Replace this
  firebaseConfig: {
    // ... your firebase config
  }
};
```

### Production Environment
File: `src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://dev-api.workenrich.com/',
  googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE', // Replace this
  firebaseConfig: {
    // ... your firebase config
  }
};
```

### Update index.html
File: `src/index.html`
Replace the API key in the script tag:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE&libraries=places"></script>
```

## Step 3: Install Dependencies

The following packages have been installed:
- `@angular/google-maps` - Angular Google Maps component library

## Step 4: What's Included

### Components Created:
1. **GoogleMapsDemoComponent** - A comprehensive demo showcasing various Google Maps features
   - Location: `src/app/components/shared/google-maps-demo/`
   - Features:
     - Interactive map with click events
     - Marker management (add/remove)
     - Current location detection
     - Address search
     - Info windows
     - Predefined locations

### Services Created:
1. **GoogleMapsService** - Utility service for Google Maps operations
   - Location: `src/app/core/services/google-maps/`
   - Features:
     - Dynamic API loading
     - Geocoding and reverse geocoding
     - Distance calculations
     - Directions service
     - Utility methods

### Routes Added:
1. **Standalone Route**: `/google-maps-demo` - Direct access to the demo
2. **Settings Route**: `/settings/google-maps-demo` - Access through settings menu

## Step 5: Testing the Demo

### Option 1: Direct Access
1. Start your development server: `ng serve`
2. Navigate to: `http://localhost:4200/google-maps-demo`

### Option 2: Through Settings
1. Login to your application
2. Navigate to Settings
3. Click on "Google Maps Demo"

## Step 6: Demo Features

The demo includes the following interactive features:

### Basic Map Operations:
- **Map Display**: Shows a map centered on Dubai
- **Zoom Controls**: Zoom in/out functionality
- **Map Types**: Different map views (roadmap, satellite, etc.)

### Marker Management:
- **Click to Add**: Click anywhere on the map to add a marker
- **Predefined Markers**: Several markers in Dubai locations
- **Info Windows**: Click markers to see information
- **Remove Markers**: Delete markers using the trash icon

### Location Features:
- **Current Location**: Get user's current GPS location
- **Address Search**: Search for addresses and places
- **Quick Navigation**: Buttons to jump to specific locations

### Interactive Elements:
- **Real-time Coordinates**: Display current map center
- **Marker List**: View all markers with coordinates
- **Zoom Level Display**: Current zoom level indicator

## Step 7: Customization

### Changing Default Location:
Edit `google-maps-demo.component.ts`:
```typescript
center: google.maps.LatLngLiteral = { lat: YOUR_LAT, lng: YOUR_LNG };
```

### Adding More Predefined Locations:
Edit the `markers` array in `google-maps-demo.component.ts`:
```typescript
markers: google.maps.LatLngLiteral[] = [
  { lat: 25.2048, lng: 55.2708 }, // Dubai
  { lat: YOUR_LAT, lng: YOUR_LNG }, // Your location
  // Add more locations...
];
```

### Styling the Map:
Modify `mapOptions` in `google-maps-demo.component.ts`:
```typescript
mapOptions: google.maps.MapOptions = {
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  styles: [
    // Add your custom map styles here
  ],
  // Other options...
};
```

## Step 8: Production Deployment

### Security Considerations:
1. **API Key Restrictions**: Always restrict your API key in production
2. **Domain Restrictions**: Limit API key usage to your domains
3. **API Restrictions**: Only enable the APIs you need
4. **Environment Variables**: Use environment variables for sensitive data

### Performance Optimization:
1. **Lazy Loading**: The Google Maps API is loaded only when needed
2. **Component Optimization**: Use OnPush change detection strategy
3. **Memory Management**: Properly destroy map instances

## Step 9: Troubleshooting

### Common Issues:

#### 1. "Google is not defined" Error
- Ensure the Google Maps script is loaded in `index.html`
- Check that your API key is valid
- Verify the API key has the correct permissions

#### 2. Map Not Displaying
- Check browser console for errors
- Verify API key is correctly set in environment files
- Ensure Google Maps JavaScript API is enabled

#### 3. Geocoding Not Working
- Enable Geocoding API in Google Cloud Console
- Check API key restrictions
- Verify network connectivity

#### 4. Current Location Not Working
- Ensure HTTPS in production (required for geolocation)
- Check browser permissions
- Handle geolocation errors appropriately

### Debug Mode:
Add console logging to track issues:
```typescript
// In google-maps-demo.component.ts
ngOnInit(): void {
  console.log('Google Maps API Key:', environment.googleMapsApiKey);
  console.log('Google object available:', typeof google !== 'undefined');
}
```

## Step 10: Advanced Features

### Adding Directions:
Use the GoogleMapsService to get directions between points:
```typescript
this.googleMapsService.getDirections(origin, destination)
  .then(result => {
    // Display directions on map
  })
  .catch(error => {
    console.error('Directions error:', error);
  });
```

### Places Autocomplete:
Add places autocomplete to search input:
```typescript
// In component after map loads
const autocomplete = new google.maps.places.Autocomplete(input);
autocomplete.addListener('place_changed', () => {
  const place = autocomplete.getPlace();
  // Handle place selection
});
```

### Custom Markers:
Use custom marker icons:
```typescript
markerOptions: google.maps.MarkerOptions = {
  icon: {
    url: 'path/to/your/icon.png',
    scaledSize: new google.maps.Size(40, 40)
  }
};
```

## Support

For additional help:
1. Check the [Angular Google Maps documentation](https://github.com/angular/components/tree/main/src/google-maps)
2. Refer to [Google Maps JavaScript API documentation](https://developers.google.com/maps/documentation/javascript)
3. Review the demo component code for implementation examples

## Next Steps

After setting up the basic integration, consider:
1. Adding real-time location tracking
2. Implementing geofencing
3. Adding heat maps
4. Creating custom map controls
5. Integrating with your backend for dynamic markers
