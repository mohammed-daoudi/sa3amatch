'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MapPin, Star, Heart, Filter, Search, Clock, List } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import FieldMap from '@/components/FieldMap';

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

export default function FieldsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState({
    lighting: false,
    surface: '',
    size: '',
    minPrice: '',
    maxPrice: ''
  });
  const [fields, setFields] = useState<Field[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Load fields from API
  const loadFields = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // For map view, load more fields to show all on map
      const limit = viewMode === 'map' ? 100 : pagination.limit;
      const page = viewMode === 'map' ? 1 : pagination.page;

      const params = new URLSearchParams({
        sortBy,
        page: page.toString(),
        limit: limit.toString()
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filters.surface) params.append('surface', filters.surface);
      if (filters.size) params.append('size', filters.size);
      if (filters.lighting) params.append('lighting', 'true');
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

      const response = await fetch(`/api/fields?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch fields');
      }

      const data = await response.json();
      setFields(data.fields);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading fields:', error);
      setError('Failed to load fields. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, filters, pagination.page, pagination.limit, viewMode]);

  // Load user favorites
  const loadFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites.map((field: Field) => field.id));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (fieldId: string) => {
    try {
      const isFavorite = favorites.includes(fieldId);

      if (isFavorite) {
        const response = await fetch(`/api/favorites?fieldId=${fieldId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setFavorites(prev => prev.filter(id => id !== fieldId));
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldId }),
        });

        if (response.ok) {
          setFavorites(prev => [...prev, fieldId]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadFields();
  }, [loadFields]);

  useEffect(() => {
    loadFavorites();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Fields</h1>
        <p className="text-gray-600">Find the perfect football field for your next match</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search fields by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lighting"
                  checked={filters.lighting}
                  onCheckedChange={(checked: boolean) =>
                    handleFilterChange({ ...filters, lighting: checked })
                  }
                />
                <Label htmlFor="lighting">Has Lighting</Label>
              </div>

              <Select value={filters.surface} onValueChange={(value) =>
                handleFilterChange({ ...filters, surface: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Surface" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Surfaces</SelectItem>
                  <SelectItem value="grass">Grass</SelectItem>
                  <SelectItem value="artificial">Artificial</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.size} onValueChange={(value) =>
                handleFilterChange({ ...filters, size: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sizes</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Min Price"
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange({ ...filters, minPrice: e.target.value })}
              />

              <Input
                placeholder="Max Price"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange({ ...filters, maxPrice: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="flex justify-between items-center">
        <div>
          {loading ? (
            <p className="text-gray-600">Loading fields...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="text-gray-600">
              {pagination.totalCount} field{pagination.totalCount !== 1 ? 's' : ''} found
              {pagination.totalPages > 1 && (
                <span className="text-gray-500"> (Page {pagination.page} of {pagination.totalPages})</span>
              )}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        >
          {viewMode === 'list' ? (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Map View
            </>
          ) : (
            <>
              <List className="mr-2 h-4 w-4" />
              List View
            </>
          )}
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse" />
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-2">⚠️ {error}</div>
          <Button onClick={loadFields} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Map View */}
      {!loading && !error && viewMode === 'map' && (
        <FieldMap
          fields={fields}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Fields Grid */}
      {!loading && !error && viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
          <Card key={field.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <Image
                src={field.photos[0]}
                alt={field.name}
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                className={`absolute top-2 right-2 bg-white/80 hover:bg-white ${
                  favorites.includes(field.id) ? 'text-red-500' : 'text-gray-600'
                }`}
                onClick={() => toggleFavorite(field.id)}
              >
                <Heart className={`h-4 w-4 ${favorites.includes(field.id) ? 'fill-current' : ''}`} />
              </Button>

              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="bg-white/90">
                  ${field.pricePerHour}/hour
                </Badge>
              </div>
            </div>

            <CardHeader>
              <CardTitle className="text-lg">{field.name}</CardTitle>
              <CardDescription>{field.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="mr-1 h-3 w-3" />
                {field.location.address}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{field.rating.average}</span>
                  <span className="text-gray-600 ml-1">({field.rating.count})</span>
                </div>
                <div className="flex space-x-1">
                  {field.lighting && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      Lighting
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {field.surface}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {field.amenities.slice(0, 3).map((amenity, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {field.amenities.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{field.amenities.length - 3} more
                  </Badge>
                )}
              </div>

              <div className="flex space-x-2">
                <Button asChild className="flex-1">
                  <Link href={`/fields/${field.id}`}>View Details</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/fields/${field.id}/book`}>Book Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && viewMode === 'list' && fields.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No fields found</h3>
          <p className="mt-2 text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && viewMode === 'list' && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
