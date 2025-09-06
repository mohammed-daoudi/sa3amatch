import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Users } from "lucide-react";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import { MapViewModal } from "@/components/ui/fields-map";
import { useState } from "react";

// This will be replaced with actual data from the API
const mockFields = [
  {
    id: "1",
    name: "Stade Municipal",
    description: "Professional football field with natural grass and modern facilities",
    pricePerHour: 200,
    location: {
      address: "Avenue Hassan II, Khouribga",
      city: "Khouribga",
      district: "Centre Ville",
      coordinates: [-6.9063, 32.8811] as [number, number]
    },
    fieldType: "outdoor",
    surface: "grass",
    capacity: 22,
    photos: ["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800"],
    amenities: ["Parking", "Changing Rooms", "Lighting", "Seating"]
  },
  {
    id: "2",
    name: "Complex Sportif Al Amal",
    description: "Indoor football complex with artificial turf and air conditioning",
    pricePerHour: 150,
    location: {
      address: "Quartier Al Amal, Khouribga",
      city: "Khouribga",
      district: "Al Amal",
      coordinates: [-6.9120, 32.8765] as [number, number]
    },
    fieldType: "indoor",
    surface: "artificial",
    capacity: 16,
    photos: ["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800"],
    amenities: ["Air Conditioning", "Parking", "Changing Rooms", "Cafeteria"]
  },
  {
    id: "3",
    name: "Terrain Hay Mohammadi",
    description: "Community football field perfect for casual games",
    pricePerHour: 80,
    location: {
      address: "Hay Mohammadi, Khouribga",
      city: "Khouribga",
      district: "Hay Mohammadi",
      coordinates: [-6.8998, 32.8856] as [number, number]
    },
    fieldType: "outdoor",
    surface: "artificial",
    capacity: 16,
    photos: ["https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800"],
    amenities: ["Parking", "Basic Facilities"]
  }
];

export default function FieldsPage() {
  const [isMapViewOpen, setIsMapViewOpen] = useState(false);

  const handleFieldSelect = (field: any) => {
    // Close map and potentially scroll to field in list
    setIsMapViewOpen(false);
    // You could implement scrolling to the field in the list here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">Sa3aMatch</h1>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-gray-700 hover:text-green-600">
                Dashboard
              </Link>
              <Link href="/sign-in" className="text-gray-700 hover:text-green-600">
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Football Fields in Khouribga
          </h1>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search fields by name or location..."
                  className="w-full"
                />
              </div>
              <div>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">All Types</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                </select>
              </div>
              <div>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">All Surfaces</option>
                  <option value="grass">Natural Grass</option>
                  <option value="artificial">Artificial</option>
                  <option value="concrete">Concrete</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-4">
                <Badge variant="outline">3 fields found</Badge>
              </div>
              <Button onClick={() => setIsMapViewOpen(true)}>
                <MapPin className="w-4 h-4 mr-2" />
                Map View
              </Button>
            </div>
          </div>
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockFields.map((field) => (
            <Card key={field.id} className="hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                  src={field.photos[0]}
                  alt={field.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{field.name}</CardTitle>
                  <Badge variant={field.fieldType === 'indoor' ? 'default' : 'secondary'}>
                    {field.fieldType}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {field.location.district}, {field.location.city}
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
                  {field.amenities.slice(0, 3).map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {field.amenities.length > 3 && (
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
                  <div className="flex items-center space-x-2">
                    <FavoriteButton fieldId={field.id} variant="ghost" />
                    <Link href={`/fields/${field.id}`}>
                      <Button>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Load More Fields
          </Button>
        </div>
      </div>

      {/* Map View Modal */}
      <MapViewModal
        fields={mockFields}
        isOpen={isMapViewOpen}
        onClose={() => setIsMapViewOpen(false)}
        onFieldSelect={handleFieldSelect}
      />
    </div>
  );
}
