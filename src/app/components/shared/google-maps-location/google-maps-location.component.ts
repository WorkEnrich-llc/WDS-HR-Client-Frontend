import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { ToasterMessageService } from '../../../core/services/tostermessage/tostermessage.service';

export interface LocationData {
  latitude: number;
  longitude: number;
  radiusRange: number;
  displayLatitude: string;
  displayLongitude: string;
  map_country?: string;
  map_city?: string;
  map_region?: string;
  map_address?: string;
}

@Component({
  selector: 'app-google-maps-location',
  standalone: true,
  imports: [FormsModule, GoogleMapsModule],
  templateUrl: './google-maps-location.component.html',
  styleUrl: './google-maps-location.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class GoogleMapsLocationComponent implements OnInit {
  @Input() initialLocation: LocationData = {
    latitude: 0,
    longitude: 0,
    radiusRange: 120,
    displayLatitude: '',
    displayLongitude: ''
  };

  @Input() title: string = 'Location';
  @Input() isEditMode: boolean = false;
  @Input() mapHeight: string = '300px';
  @Input() mapWidth: string = '50%';

  @Output() locationChanged = new EventEmitter<LocationData>();
  @Output() locationConfirmed = new EventEmitter<LocationData>();

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

  // Branch location marker
  branchMarker: google.maps.LatLngLiteral | null = null;

  // Marker options
  markerOptions: google.maps.MarkerOptions = {
    draggable: true,
    animation: google.maps.Animation.DROP,
  };

  // Circle for radius visualization
  circleOptions: google.maps.CircleOptions = {
    fillColor: '#377AFD',
    fillOpacity: 0.15,
    strokeColor: '#377AFD',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    clickable: false,
    draggable: false,
    editable: true,
    radius: 120,
  };
  locationData: LocationData = {
    latitude: 0,
    longitude: 0,
    radiusRange: 120,
    displayLatitude: '',
    displayLongitude: '',
    map_country: '',
    map_city: '',
    map_region: '',
    map_address: ''
  };


  // Form controls for location data
  latitude: number = 0;
  longitude: number = 0;
  displayLatitude: string = '';
  displayLongitude: string = '';
  radiusRange: number = 120;
  locationSearchTerm: string = '';
  map_country: string = '';
  map_city: string = '';
  map_region: string = '';
  map_address: string = '';

  // Info window content
  infoWindowContent = 'Location';
  infoWindowOptions: google.maps.InfoWindowOptions = {
    maxWidth: 300
  };

  constructor(private toasterMessageService: ToasterMessageService) { }

  ngOnInit(): void {
    this.initializeLocation();
    this.infoWindowContent = this.title;
  }

  private initializeLocation(): void {
    if (this.initialLocation) {
      this.latitude = this.initialLocation.latitude || 0;
      this.longitude = this.initialLocation.longitude || 0;
      this.radiusRange = this.initialLocation.radiusRange || 120;
      this.displayLatitude = this.initialLocation.displayLatitude || '';
      this.displayLongitude = this.initialLocation.displayLongitude || '';

      // Set up map if coordinates are provided
      if (this.latitude && this.longitude) {
        const location = { lat: this.latitude, lng: this.longitude };
        this.center = location;
        this.branchMarker = location;
        this.zoom = 15;
        this.updateCircleOptions();
      }
    }
  }

  // Map-related methods
  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const clickedLocation = event.latLng.toJSON();
      this.branchMarker = clickedLocation;
      this.latitude = clickedLocation.lat;
      this.longitude = clickedLocation.lng;
      this.center = clickedLocation;
      this.zoom = 15;
      this.updateCircleOptions();
      this.updateAddressFromCoordinates(this.latitude, this.longitude);
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng && this.branchMarker) {
      const newPosition = event.latLng.toJSON();
      this.branchMarker = newPosition;
      this.latitude = newPosition.lat;
      this.longitude = newPosition.lng;
      this.updateCircleOptions();
      this.updateAddressFromCoordinates(this.latitude, this.longitude);
    }
  }

  // Update circle options when location changes
  updateCircleOptions() {
    if (this.branchMarker) {
      this.circleOptions = {
        ...this.circleOptions,
        center: this.branchMarker,
        radius: this.radiusRange
      };
    }
  }

  // Handle circle radius change
  onCircleRadiusChanged(event: any) {
    if (event && event.target) {
      this.radiusRange = Math.round(event.target.getRadius());
      this.emitLocationChange();
    }
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.center = currentLocation;
          this.branchMarker = currentLocation;
          this.latitude = currentLocation.lat;
          this.longitude = currentLocation.lng;
          this.zoom = 15;
          this.updateCircleOptions();
          this.emitLocationChange();
        },
        (error) => {
          console.error('Error getting current location:', error);
          this.toasterMessageService.sendMessage('Unable to get your location. Please try manually selecting a location.');
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      this.toasterMessageService.sendMessage('Geolocation is not supported by this browser.');
    }
  }

  searchLocation() {
    if (!this.locationSearchTerm.trim()) {
      return;
    }

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: this.locationSearchTerm }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location.toJSON();
        this.center = location;
        this.branchMarker = location;
        this.latitude = location.lat;
        this.longitude = location.lng;
        this.zoom = 15;
        this.updateCircleOptions();
        this.toasterMessageService.showSuccess(`Location found: ${results[0].formatted_address}`);
        this.emitLocationChange();
      } else {
        console.error('Geocode was not successful for the following reason:', status);
        this.toasterMessageService.showError('Location not found. Please try a different search term.');
      }
    });
  }

  // Update map when latitude/longitude inputs change manually
  onLatitudeChange() {
    const lat = parseFloat(this.displayLatitude);
    const lng = parseFloat(this.displayLongitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      const newLocation = { lat: lat, lng: lng };
      this.center = newLocation;
      this.branchMarker = newLocation;
      this.latitude = lat;
      this.longitude = lng;
      this.zoom = 15;
      this.updateCircleOptions();
      this.emitLocationChange();
    }
  }

  onLongitudeChange() {
    const lat = parseFloat(this.displayLatitude);
    const lng = parseFloat(this.displayLongitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      const newLocation = { lat: lat, lng: lng };
      this.center = newLocation;
      this.branchMarker = newLocation;
      this.latitude = lat;
      this.longitude = lng;
      this.zoom = 15;
      this.updateCircleOptions();
      this.emitLocationChange();
    }
  }

  // Update radius when input changes
  onRadiusChange() {
    this.updateCircleOptions();
    this.emitLocationChange();
  }

 async confirmLocation() {
  if (this.branchMarker) {
    this.displayLatitude = this.latitude.toFixed(6);
    this.displayLongitude = this.longitude.toFixed(6);

    const addressData = await this.reverseGeocode(this.latitude, this.longitude);

    this.map_country = addressData.country;
    this.map_city = addressData.city;
    this.map_region = addressData.region;
    this.map_address = addressData.fullAddress;

    const locationData: LocationData = {
      latitude: this.latitude,
      longitude: this.longitude,
      radiusRange: this.radiusRange,
      displayLatitude: this.displayLatitude,
      displayLongitude: this.displayLongitude,
      map_country: this.map_country,
      map_city: this.map_city,
      map_region: this.map_region,
      map_address: this.map_address
    };

    this.locationConfirmed.emit(locationData);
    this.toasterMessageService.showSuccess(`Location confirmed ${this.map_address}`);
  }
}



  private emitLocationChange() {
    const locationData: LocationData = {
      latitude: this.latitude,
      longitude: this.longitude,
      radiusRange: this.radiusRange,
      displayLatitude: this.displayLatitude,
      displayLongitude: this.displayLongitude,
      map_country: this.map_country,
      map_city: this.map_city,
      map_region: this.map_region,
      map_address: this.map_address
    };
    this.locationChanged.emit(locationData);
  }
  private updateAddressFromCoordinates(lat: number, lng: number) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const components = results[0].address_components;

        this.map_address = results[0].formatted_address;
        this.map_country = this.getComponent(components, 'country');
        this.map_city = this.getComponent(components, 'locality') || this.getComponent(components, 'administrative_area_level_2');
        this.map_region = this.getComponent(components, 'sublocality') 
                || this.getComponent(components, 'neighborhood')
                || this.getComponent(components, 'locality') 
                || this.getComponent(components, 'administrative_area_level_2');

        this.emitLocationChange();
      }
    });
  }


  private getComponent(components: google.maps.GeocoderAddressComponent[], type: string): string {
    const comp = components.find(c => c.types.includes(type));
    return comp ? comp.long_name : '';
  }

  // Public method to set location programmatically (useful for edit mode)
  setLocation(locationData: LocationData): void {
    this.latitude = locationData.latitude;
    this.longitude = locationData.longitude;
    this.radiusRange = locationData.radiusRange;
    this.displayLatitude = locationData.displayLatitude;
    this.displayLongitude = locationData.displayLongitude;

    if (this.latitude && this.longitude) {
      const location = { lat: this.latitude, lng: this.longitude };
      this.center = location;
      this.branchMarker = location;
      this.zoom = 15;
      this.updateCircleOptions();
    }
  }
  onLocationChanged(event: LocationData) {
    this.locationData.latitude = event.latitude;
    this.locationData.longitude = event.longitude;
    this.locationData.radiusRange = event.radiusRange;
    this.locationData.displayLatitude = event.displayLatitude;
    this.locationData.displayLongitude = event.displayLongitude;
  }

  onLocationConfirmed(event: LocationData) {
    this.locationData = { ...event };

    this.reverseGeocode(this.locationData.latitude, this.locationData.longitude)
      .then(addressData => {
        this.locationData.map_country = addressData.country;
        this.locationData.map_city = addressData.city;
        this.locationData.map_region = addressData.region;
        this.locationData.map_address = addressData.fullAddress;
      });
  }

  async reverseGeocode(lat: number, lng: number): Promise<any> {
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const result = results[0];
          const addressComponents = result.address_components;

          const country = addressComponents.find(c => c.types.includes('country'))?.long_name || '';
          const city = addressComponents.find(c => c.types.includes('locality'))?.long_name
            || addressComponents.find(c => c.types.includes('administrative_area_level_2'))?.long_name || '';
          const region = addressComponents.find(c => c.types.includes('sublocality'))?.long_name
            || addressComponents.find(c => c.types.includes('neighborhood'))?.long_name || '';
          const fullAddress = result.formatted_address;

          resolve({ country, city, region, fullAddress });
        } else {
          resolve({ country: '', city: '', region: '', fullAddress: '' });
        }
      });
    });
  }


  // Get current location data
  getLocationData(): LocationData {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      radiusRange: this.radiusRange,
      displayLatitude: this.displayLatitude,
      displayLongitude: this.displayLongitude
    };
  }
}
