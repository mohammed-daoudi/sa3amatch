"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Trash2,
  Plus,
  Eye,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface FieldParams {
  params: {
    id: string;
  };
}

// Mock field data - will be replaced with real API call
const mockField = {
  _id: "1",
  name: "Stade Municipal",
  description: "A premium outdoor football field located in the heart of Khouribga. Features professional grass surface and modern facilities including changing rooms, parking, and professional lighting for evening games.",
  pricePerHour: 200,
  location: {
    address: "Avenue Mohammed V",
    city: "Khouribga",
    district: "Centre-ville",
    coordinates: [-6.906, 32.881]
  },
  fieldType: "outdoor" as const,
  surface: "grass" as const,
  capacity: 22,
  isActive: true,
  amenities: ["parking", "lighting", "changing_rooms", "showers", "security"],
  photos: ["/field1.jpg", "/field2.jpg"],
  availability: [
    { dayOfWeek: 1, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 2, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 3, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 4, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 5, startTime: "08:00", endTime: "22:00", isAvailable: true },
    { dayOfWeek: 6, startTime: "08:00", endTime: "20:00", isAvailable: true },
    { dayOfWeek: 0, startTime: "10:00", endTime: "20:00", isAvailable: true },
  ],
  createdAt: new Date("2024-01-10"),
  updatedAt: new Date("2024-01-15"),
  ownerId: "user_123"
};

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const AMENITIES_OPTIONS = [
  'parking',
  'lighting',
  'changing_rooms',
  'showers',
  'restrooms',
  'canteen',
  'first_aid',
  'security',
  'wifi',
  'sound_system'
];

export default function FieldDetailPage({ params }: FieldParams) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [field, setField] = useState(mockField);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call
      console.log('Saving field changes:', field);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
      try {
        // TODO: Replace with actual API call
        console.log('Deleting field:', field._id);
        router.push('/admin/fields');
      } catch (error) {
        console.error('Error deleting field:', error);
      }
    }
  };

  const updateField = (path: string, value: any) => {
    if (path.includes('.')) {
      const [parent, child] = path.split('.');
      setField(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setField(prev => ({ ...prev, [path]: value }));
    }
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/fields">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Fields
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{field.name}</h1>
            <p className="text-gray-600 mt-2">
              Field details and management
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Field
              </Button>
              <Button variant="outline" className="text-red-600" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status and Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={field.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {field.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className={`w-3 h-3 rounded-full ${field.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Price/Hour</p>
                <p className="text-2xl font-bold">{field.pricePerHour} MAD</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Capacity</p>
                <p className="text-2xl font-bold">{field.capacity}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bookings Today</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Field Name</label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={field.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price per Hour (MAD)</label>
                    <input
                      type="number"
                      value={field.pricePerHour}
                      onChange={(e) => updateField('pricePerHour', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Capacity (Players)</label>
                    <input
                      type="number"
                      value={field.capacity}
                      onChange={(e) => updateField('capacity', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Field Type</label>
                    <select
                      value={field.fieldType}
                      onChange={(e) => updateField('fieldType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="outdoor">Outdoor</option>
                      <option value="indoor">Indoor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Surface Type</label>
                    <select
                      value={field.surface}
                      onChange={(e) => updateField('surface', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="grass">Grass</option>
                      <option value="artificial">Artificial Turf</option>
                      <option value="concrete">Concrete</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.isActive}
                      onChange={(e) => updateField('isActive', e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium">Field is active</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-600">Description</p>
                  <p className="mt-1">{field.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Field Type</p>
                    <Badge className="mt-1 bg-green-100 text-green-800 capitalize">
                      {field.fieldType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Surface</p>
                    <Badge className="mt-1 bg-blue-100 text-blue-800 capitalize">
                      {field.surface}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="mt-1">{field.createdAt.toLocaleDateString()}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    value={field.location.address}
                    onChange={(e) => updateField('location.address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      value={field.location.city}
                      onChange={(e) => updateField('location.city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">District</label>
                    <input
                      type="text"
                      value={field.location.district}
                      onChange={(e) => updateField('location.district', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{field.location.address}</p>
                    <p className="text-sm text-gray-600">
                      {field.location.district}, {field.location.city}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {AMENITIES_OPTIONS.map((amenity) => (
                <label key={amenity} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.amenities.includes(amenity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateField('amenities', [...field.amenities, amenity]);
                      } else {
                        updateField('amenities', field.amenities.filter(a => a !== amenity));
                      }
                    }}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm capitalize">{amenity.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {field.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="capitalize">
                  {amenity.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {field.availability
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((slot, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-20 font-medium">
                    {getDayLabel(slot.dayOfWeek)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{slot.startTime} - {slot.endTime}</span>
                  </div>
                </div>
                <Badge className={slot.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {slot.isAvailable ? 'Available' : 'Closed'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
