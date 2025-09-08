'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Star,
  Heart,
  Clock,
  Users,
  Car,
  Wifi,
  Shield,
  ArrowLeft,
  Calendar,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
}

interface AvailabilityDay {
  date: string;
  day: string;
  slots: TimeSlot[];
}

const amenityIcons: { [key: string]: any } = {
  'Parking': Car,
  'Lighting': Clock,
  'WiFi': Wifi,
  'Security': Shield,
  'Changing Rooms': Users,
};

export default function FieldDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const fieldId = params.id as string;

  const [field, setField] = useState<Field | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Load field details
  useEffect(() => {
    const loadFieldDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load field data
        const fieldResponse = await fetch(`/api/fields/${fieldId}`);
        if (!fieldResponse.ok) {
          throw new Error('Field not found');
        }
        const fieldData = await fieldResponse.json();
        setField(fieldData.field);

        // Load reviews
        const reviewsResponse = await fetch(`/api/fields/${fieldId}/reviews`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews || []);
        }

        // Load availability for next 7 days
        const availabilityResponse = await fetch(`/api/fields/${fieldId}/availability`);
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();
          setAvailability(availabilityData.availability || []);
        }

        // Check if field is in favorites
        const favoritesResponse = await fetch('/api/favorites');
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          const favoriteIds = favoritesData.favorites.map((f: Field) => f.id);
          setIsFavorite(favoriteIds.includes(fieldId));
        }
      } catch (error) {
        console.error('Error loading field details:', error);
        setError('Failed to load field details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (fieldId) {
      loadFieldDetails();
    }
  }, [fieldId]);

  // Toggle favorite
  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        const response = await fetch(`/api/favorites?fieldId=${fieldId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsFavorite(false);
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldId }),
        });
        if (response.ok) {
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse" />
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">⚠️ {error || 'Field not found'}</div>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{field.name}</h1>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="mr-1 h-4 w-4" />
              {field.location.address}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFavorite}
            className={isFavorite ? 'text-red-500 border-red-500' : ''}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button asChild>
            <Link href={`/fields/${fieldId}/book`}>
              <Calendar className="mr-2 h-4 w-4" />
              Book Now
            </Link>
          </Button>
        </div>
      </div>

      {/* Photo Gallery */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="md:col-span-3">
              <Image
                src={field.photos[selectedPhotoIndex]}
                alt={field.name}
                width={800}
                height={400}
                className="w-full h-64 md:h-80 object-cover rounded-l-lg"
              />
            </div>
            <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
              {field.photos.slice(0, 4).map((photo, index) => (
                <div key={index} className="relative">
                  <Image
                    src={photo}
                    alt={`${field.name} ${index + 1}`}
                    width={200}
                    height={150}
                    className={`w-full h-20 md:h-20 object-cover rounded cursor-pointer transition-opacity ${
                      selectedPhotoIndex === index ? 'opacity-100 ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => setSelectedPhotoIndex(index)}
                  />
                  {index === 3 && field.photos.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center text-white text-sm font-medium">
                      +{field.photos.length - 4} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Field Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Field Information
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{field.rating.average}</span>
                  <span className="text-gray-600">({field.rating.count} reviews)</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{field.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">${field.pricePerHour}</div>
                  <div className="text-sm text-gray-600">per hour</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold capitalize">{field.surface}</div>
                  <div className="text-sm text-gray-600">Surface</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold capitalize">{field.size}</div>
                  <div className="text-sm text-gray-600">Size</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold">{field.lighting ? 'Yes' : 'No'}</div>
                  <div className="text-sm text-gray-600">Lighting</div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="font-semibold mb-3">Amenities</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {field.amenities.map((amenity, index) => {
                    const IconComponent = amenityIcons[amenity] || MapPin;
                    return (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{review.userName}</div>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{review.comment}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {reviews.length > 3 && (
                    <Button variant="outline" className="w-full">
                      View All Reviews ({reviews.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No reviews yet. Be the first to review this field!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Booking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Quick Booking
              </CardTitle>
              <CardDescription>
                Starting from ${field.pricePerHour}/hour
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href={`/fields/${fieldId}/book`}>
                  Book This Field
                </Link>
              </Button>
              <div className="text-center text-sm text-gray-600">
                Free cancellation up to 24 hours before
              </div>
            </CardContent>
          </Card>

          {/* Availability Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Availability Today</CardTitle>
            </CardHeader>
            <CardContent>
              {availability.length > 0 && availability[0] ? (
                <div className="space-y-2">
                  {availability[0].slots.slice(0, 6).map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{slot.time}</span>
                      <Badge variant={slot.available ? "default" : "secondary"}>
                        {slot.available ? 'Available' : 'Booked'}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" asChild className="w-full mt-3">
                    <Link href={`/fields/${fieldId}/book`}>
                      View Full Schedule
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No availability data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">{field.location.address}</p>
                <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Map Preview</span>
                </div>
                <Button variant="outline" className="w-full">
                  Get Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
