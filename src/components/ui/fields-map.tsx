'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, X, Eye } from 'lucide-react';
import Link from 'next/link';

interface Field {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  location: {
    address: string;
    city: string;
    district: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  fieldType: string;
  surface: string;
  capacity: number;
  photos: string[];
}

interface FieldsMapProps {
  fields: Field[];
  className?: string;
  height?: string;
  onFieldSelect?: (field: Field) => void;
  selectedFieldId?: string;
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

export default function FieldsMap({
  fields,
  className = '',
  height = '500px',
  onFieldSelect,
  selectedFieldId
}: FieldsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    // Only initialize map on client side when Leaflet is loaded
    if (typeof window === 'undefined' || !L || !mapRef.current || fields.length === 0) return;

    // Avoid re-initialization
    if (mapInstanceRef.current) return;

    // Calculate center point from all field coordinates
    const avgLat = fields.reduce((sum, field) => sum + field.location.coordinates[1], 0) / fields.length;
    const avgLng = fields.reduce((sum, field) => sum + field.location.coordinates[0], 0) / fields.length;

    // Create map instance
    const map = L.map(mapRef.current, {
      center: [avgLat, avgLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    // Add tile layer
    const tileUrl = process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    L.tileLayer(tileUrl, {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create marker for each field
    fields.forEach((field) => {
      const [lng, lat] = field.location.coordinates;

      // Create icon based on field type and selection state
      const isSelected = selectedFieldId === field.id;
      const iconColor = field.fieldType === 'indoor' ? '#3b82f6' : '#10b981';
      const iconSize = isSelected ? 40 : 32;
      const borderColor = isSelected ? '#fbbf24' : 'white';

      const fieldIcon = L.divIcon({
        html: `
          <div style="
            background: ${iconColor};
            color: white;
            border-radius: 50%;
            width: ${iconSize}px;
            height: ${iconSize}px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid ${borderColor};
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            font-size: ${iconSize === 40 ? '18px' : '16px'};
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            ${field.fieldType === 'indoor' ? '🏢' : '⚽'}
          </div>
        `,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize/2, iconSize/2],
        popupAnchor: [0, -iconSize/2],
        className: `custom-field-marker field-${field.id}`
      });

      // Add marker
      const marker = L.marker([lat, lng], { icon: fieldIcon }).addTo(map);

      // Store marker reference
      markersRef.current.set(field.id, marker);

      // Create popup content
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 250px;">
          <div style="margin-bottom: 12px;">
            <img
              src="${field.photos[0]}"
              alt="${field.name}"
              style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px;"
            />
          </div>

          <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #1f2937;">
            ${field.name}
          </div>

          <div style="color: #6b7280; font-size: 14px; line-height: 1.4; margin-bottom: 8px;">
            ${field.description}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <span style="background: ${field.fieldType === 'indoor' ? '#dbeafe' : '#d1fae5'};
                           color: ${field.fieldType === 'indoor' ? '#1e40af' : '#047857'};
                           padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                ${field.fieldType}
              </span>
            </div>
            <div style="font-weight: 600; color: #10b981; font-size: 16px;">
              ${field.pricePerHour} MAD/h
            </div>
          </div>

          <div style="color: #6b7280; font-size: 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
            📍 ${field.location.address}
          </div>

          <div style="display: flex; gap: 8px;">
            <a
              href="/fields/${field.id}"
              style="
                background: #10b981;
                color: white;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                flex: 1;
                text-align: center;
              "
            >
              View Details
            </a>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                background: #6b7280;
                color: white;
                padding: 8px 12px;
                text-decoration: none;
                border-radius: 6px;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 4px;
              "
            >
              🧭
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'custom-field-popup'
      });

      // Handle marker click
      marker.on('click', () => {
        if (onFieldSelect) {
          onFieldSelect(field);
        }
      });
    });

    // Fit map to show all markers
    if (fields.length > 1) {
      const group = new L.featureGroup(Array.from(markersRef.current.values()));
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Store map instance
    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        markersRef.current.clear();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [fields, selectedFieldId]);

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
          <p className="text-sm text-gray-500">{fields.length} fields to display</p>
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
        .custom-field-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 0;
        }
        .custom-field-popup .leaflet-popup-content {
          margin: 16px;
        }
        .custom-field-popup .leaflet-popup-tip {
          background: white;
        }
        .custom-field-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-field-marker:hover div {
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
}

// Map view modal/overlay component
interface MapViewProps {
  fields: Field[];
  isOpen: boolean;
  onClose: () => void;
  onFieldSelect?: (field: Field) => void;
}

export function MapViewModal({ fields, isOpen, onClose, onFieldSelect }: MapViewProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Map View - {fields.length} Fields</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 p-4">
          <FieldsMap
            fields={fields}
            height="100%"
            onFieldSelect={onFieldSelect}
          />
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="inline-flex items-center gap-1 mr-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Outdoor Fields
              </span>
              <span className="inline-flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Indoor Fields
              </span>
            </div>
            <div>
              Click on any marker to view field details
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
