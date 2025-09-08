'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  Download,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Field {
  id: string;
  name: string;
  location: { address: string };
  photos: string[];
  surface: string;
  lighting: boolean;
}

interface Booking {
  id: string;
  field: Field;
  date: string;
  timeSlot: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load booking details
  useEffect(() => {
    const loadBooking = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Booking not found');
          }
          throw new Error('Failed to load booking details');
        }

        const data = await response.json();
        setBooking(data.booking);
      } catch (error) {
        console.error('Error loading booking:', error);
        setError(error instanceof Error ? error.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!booking || !confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }

      const data = await response.json();
      setBooking(data.booking);
    } catch (error) {
      console.error('Error canceling booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-red-500 text-lg mb-4">⚠️ {error || 'Booking not found'}</div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Header */}
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {booking.status === 'confirmed' ? 'Booking Confirmed!' : 'Booking Received!'}
          </h1>
          <p className="text-gray-600">
            {booking.status === 'confirmed'
              ? 'Your field booking has been confirmed. See details below.'
              : 'Your booking request has been received and is pending approval.'
            }
          </p>
          <div className="mt-4">
            <Badge className={`px-3 py-1 ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span className="ml-2 capitalize">{booking.status}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Booking ID: {booking.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Field Info */}
            <div className="flex space-x-3">
              <Image
                src={booking.field.photos[0]}
                alt={booking.field.name}
                width={80}
                height={60}
                className="rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{booking.field.name}</h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPin className="mr-1 h-3 w-3" />
                  {booking.field.location.address}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {booking.field.surface}
                  </Badge>
                  {booking.field.lighting && (
                    <Badge variant="outline" className="text-xs">
                      Lighting
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Calendar className="mr-1 h-3 w-3" />
                  Date
                </div>
                <div className="font-medium">{formatDate(booking.date)}</div>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Clock className="mr-1 h-3 w-3" />
                  Time
                </div>
                <div className="font-medium">{formatTime(booking.timeSlot)} - {formatTime((parseInt(booking.timeSlot.split(':')[0]) + 1).toString().padStart(2, '0') + ':' + booking.timeSlot.split(':')[1])}</div>
              </div>
            </div>

            {/* Player Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Player Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="mr-2 h-3 w-3 text-gray-400" />
                  {booking.playerName}
                </div>
                <div className="flex items-center">
                  <Mail className="mr-2 h-3 w-3 text-gray-400" />
                  {booking.playerEmail}
                </div>
                <div className="flex items-center">
                  <Phone className="mr-2 h-3 w-3 text-gray-400" />
                  {booking.playerPhone}
                </div>
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Additional Notes</h4>
                <p className="text-sm text-gray-600">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Total Amount</span>
                <span className="text-2xl font-bold">${booking.totalAmount}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CreditCard className="mr-2 h-3 w-3" />
                Payment Method: <span className="ml-1 capitalize">{booking.paymentMethod.replace('_', ' ')}</span>
              </div>

              {booking.paymentMethod === 'bank_transfer' && booking.status === 'pending' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="font-medium">Bank Transfer Instructions:</p>
                  <p>Please transfer ${booking.totalAmount} to:</p>
                  <p className="mt-1 font-mono text-xs">
                    Bank: Example Bank<br />
                    Account: 1234567890<br />
                    Reference: {booking.id.slice(-8)}
                  </p>
                </div>
              )}

              {booking.paymentMethod === 'cash' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <p>💵 Please bring ${booking.totalAmount} in cash to the venue.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link href={`/fields/${booking.field.id}`}>
                  View Field Details
                </Link>
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-3 w-3" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-3 w-3" />
                  Share
                </Button>
              </div>

              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancelBooking}
                >
                  Cancel Booking
                </Button>
              )}
            </div>

            {/* Booking Timeline */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Booking Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Created</span>
                  <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span>{new Date(booking.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Status</span>
                  <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          {booking.status === 'pending' && (
            <div className="space-y-2 text-sm">
              <p>• Your booking is under review and will be confirmed within 24 hours</p>
              <p>• You will receive an email notification once confirmed</p>
              <p>• Complete payment if using bank transfer method</p>
              <p>• Prepare your equipment and arrive 15 minutes early</p>
            </div>
          )}

          {booking.status === 'confirmed' && (
            <div className="space-y-2 text-sm">
              <p>• Your booking is confirmed! 🎉</p>
              <p>• Arrive 15 minutes before your scheduled time</p>
              <p>• Bring your payment if paying cash at venue</p>
              <p>• Contact the field owner if you need directions</p>
              <p>• Have a great game!</p>
            </div>
          )}

          {booking.status === 'cancelled' && (
            <div className="space-y-2 text-sm text-red-600">
              <p>• This booking has been cancelled</p>
              <p>• Refund will be processed if payment was made</p>
              <p>• You can book another time slot if needed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
