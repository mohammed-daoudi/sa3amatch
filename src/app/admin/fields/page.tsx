'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Plus,
  Edit,
  Eye,
  Trash2,
  Search,
  Filter,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import { MapViewModal } from "@/components/ui/fields-map";
import { useState } from "react";

// Mock data - will be replaced with real data from database
const mockFields = [
  {
    _id: "1",
    id: "1",
    name: "Stade Municipal",
    description: "Professional football field with natural grass and modern facilities",
    location: {
      address: "Avenue Mohammed V",
      city: "Khouribga",
      district: "Centre-ville",
      coordinates: [-6.9063, 32.8811] as [number, number]
    },
    pricePerHour: 200,
    fieldType: "outdoor" as const,
    surface: "grass" as const,
    capacity: 22,
    isActive: true,
    amenities: ["parking", "lighting", "changing_rooms"],
    photos: ["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800"],
    createdAt: new Date("2024-01-10")
  },
  {
    _id: "2",
    id: "2",
    name: "Complex Sportif Al Amal",
    description: "Indoor football complex with artificial turf and air conditioning",
    location: {
      address: "Rue Al Amal",
      city: "Khouribga",
      district: "Hay Mohammadi",
      coordinates: [-6.9120, 32.8765] as [number, number]
    },
    pricePerHour: 150,
    fieldType: "outdoor" as const,
    surface: "artificial" as const,
    capacity: 22,
    isActive: true,
    amenities: ["parking", "lighting"],
    photos: ["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800"],
    createdAt: new Date("2024-01-08")
  },
  {
    _id: "3",
    id: "3",
    name: "Terrain Hay Mohammadi",
    description: "Community football field perfect for casual games",
    location: {
      address: "Quartier Hay Mohammadi",
      city: "Khouribga",
      district: "Hay Mohammadi",
      coordinates: [-6.8998, 32.8856] as [number, number]
    },
    pricePerHour: 80,
    fieldType: "outdoor" as const,
    surface: "concrete" as const,
    capacity: 14,
    isActive: false,
    amenities: ["lighting"],
    photos: ["https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800"],
    createdAt: new Date("2024-01-05")
  }
];

const getFieldTypeColor = (type: string) => {
  return type === 'outdoor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
};

const getSurfaceColor = (surface: string) => {
  switch (surface) {
    case 'grass': return 'bg-emerald-100 text-emerald-800';
    case 'artificial': return 'bg-orange-100 text-orange-800';
    case 'concrete': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function AdminFieldsPage() {
  const [isMapViewOpen, setIsMapViewOpen] = useState(false);

  const handleFieldSelect = (field: any) => {
    setIsMapViewOpen(false);
    // Could implement navigation to field details here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all football fields in your platform
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsMapViewOpen(true)}>
            <MapPin className="w-4 h-4 mr-2" />
            Map View
          </Button>
          <Link href="/admin/fields/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockFields.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fields</CardTitle>
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockFields.filter(f => f.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Price/Hour</CardTitle>
            <span className="text-xs text-muted-foreground">MAD</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(mockFields.reduce((acc, f) => acc + f.pricePerHour, 0) / mockFields.length)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Fields</CardTitle>
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockFields.filter(f => !f.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search fields by name, location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                <option value="">All Types</option>
                <option value="outdoor">Outdoor</option>
                <option value="indoor">Indoor</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                <option value="">All Surfaces</option>
                <option value="grass">Grass</option>
                <option value="artificial">Artificial</option>
                <option value="concrete">Concrete</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fields Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Fields</CardTitle>
          <CardDescription>
            Manage your football field inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Field</th>
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">Type & Surface</th>
                  <th className="text-left p-4 font-medium">Price/Hour</th>
                  <th className="text-left p-4 font-medium">Capacity</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockFields.map((field) => (
                  <tr key={field._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {field.photos.length > 0 ? (
                            <img
                              src={field.photos[0]}
                              alt={field.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <MapPin className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{field.name}</div>
                          <div className="text-sm text-gray-600">
                            {field.amenities.length} amenities
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{field.location.city}</div>
                        <div className="text-sm text-gray-600">
                          {field.location.district}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <Badge className={getFieldTypeColor(field.fieldType)}>
                          {field.fieldType}
                        </Badge>
                        <Badge className={getSurfaceColor(field.surface)}>
                          {field.surface}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{field.pricePerHour} MAD</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{field.capacity} players</div>
                    </td>
                    <td className="p-4">
                      <Badge className={field.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {field.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Link href={`/admin/fields/${field._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/fields/${field._id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
