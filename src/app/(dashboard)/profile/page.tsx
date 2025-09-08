'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Phone,
  Mail,
  Upload,
  FileText,
  Camera,
  Save,
  Edit,
  Shield,
  Trash2,
  X,
  CheckCircle,
  Clock
} from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  interface ExistingDocument {
    id: string;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    documentType?: string;
    verified: boolean;
    uploadedAt: string;
    verifiedAt?: string;
  }

  interface ProfileData {
    phone?: string;
    profilePicture?: string;
    role: string;
    favorites: string[];
    createdAt: string;
    updatedAt: string;
  }

  const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>([]);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load user profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          setPhone(data.phone || '');
        }

        // Load existing documents
        const documentsResponse = await fetch('/api/documents');
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setExistingDocuments(documentsData.documents || []);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (isLoaded && user) {
      loadProfileData();
    }
  }, [isLoaded, user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      let profilePictureUrl = '';

      // Upload profile image if changed
      if (profileImage) {
        const formData = new FormData();
        formData.append('file', profileImage);
        formData.append('type', 'profile');

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          profilePictureUrl = uploadData.url;
        } else {
          throw new Error('Failed to upload profile picture');
        }
      }

      // Upload documents
      for (const document of documents) {
        const formData = new FormData();
        formData.append('file', document);
        formData.append('type', 'document');

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload document: ${document.name}`);
        }
      }

      // Update profile data
      const profileUpdateData: { phone?: string; profilePicture?: string } = {};
      if (phone) profileUpdateData.phone = phone;
      if (profilePictureUrl) profileUpdateData.profilePicture = profilePictureUrl;

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileUpdateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setIsEditing(false);
      setDocuments([]); // Clear uploaded documents
      setProfileImage(null); // Clear profile image

      // Show success message
      console.log('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
    }
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setExistingDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error removing document:', error);
      alert('Failed to remove document. Please try again.');
    }
  };

  const handleRemoveNewDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  if (!isLoaded || initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
        <p className="text-gray-600">Manage your account information and documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {profileData?.profilePicture ? (
                      <Image
                        src={profileData.profilePicture}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-green-600 text-white p-1 rounded-full cursor-pointer hover:bg-green-700 transition-colors">
                      <Camera className="h-3 w-3" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{user?.fullName || 'No name set'}</h3>
                  <p className="text-sm text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={user?.firstName || ''}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={user?.lastName || ''}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center mt-1">
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.primaryEmailAddress?.emailAddress || ''}
                    disabled
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="ml-2">
                    {user?.primaryEmailAddress?.verification?.status === 'verified' ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center mt-1">
                  <Phone className="mr-2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    placeholder="+212 6XX XXX XXX"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Role Badge */}
              <div>
                <Label>Account Type</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="flex items-center w-fit">
                    <Shield className="mr-1 h-3 w-3" />
                    User Account
                  </Badge>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-2">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Document Management */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Documents
              </CardTitle>
              <CardDescription>
                Upload required documents for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 text-center">
                    <span className="font-semibold">Click to upload</span><br />
                    ID, License, or other documents
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </label>

              {/* Existing Documents */}
              {existingDocuments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Your Documents:</h4>
                  {existingDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center flex-1">
                        <FileText className="mr-2 h-4 w-4 text-gray-600" />
                        <div className="flex-1">
                          <span className="text-sm font-medium truncate block">{doc.fileName}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(doc.fileSize / 1024)} KB
                            </Badge>
                            {doc.verified ? (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="mr-1 h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Documents to Upload */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">New Documents to Upload:</h4>
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-blue-600" />
                        <div>
                          <span className="text-sm font-medium truncate block">{doc.name}</span>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {Math.round(doc.size / 1024)} KB
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveNewDocument(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Required Documents List */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Required Documents:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Government-issued ID</li>
                  <li>• Proof of address</li>
                  <li>• Emergency contact</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Account Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member since</span>
                <span className="text-sm font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total bookings</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Favorite fields</span>
                <span className="text-sm font-medium">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Profile completion</span>
                <span className="text-sm font-medium text-green-600">85%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
