"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Heart, Loader2 } from "lucide-react";
import Link from "next/link";

interface Field {
  _id: string;
  name: string;
  description: string;
  pricePerHour: number;
  location: {
    address: string;
    city: string;
    district: string;
  };
  fieldType: string;
  surface: string;
  capacity: number;
  photos: string[];
  amenities: string[];
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingFavorite, setRemovingFavorite] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        console.error('Failed to fetch favorites');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (fieldId: string) => {
    setRemovingFavorite(fieldId);
    try {
      const response = await fetch(`/api/favorites?fieldId=${fieldId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFavorites(favorites.filter(field => field._id !== fieldId));
      } else {
        console.error('Failed to remove favorite');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    } finally {
      setRemovingFavorite(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Favorite Fields</h1>
        <p className="text-gray-600 mt-2">
          Your saved football fields for quick access
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No favorite fields yet
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Start exploring fields and add them to your favorites for quick access.
            </p>
            <Link href="/fields">
              <Button>Browse Fields</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {favorites.map((field) => (
            <Card key={field._id} className="hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                  src={field.photos?.[0] || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800"}
                  alt={field.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{field.name}</CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant={field.fieldType === 'indoor' ? 'default' : 'secondary'}>
                      {field.fieldType}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFavorite(field._id)}
                      disabled={removingFavorite === field._id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {removingFavorite === field._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Heart className="w-4 h-4 fill-current" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {field.location?.district}, {field.location?.city}
                </div>
              </CardHeader>

              <CardContent>
                <CardDescription className="mb-4">
                  {field.description}
                </CardDescription>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Surface:</span>
                    <Badge variant="outline">{field.surface}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {field.capacity} players
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {field.amenities?.slice(0, 3).map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {field.amenities?.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{field.amenities.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-green-600">
                      {field.pricePerHour} MAD
                    </span>
                    <span className="text-gray-600 text-sm">/hour</span>
                  </div>
                  <Link href={`/fields/${field._id}`}>
                    <Button>
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
