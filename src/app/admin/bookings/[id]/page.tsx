"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  CreditCard,
  AlertCircle,
  MessageSquare,
  Phone,
  Mail,
  Save,
  RefreshCw,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface BookingParams {
  params: {
    id: string;
  };
}

type BookingData = {
  _id: string;
  fieldId: {
    _id: string;
    name: string;
    location: {
      address: string;
      city: string;
      district: string;
    };
    pricePerHour: number;
  };
  userId: string;
  userDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    totalBookings: number;
    joinedDate: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'canceled';
  paymentMethod: 'cash' | 'bank_transfer' | 'stripe';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentProof?: {
    filename: string;
    url: string;
    uploadedAt: string;
  };
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function BookingDetailPage({ params }: BookingParams) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch booking data
  useEffect(() => {
    const fetchBooking = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/bookings/${params.id}?admin=true`);

        if (!response.ok) {
          throw new Error('Failed to fetch booking details');
        }

        const data = await response.json();
        setBooking(data);
        setAdminNotes(data.adminNotes || '');
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [params.id]);

  const handleBookingAction = async (action: 'approve' | 'reject' | 'cancel', reason?: string) => {
    if (!booking) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          adminNotes: adminNotes || `Booking ${action}d by admin`,
          cancelationReason: reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} booking`);
      }

      const updatedBooking = await response.json();
      setBooking(updatedBooking);

      alert(`Booking ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${action} booking. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!booking) return;

    setIsUpdatingNotes(true);
    try {
      const response = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_notes',
          adminNotes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update notes');
      }

      const updatedBooking = await response.json();
      setBooking(updatedBooking);

      alert('Admin notes updated successfully!');
    } catch (error) {
      console.error('Error updating notes:', error);
      alert(error instanceof Error ? error.message : 'Failed to update notes. Please try again.');
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
        <p className="text-gray-600">Booking not found</p>
        <Link href="/admin/bookings">
          <Button className="mt-4">
            Back to Bookings
          </Button>
        </Link>
      </div>
    );
  }

  const canModerate = booking.status === 'pending';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/bookings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600 mt-2">
              Review and moderate booking request
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
          {canModerate && (
            <div className="flex space-x-2">
              <Button
                onClick={() => handleBookingAction('approve')}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBookingAction('reject')}
                disabled={isProcessing}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
              <CardDescription>Core details of the booking request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Field</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{booking.fieldId.name}</p>
                        <p className="text-sm text-gray-600">
                          {booking.fieldId.location.address}, {booking.fieldId.location.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Date & Time</label>
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{new Date(booking.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{booking.startTime} - {booking.endTime} ({booking.duration} hours)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Pricing</label>
                    <div className="mt-1 space-y-2">
                      <div className="flex justify-between">
                        <span>Rate per hour:</span>
                        <span>{booking.fieldId.pricePerHour} MAD</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{booking.duration} hours</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{booking.totalPrice} MAD</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Booking ID</label>
                    <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                      {booking._id}
                    </div>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer Notes</label>
                  <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm">{booking.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Payment method and status information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Method</label>
                  <div className="mt-1">
                    <Badge className="bg-purple-100 text-purple-800">
                      {booking.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Status</label>
                  <div className="mt-1">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {booking.paymentProof && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Proof</label>
                  <div className="mt-1 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{booking.paymentProof.filename}</p>
                          <p className="text-sm text-gray-600">
                            Uploaded: {new Date(booking.paymentProof.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
              <CardDescription>Internal notes for this booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this booking..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <Button
                onClick={handleUpdateNotes}
                disabled={isUpdatingNotes || adminNotes === booking.adminNotes}
                size="sm"
              >
                {isUpdatingNotes ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Notes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Customer Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Details about the customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-lg">
                  {booking.userDetails.firstName} {booking.userDetails.lastName}
                </h3>
                <p className="text-sm text-gray-600">Customer since {new Date(booking.userDetails.joinedDate).toLocaleDateString()}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{booking.userDetails.email}</span>
                </div>
                {booking.userDetails.phoneNumber && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{booking.userDetails.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{booking.userDetails.totalBookings} total bookings</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Customer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Booking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Timeline</CardTitle>
              <CardDescription>History of this booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Booking Created</p>
                    <p className="text-xs text-gray-600">{new Date(booking.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {booking.paymentProof && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Payment Proof Uploaded</p>
                      <p className="text-xs text-gray-600">{new Date(booking.paymentProof.uploadedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Awaiting Admin Review</p>
                    <p className="text-xs text-gray-600">Pending moderation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
