import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.ts';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private mapLoaded = false;
  private mapLoadingPromise: Promise<any> | null = null;

  constructor() { }

  loadGoogleMaps(): Promise<any> {
    // If already loaded, return resolved promise
    if (this.mapLoaded) {
      return Promise.resolve();
    }

    // If loading is in progress, return the existing promise
    if (this.mapLoadingPromise) {
      return this.mapLoadingPromise;
    }

    // Start loading Google Maps API
    this.mapLoadingPromise = new Promise((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (typeof google !== 'undefined' && google.maps) {
        this.mapLoaded = true;
        resolve(google.maps);
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places&callback=initMap`;

      // Set up callback
      (window as any).initMap = () => {
        this.mapLoaded = true;
        resolve(google.maps);
      };

      // Handle errors
      script.onerror = (error) => {
        reject(error);
      };

      // Append to document
      document.head.appendChild(script);
    });

    return this.mapLoadingPromise;
  }

  isLoaded(): boolean {
    return this.mapLoaded;
  }

  // Utility methods for common Google Maps operations

  geocodeAddress(address: string): Promise<google.maps.GeocoderResult[]> {
    return new Promise((resolve, reject) => {
      if (!this.mapLoaded) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  reverseGeocode(lat: number, lng: number): Promise<google.maps.GeocoderResult[]> {
    return new Promise((resolve, reject) => {
      if (!this.mapLoaded) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const geocoder = new google.maps.Geocoder();
      const latLng = new google.maps.LatLng(lat, lng);

      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }

  calculateDistance(
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral
  ): number {
    if (!this.mapLoaded) {
      return 0;
    }

    const originLatLng = new google.maps.LatLng(origin.lat, origin.lng);
    const destLatLng = new google.maps.LatLng(destination.lat, destination.lng);

    return google.maps.geometry.spherical.computeDistanceBetween(originLatLng, destLatLng);
  }

  // Get directions between two points
  getDirections(
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral,
    travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
  ): Promise<google.maps.DirectionsResult> {
    return new Promise((resolve, reject) => {
      if (!this.mapLoaded) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const directionsService = new google.maps.DirectionsService();

      directionsService.route({
        origin,
        destination,
        travelMode
      }, (result, status) => {
        if (status === 'OK' && result) {
          resolve(result);
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });
  }
}
