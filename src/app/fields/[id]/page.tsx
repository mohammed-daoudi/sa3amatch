import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Users, Share } from "lucide-react";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import BookingForm from "@/components/BookingForm";
import { MapCard } from "@/components/ui/map";

// Mock data - will be replaced with real API calls
const mockField = {
  id: "1",
  name: "Stade Municipal",
  description: "Professional football field with natural grass and modern facilities. This premium venue offers the perfect setting for competitive matches and training sessions. Features include professional-grade lighting for evening games, spacious changing rooms with hot showers, and ample parking for teams and spectators.",
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
  photos: [
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200",
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200"
  ],
  amenities: ["Parking", "Changing Rooms", "Professional Lighting", "Seating", "Hot Showers", "Security"],
  availability: [
    { dayOfWeek: 1, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 2, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 3, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 4, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 5, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 6, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 0, startTime: "09:00", endTime: "21:00", isAvailable: true }
  ],
  rating: 4.8,
  reviewCount: 124
};

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00"
];

export default function FieldDetailsPage({ params }: { params: { id: string } }) {
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
              <Link href="/fields" className="text-gray-700 hover:text-green-600">
                All Fields
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-green-600">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-200">
                <img
                  src={mockField.photos[0]}
                  alt={mockField.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 p-4">
                {mockField.photos.slice(1).map((photo, index) => (
                  <div key={index} className="aspect-video bg-gray-200 rounded overflow-hidden">
                    <img
                      src={photo}
                      alt={`${mockField.name} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Field Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{mockField.name}</CardTitle>
                    <div className="flex items-center mt-2 space-x-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="text-gray-600">{mockField.location.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        <span className="font-medium">{mockField.rating}</span>
                        <span className="text-gray-600 ml-1">({mockField.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <FavoriteButton fieldId={params.id} />
                    <Button variant="outline" size="sm">
                      <Share className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">{mockField.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <span className="block text-sm text-gray-500">Type</span>
                    <Badge variant={mockField.fieldType === 'indoor' ? 'default' : 'secondary'}>
                      {mockField.fieldType}
                    </Badge>
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500">Surface</span>
                    <Badge variant="outline">{mockField.surface}</Badge>
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500">Capacity</span>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{mockField.capacity} players</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500">Price</span>
                    <span className="text-lg font-bold text-green-600">
                      {mockField.pricePerHour} MAD/hour
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {mockField.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Map */}
            <MapCard
              location={mockField.location}
              fieldName={mockField.name}
              title="Location"
              height="400px"
            />
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <BookingForm
              fieldId={params.id}
              pricePerHour={mockField.pricePerHour}
              timeSlots={timeSlots}
            />

            {/* Availability Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                    const schedule = mockField.availability.find(a => a.dayOfWeek === (index + 1) % 7);
                    return (
                      <div key={day} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="font-medium">{day}</span>
                        {schedule?.isAvailable ? (
                          <span className="text-green-600 text-sm">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        ) : (
                          <span className="text-red-500 text-sm">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
