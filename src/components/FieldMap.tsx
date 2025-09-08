'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Fix for default markers in react-leaflet
import 'leaflet/dist/leaflet.css';

interface Field {
  id: string;
  name: string;
  description: string;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  pricePerHour: number;
  photos: string[];
  amenities: string[];
  lighting: boolean;
  size: 'small' | 'medium' | 'large';
  surface: 'grass' | 'artificial' | 'concrete';
  rating: { average: number; count: number };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface FieldMapProps {
  fields: Field[];
  favorites: string[];
  onToggleFavorite: (fieldId: string) => void;
}

// Custom marker icons
const createMarkerIcon = (surface: string, isAvailable: boolean = true) => {
  const color = isAvailable ?
    (surface === 'grass' ? '#22c55e' : surface === 'artificial' ? '#3b82f6' : '#8b5cf6') :
    '#ef4444';

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function FieldMap({ fields, favorites, onToggleFavorite }: FieldMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([32.8811, -6.9063]); // Khouribga center
  const [isClient, setIsClient] = useState(false);

  // Ensure component only renders on client side (Leaflet doesn't work with SSR)
  useEffect(() => {
    setIsClient(true);

    // Calculate center based on fields if available
    if (fields.length > 0) {
      const avgLat = fields.reduce((sum, field) => sum + field.location.coordinates.lat, 0) / fields.length;
      const avgLng = fields.reduce((sum, field) => sum + field.location.coordinates.lng, 0) / fields.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [fields]);

  if (!isClient) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="h-96 rounded-lg overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />

        {fields.map((field) => (
          <Marker
            key={field.id}
            position={[field.location.coordinates.lat, field.location.coordinates.lng]}
            icon={createMarkerIcon(field.surface, field.status === 'active')}
          >
            <Popup className="custom-popup" minWidth={300}>
              <Card className="border-0 shadow-none">
                <div className="relative">
                  <Image
                    src={field.photos[0]}
                    alt={field.name}
                    width={300}
                    height={150}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`bg-white/80 hover:bg-white h-8 w-8 ${
                        favorites.includes(field.id) ? 'text-red-500' : 'text-gray-600'
                      }`}
                      onClick={() => onToggleFavorite(field.id)}
                    >
                      <span className={`text-sm ${favorites.includes(field.id) ? '❤️' : '🤍'}`}>
                        {favorites.includes(field.id) ? '❤️' : '🤍'}
                      </span>
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="bg-white/90 text-xs">
                      ${field.pricePerHour}/hour
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{field.name}</CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">{field.description}</p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center text-xs text-gray-600">
                    <MapPin className="mr-1 h-3 w-3" />
                    {field.location.address}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{field.rating.average}</span>
                      <span className="text-gray-600 ml-1">({field.rating.count})</span>
                    </div>
                    <div className="flex space-x-1">
                      {field.lighting && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-2 w-2" />
                          Lighting
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">
                        {field.surface}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {field.amenities.slice(0, 2).map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {field.amenities.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{field.amenities.length - 2} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button asChild size="sm" className="flex-1 text-xs">
                      <Link href={`/fields/${field.id}`}>View Details</Link>
                    </Button>
                    <Button variant="outline" asChild size="sm" className="flex-1 text-xs">
                      <Link href={`/fields/${field.id}/book`}>Book Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
