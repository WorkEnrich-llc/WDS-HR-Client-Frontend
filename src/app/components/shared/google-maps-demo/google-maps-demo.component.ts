import { Component, OnInit } from '@angular/core';

import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-google-maps-demo',
  standalone: true,
  imports: [GoogleMapsModule],
  templateUrl: './google-maps-demo.component.html',
  styleUrls: ['./google-maps-demo.component.css']
})
export class GoogleMapsDemoComponent implements OnInit {

  // Map configuration
  center: google.maps.LatLngLiteral = { lat: 25.2048, lng: 55.2708 }; // Dubai coordinates
  zoom = 10;

  // Map options
  mapOptions: google.maps.MapOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 20,
    minZoom: 4,
  };

  // Markers
  markers: google.maps.LatLngLiteral[] = [
    { lat: 25.2048, lng: 55.2708 }, // Dubai
    { lat: 25.1972, lng: 55.2744 }, // Business Bay
    { lat: 25.0761, lng: 55.1094 }, // Dubai Marina
    { lat: 25.2677, lng: 55.3097 }, // Deira
  ];

  // Marker options
  markerOptions: google.maps.MarkerOptions = {
    draggable: false,
    animation: google.maps.Animation.DROP,
  };

  // Info window content
  infoWindowContent = 'Welcome to our office location!';
  infoWindowOptions: google.maps.InfoWindowOptions = {
    maxWidth: 300
  };

  constructor() { }

  ngOnInit(): void {
    // Component initialization
  }

  // Handle map click event
  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const clickedLocation = event.latLng.toJSON();

      // Add new marker at clicked location
      this.markers.push(clickedLocation);
    }
  }

  // Handle marker click event
  onMarkerClick(marker: google.maps.LatLngLiteral, index: number) {
    // console.log('Marker clicked:', marker, 'Index:', index);
  }

  // Remove marker
  removeMarker(index: number) {
    this.markers.splice(index, 1);
  }

  // Center map on specific location
  centerOnLocation(lat: number, lng: number) {
    this.center = { lat, lng };
    this.zoom = 15;
  }

  // Get current location
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.center = currentLocation;
          this.zoom = 15;

          // Add marker for current location
          this.markers.push(currentLocation);
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  // Search for places (basic implementation)
  searchPlace(query: string) {
    // This is a basic implementation
    // For production, you would use Google Places API
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: query }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location.toJSON();
        this.center = location;
        this.zoom = 15;
        this.markers.push(location);
      } else {
        console.error('Geocode was not successful for the following reason:', status);
      }
    });
  }
}
