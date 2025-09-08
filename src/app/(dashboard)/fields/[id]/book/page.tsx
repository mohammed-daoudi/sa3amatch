'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  User,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Banknote,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Field {
  id: string;
  name: string;
  location: { address: string };
  pricePerHour: number;
  photos: string[];
  surface: string;
  lighting: boolean;
}

interface TimeSlot {
  time: string;
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
  reason?: string;
}

interface AvailabilityDay {
  date: string;
  day: string;
  slots: TimeSlot[];
}

interface BookingForm {
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'stripe';
  notes: string;
}

export default function BookFieldPage() {
  const params = useParams();
  const router = useRouter();
  const fieldId = params.id as string;

  const [field, setField] = useState<Field | null>(null);
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    playerName: '',
    playerEmail: '',
    playerPhone: '',
    paymentMethod: 'cash',
    notes: ''
  });

  // Load field and availability data
  useEffect(() => {
    const loadData = async () => {
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

        // Load availability for next 30 days
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        const availabilityResponse = await fetch(
          `/api/fields/${fieldId}/availability?startDate=${new Date().toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
        );
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();
          setAvailability(availabilityData.availability || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load booking information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (fieldId) {
      loadData();
    }
  }, [fieldId]);

  // Get available slots for selected date
  const getSelectedDaySlots = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayData = availability.find(day => day.date === dateStr);
    return dayData?.slots || [];
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedSlot || !bookingForm.playerName || !bookingForm.playerEmail || !bookingForm.playerPhone) {
      setError('Please fill in all required fields and select a time slot.');
      return;
    }

    setBookingLoading(true);
    setError(null);

    try {
      // Find the selected slot details to get startTime and endTime
      const selectedSlotDetails = getSelectedDaySlots().find(slot => slot.time === selectedSlot);
      if (!selectedSlotDetails) {
        throw new Error('Selected time slot not found');
      }

      const bookingData = {
        fieldId,
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedSlotDetails.startTime,
        endTime: selectedSlotDetails.endTime,
        playerName: bookingForm.playerName,
        playerEmail: bookingForm.playerEmail,
        playerPhone: bookingForm.playerPhone,
        paymentMethod: bookingForm.paymentMethod,
        notes: bookingForm.notes
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Booking failed');
      }

      const result = await response.json();

      // Redirect to payment confirmation page
      router.push(`/fields/${fieldId}/book/confirm?bookingId=${result.booking.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error instanceof Error ? error.message : 'Failed to create booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!selectedSlot || !field) return 0;
    return field.pricePerHour;
  };

  // Check if a date has available slots
  const hasAvailableSlots = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = availability.find(day => day.date === dateStr);
    return dayData?.slots.some(slot => slot.available) || false;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !field) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!field) return null;

  const selectedDaySlots = getSelectedDaySlots();
  const totalPrice = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book {field.name}</h1>
          <p className="text-gray-600">{field.location.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Booking Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Field Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <Image
                  src={field.photos[0]}
                  alt={field.name}
                  width={120}
                  height={80}
                  className="rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{field.name}</h3>
                  <p className="text-gray-600">{field.location.address}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline" className="capitalize">
                      {field.surface}
                    </Badge>
                    {field.lighting && (
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        Lighting
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      ${field.pricePerHour}/hour
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setSelectedSlot(''); // Reset slot selection
                  }
                }}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isBeforeToday = date < today;
                  const isMoreThan30Days = date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  return isBeforeToday || isMoreThan30Days || !hasAvailableSlots(date);
                }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Time Slot Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Select Time Slot
              </CardTitle>
              <CardDescription>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDaySlots.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedDaySlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedSlot === slot.time ? "default" : "outline"}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className="h-12"
                    >
                      <div className="text-center">
                        <div className="text-sm font-medium">{slot.startTime} - {slot.endTime}</div>
                        <div className="text-xs">
                          {slot.available ? `$${slot.price}` : 'Booked'}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No time slots available for this date
                </div>
              )}
            </CardContent>
          </Card>

          {/* Player Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Player Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="playerName">Full Name *</Label>
                  <Input
                    id="playerName"
                    placeholder="Enter your full name"
                    value={bookingForm.playerName}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, playerName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="playerPhone">Phone Number *</Label>
                  <Input
                    id="playerPhone"
                    placeholder="Enter your phone number"
                    value={bookingForm.playerPhone}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, playerPhone: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="playerEmail">Email Address *</Label>
                <Input
                  id="playerEmail"
                  type="email"
                  placeholder="Enter your email address"
                  value={bookingForm.playerEmail}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, playerEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any special requests or notes"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Payment Method
              </CardTitle>
              <CardDescription>
                Choose how you'd like to pay for your booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {/* Cash Payment Option */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    bookingForm.paymentMethod === 'cash'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setBookingForm(prev => ({ ...prev, paymentMethod: 'cash' }))}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={bookingForm.paymentMethod === 'cash'}
                      onChange={() => setBookingForm(prev => ({ ...prev, paymentMethod: 'cash' }))}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Banknote className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">Cash Payment</p>
                      <p className="text-sm text-gray-600">Pay when you arrive at the venue</p>
                      <p className="text-sm font-medium text-green-600">Full amount: ${field?.pricePerHour || 0}</p>
                    </div>
                  </div>
                  {bookingForm.paymentMethod === 'cash' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                      <p className="font-medium text-amber-800">Important:</p>
                      <ul className="mt-1 text-amber-700 space-y-1">
                        <li>• Bring exact amount in cash</li>
                        <li>• Arrive 15 minutes early</li>
                        <li>• Booking confirmed upon payment</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bank Transfer Option */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    bookingForm.paymentMethod === 'bank_transfer'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setBookingForm(prev => ({ ...prev, paymentMethod: 'bank_transfer' }))}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={bookingForm.paymentMethod === 'bank_transfer'}
                      onChange={() => setBookingForm(prev => ({ ...prev, paymentMethod: 'bank_transfer' }))}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Upload className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-sm text-gray-600">Transfer to our bank account with proof</p>
                      <div className="text-sm space-y-1 mt-1">
                        <p className="font-medium text-blue-600">
                          Deposit: ${field ? Math.round(field.pricePerHour * 0.3) : 0} (30%)
                        </p>
                        <p className="text-gray-600">
                          Remaining: ${field ? Math.round(field.pricePerHour * 0.7) : 0} (pay at venue)
                        </p>
                      </div>
                    </div>
                  </div>
                  {bookingForm.paymentMethod === 'bank_transfer' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                      <p className="font-medium text-blue-800">Bank Transfer Details:</p>
                      <div className="mt-1 text-blue-700 space-y-1">
                        <p>Bank: Example Bank</p>
                        <p>Account: 1234567890</p>
                        <p>Reference: Your booking ID</p>
                        <p className="font-medium">Upload proof after booking!</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stripe Payment Option */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    bookingForm.paymentMethod === 'stripe'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setBookingForm(prev => ({ ...prev, paymentMethod: 'stripe' }))}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={bookingForm.paymentMethod === 'stripe'}
                      onChange={() => setBookingForm(prev => ({ ...prev, paymentMethod: 'stripe' }))}
                      className="h-4 w-4 text-blue-600"
                    />
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">Credit Card Payment</p>
                      <p className="text-sm text-gray-600">Pay instantly with credit or debit card</p>
                      <p className="text-sm font-medium text-green-600">Full amount: ${field?.pricePerHour || 0}</p>
                    </div>
                  </div>
                  {bookingForm.paymentMethod === 'stripe' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
                      <p className="font-medium text-green-800">Stripe Payment:</p>
                      <ul className="mt-1 text-green-700 space-y-1">
                        <li>• Instant booking confirmation</li>
                        <li>• Secure card processing</li>
                        <li>• Immediate field reservation</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Field:</span>
                  <span className="font-medium">{field.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">
                    {selectedDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">
                    {selectedSlot || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">1 hour</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${totalPrice}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <Button
                onClick={handleBooking}
                disabled={!selectedSlot || !bookingForm.playerName || !bookingForm.playerEmail || !bookingForm.playerPhone || bookingLoading}
                className="w-full"
              >
                {bookingLoading ? (
                  'Processing...'
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Booking
                  </>
                )}
              </Button>

              <div className="text-xs text-gray-600 text-center">
                By booking, you agree to our terms and conditions
              </div>
            </CardContent>
          </Card>

          {/* Booking Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Policies</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Free cancellation up to 24 hours before booking</p>
              <p>• No-show will result in full charge</p>
              <p>• Payment required to confirm booking</p>
              <p>• Field availability subject to weather conditions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
