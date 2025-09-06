"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Upload,
  Clock,
  Plus,
  X,
  Save
} from "lucide-react";
import Link from "next/link";

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

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

export default function NewFieldPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerHour: '',
    location: {
      address: '',
      city: 'Khouribga',
      district: '',
      coordinates: [-6.906, 32.881] // Default Khouribga coordinates
    },
    fieldType: 'outdoor' as 'outdoor' | 'indoor',
    surface: 'grass' as 'grass' | 'artificial' | 'concrete',
    capacity: '',
    amenities: [] as string[],
    isActive: true
  });

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { dayOfWeek: 1, startTime: '08:00', endTime: '22:00', isAvailable: true }
  ]);

  const [photos, setPhotos] = useState<string[]>([]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addAvailabilitySlot = () => {
    setAvailability(prev => [
      ...prev,
      { dayOfWeek: 1, startTime: '08:00', endTime: '22:00', isAvailable: true }
    ]);
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailability(prev => prev.filter((_, i) => i !== index));
  };

  const updateAvailabilitySlot = (index: number, field: string, value: any) => {
    setAvailability(prev => prev.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      console.log('Submitting field data:', {
        ...formData,
        availability,
        photos,
        pricePerHour: Number(formData.pricePerHour),
        capacity: Number(formData.capacity)
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      router.push('/admin/fields');
    } catch (error) {
      console.error('Error creating field:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/fields">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Fields
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Field</h1>
          <p className="text-gray-600 mt-2">
            Create a new football field for your platform
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Essential details about the football field
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Field Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Stade Municipal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price per Hour (MAD) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.pricePerHour}
                  onChange={(e) => handleInputChange('pricePerHour', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="150"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Describe the field features, location, and any special notes..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Field Type *</label>
                <select
                  value={formData.fieldType}
                  onChange={(e) => handleInputChange('fieldType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Surface Type *</label>
                <select
                  value={formData.surface}
                  onChange={(e) => handleInputChange('surface', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="grass">Grass</option>
                  <option value="artificial">Artificial Turf</option>
                  <option value="concrete">Concrete</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Capacity (Players) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="22"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Where is this field located?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.location.address}
                  onChange={(e) => handleInputChange('location.address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Avenue Mohammed V"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">District</label>
                <input
                  type="text"
                  value={formData.location.district}
                  onChange={(e) => handleInputChange('location.district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Centre-ville"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => handleInputChange('location.city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Khouribga"
              />
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
            <CardDescription>
              What facilities are available at this field?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {AMENITIES_OPTIONS.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor={amenity} className="text-sm font-medium capitalize">
                    {amenity.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Availability Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Availability Schedule
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAvailabilitySlot}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Slot
              </Button>
            </CardTitle>
            <CardDescription>
              Set the operating hours for each day
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availability.map((slot, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) => updateAvailabilitySlot(index, 'dayOfWeek', Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateAvailabilitySlot(index, 'startTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />

                <span className="text-gray-500">to</span>

                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateAvailabilitySlot(index, 'endTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={slot.isAvailable}
                    onChange={(e) => updateAvailabilitySlot(index, 'isAvailable', e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm">Available</span>
                </label>

                {availability.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAvailabilitySlot(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              Upload photos of the field (optional for now)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Photo upload functionality will be implemented in the next phase</p>
              <p className="text-sm text-gray-500">Supported formats: JPG, PNG, WebP</p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Link href="/admin/fields">
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Field...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Field
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
