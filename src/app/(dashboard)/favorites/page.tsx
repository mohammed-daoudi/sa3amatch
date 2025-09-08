'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Star,
  Heart,
  DollarSign,
  Eye,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface FavoriteField {
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
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/favorites');
        if (!response.ok) {
          throw new Error('Failed to load favorites');
        }
        const data = await response.json();
        setFavorites(data.favorites || []);
      } catch (error) {
        console.error('Error loading favorites:', error);
        setError('Failed to load favorites. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Remove from favorites
  const removeFromFavorites = async (fieldId: string) => {
    setRemovingId(fieldId);
    try {
      const response = await fetch(`/api/favorites?fieldId=${fieldId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(field => field.id !== fieldId));
      } else {
        throw new Error('Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      // You could add a toast notification here
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
          <p className="text-gray-600 mt-1">
            {favorites.length} {favorites.length === 1 ? 'field' : 'fields'} in your favorites
          </p>
        </div>
        <Heart className="h-8 w-8 text-red-500 fill-current" />
      </div>

      {/* Favorites Grid */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((field) => (
            <Card key={field.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Field Image */}
              <div className="relative h-48">
                <Image
                  src={field.photos[0] || '/placeholder-field.jpg'}
                  alt={field.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 right-3">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => removeFromFavorites(field.id)}
                    disabled={removingId === field.id}
                    className="bg-white/90 hover:bg-white"
                  >
                    {removingId === field.id ? (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{field.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="mr-1 h-3 w-3" />
                      {field.location.address}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Rating and Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{field.rating.average}</span>
                    <span className="text-xs text-gray-500">({field.rating.count})</span>
                  </div>
                  <div className="flex items-center text-green-600 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {field.pricePerHour}/hr
                  </div>
                </div>

                {/* Field Details */}
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline" className="capitalize">
                    {field.surface}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {field.size}
                  </Badge>
                  {field.lighting && (
                    <Badge variant="outline">
                      Lighting
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {field.description}
                </p>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/fields/${field.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href={`/fields/${field.id}/book`}>
                      Book Now
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Favorites Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start exploring fields and add them to your favorites by clicking the heart icon.
            This way you can quickly access your preferred fields for future bookings.
          </p>
          <Button asChild>
            <Link href="/fields">
              Browse Fields
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
