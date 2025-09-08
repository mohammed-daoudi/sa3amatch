'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PaymentConfirmation } from '@/components/PaymentConfirmation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  field: {
    name: string;
    location: { address: string };
  };
  timeSlot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  amount: {
    total: number;
    deposit?: number;
    remaining?: number;
  };
  paymentMethod: 'cash' | 'bank_transfer' | 'stripe';
  status: string;
}

export default function BookingConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fieldId = params.id as string;
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) {
        setError('Booking ID not provided');
        setLoading(false);
        return;
      }

      try {
        // First, get the booking details
        const response = await fetch('/api/bookings');
        if (!response.ok) {
          throw new Error('Failed to load booking');
        }

        const result = await response.json();
        const foundBooking = result.bookings.find((b: any) => b.id === bookingId);

        if (!foundBooking) {
          throw new Error('Booking not found');
        }

        setBooking(foundBooking);
      } catch (error) {
        console.error('Error loading booking:', error);
        setError(error instanceof Error ? error.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId]);

  const handlePaymentComplete = (paymentData: any) => {
    // Redirect to booking details page after successful payment
    router.push(`/bookings/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">⚠️ {error || 'Booking not found'}</div>
        <div className="space-x-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => router.push('/fields')} variant="default">
            Browse Fields
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/fields/${fieldId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600">Confirm your booking by completing the payment</p>
        </div>
      </div>

      {/* Payment Confirmation */}
      <div className="max-w-2xl mx-auto">
        <PaymentConfirmation
          booking={booking}
          onPaymentComplete={handlePaymentComplete}
        />
      </div>
    </div>
  );
}
