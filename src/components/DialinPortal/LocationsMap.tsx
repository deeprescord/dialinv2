import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { LocationItem } from '@/data/catalogs';

interface LocationsMapProps {
  locations: LocationItem[];
}

export function LocationsMap({ locations }: LocationsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenSet, setTokenSet] = useState(false);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken.trim()) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken.trim();
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        projection: 'globe' as any,
        zoom: 2,
        center: [-74.006, 40.7128], // NYC default
        pitch: 45,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Enable scroll zoom for interaction
      map.current.scrollZoom.enable();

      // Add atmosphere and fog effects
      map.current.on('style.load', () => {
        map.current?.setFog({
          color: 'rgb(50, 50, 70)',
          'high-color': 'rgb(100, 100, 150)',
          'horizon-blend': 0.3,
        });
      });

      // Rotation animation settings
      const secondsPerRevolution = 180;
      const maxSpinZoom = 4;
      const slowSpinZoom = 2;
      let userInteracting = false;
      let spinEnabled = true;

      // Spin globe function
      function spinGlobe() {
        if (!map.current) return;
        
        const zoom = map.current.getZoom();
        if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
          let distancePerSecond = 360 / secondsPerRevolution;
          if (zoom > slowSpinZoom) {
            const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
            distancePerSecond *= zoomDif;
          }
          const center = map.current.getCenter();
          center.lng -= distancePerSecond;
          map.current.easeTo({ center, duration: 1000, easing: (n) => n });
        }
      }

      // Event listeners for interaction
      map.current.on('mousedown', () => {
        userInteracting = true;
      });
      
      map.current.on('dragstart', () => {
        userInteracting = true;
      });
      
      map.current.on('mouseup', () => {
        userInteracting = false;
        spinGlobe();
      });
      
      map.current.on('touchend', () => {
        userInteracting = false;
        spinGlobe();
      });

      map.current.on('moveend', () => {
        spinGlobe();
      });

      // Add location markers
      locations.forEach((location, index) => {
        // Generate random coordinates for demo purposes
        const lat = 40.7128 + (Math.random() - 0.5) * 60;
        const lng = -74.006 + (Math.random() - 0.5) * 120;

        const marker = new mapboxgl.Marker({
          color: '#8B5CF6',
          scale: 0.8
        })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="text-sm">
                  <div class="font-semibold text-foreground">${location.name}</div>
                  <div class="text-muted-foreground">${location.distance}</div>
                </div>
              `)
          )
          .addTo(map.current!);
      });

      // Start the globe spinning
      spinGlobe();

      setTokenSet(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!tokenSet) {
    return (
      <div className="relative w-full h-[400px] bg-background/20 backdrop-blur-sm rounded-lg border border-white/10 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-white mb-2">Interactive Location Map</h3>
          <p className="text-white/60 mb-4 text-sm">
            Enter your Mapbox public token to view locations on an interactive globe.
            Get your token at <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              placeholder="pk.eyJ1Ijp..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="bg-background/50 border-white/20 text-white placeholder:text-white/40"
            />
            <Button 
              onClick={initializeMap}
              disabled={!mapboxToken.trim()}
              variant="secondary"
            >
              Load Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/5 rounded-lg" />
    </div>
  );
}