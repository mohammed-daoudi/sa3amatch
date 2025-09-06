'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface Location {
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  city?: string;
  district?: string;
}

interface FieldMapProps {
  location: Location;
  fieldName?: string;
  className?: string;
  height?: string;
}

// Dynamic import for Leaflet to handle SSR
let L: any = null;
if (typeof window !== 'undefined') {
  import('leaflet').then((leaflet) => {
    L = leaflet.default;

    // Fix for default markers in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  });
}

export default function FieldMap({ location, fieldName, className = '', height = '300px' }: FieldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Only initialize map on client side when Leaflet is loaded
    if (typeof window === 'undefined' || !L || !mapRef.current) return;

    // Avoid re-initialization
    if (mapInstanceRef.current) return;

    const [lng, lat] = location.coordinates;

    // Create map instance
    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
    });

    // Add tile layer
    const tileUrl = process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    L.tileLayer(tileUrl, {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create custom icon for football field
    const footballIcon = L.divIcon({
      html: `
        <div style="
          background: #10b981;
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          font-size: 16px;
        ">
          ⚽
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
      className: 'custom-football-marker'
    });

    // Add marker
    const marker = L.marker([lat, lng], { icon: footballIcon }).addTo(map);

    // Add popup with field information
    const popupContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #1f2937;">
          ${fieldName || 'Football Field'}
        </div>
        <div style="color: #6b7280; font-size: 14px; line-height: 1.4; margin-bottom: 8px;">
          ${location.address}
        </div>
        ${location.city ? `<div style="color: #9ca3af; font-size: 12px;">${location.city}${location.district ? `, ${location.district}` : ''}</div>` : ''}
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              color: #10b981;
              text-decoration: none;
              font-size: 14px;
              font-weight: 500;
              display: inline-flex;
              align-items: center;
              gap: 4px;
            "
          >
            📍 Get Directions
          </a>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 250,
      className: 'custom-popup'
    });

    // Store map instance
    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location, fieldName]);

  // Loading state while Leaflet loads
  if (typeof window === 'undefined' || !L) {
    return (
      <div
        className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Loading map...</p>
          <p className="text-sm text-gray-500">{location.address}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Include Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      <div
        ref={mapRef}
        className={`rounded-lg overflow-hidden ${className}`}
        style={{ height }}
      />

      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .custom-football-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </>
  );
}

// Wrapper component with Card for consistent styling
interface MapCardProps extends FieldMapProps {
  title?: string;
  showCard?: boolean;
}

export function MapCard({
  title = "Location",
  showCard = true,
  height = "300px",
  ...mapProps
}: MapCardProps) {
  const mapElement = (
    <FieldMap
      {...mapProps}
      height={height}
      className="w-full"
    />
  );

  if (!showCard) {
    return mapElement;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mapElement}

        {/* Address info below map */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{mapProps.location.address}</p>
              {mapProps.location.city && (
                <p className="text-sm text-gray-600">
                  {mapProps.location.city}
                  {mapProps.location.district && `, ${mapProps.location.district}`}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapProps.location.coordinates[1]},${mapProps.location.coordinates[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
            >
              <MapPin className="w-4 h-4" />
              Get Directions
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
