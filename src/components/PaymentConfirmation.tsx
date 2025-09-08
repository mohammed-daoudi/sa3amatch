'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentProofUpload } from './PaymentProofUpload';
import { StripeCheckout } from './StripeCheckout';
import {
  CreditCard,
  Banknote,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign
} from 'lucide-react';

interface PaymentConfirmationProps {
  booking: {
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
  };
  onPaymentComplete: (paymentData: any) => void;
}

export function PaymentConfirmation({ booking, onPaymentComplete }: PaymentConfirmationProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedProof, setUploadedProof] = useState<any>(null);

  const handleCashPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: 'cash',
          amount: booking.amount.total,
          notes: 'Cash payment selected - will pay at venue'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment processing failed');
      }

      const result = await response.json();
      onPaymentComplete(result);
    } catch (error) {
      console.error('Cash payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBankTransferPayment = async () => {
    if (!uploadedProof) {
      setError('Please upload payment proof before confirming');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: 'bank_transfer',
          paymentProofId: uploadedProof.id,
          amount: booking.amount.total,
          notes: 'Bank transfer payment with uploaded proof'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment processing failed');
      }

      const result = await response.json();
      onPaymentComplete(result);
    } catch (error) {
      console.error('Bank transfer payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    // TODO: Implement Stripe payment
    setError('Stripe payments coming soon!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
            Booking Created Successfully
          </CardTitle>
          <CardDescription>
            Complete your payment to confirm the booking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Field</p>
              <p className="font-medium">{booking.field.name}</p>
              <p className="text-sm text-gray-600">{booking.field.location.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="font-medium">{formatDate(booking.timeSlot.date)}</p>
              <p className="text-sm text-gray-600">
                {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-lg font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-green-600">
              ${booking.amount.total}
            </span>
          </div>

          {booking.amount.deposit && (
            <div className="text-sm text-gray-600">
              <p>Deposit required: ${booking.amount.deposit}</p>
              <p>Remaining: ${booking.amount.remaining}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Specific Content */}
      {booking.paymentMethod === 'cash' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Banknote className="mr-2 h-5 w-5" />
              Cash Payment
            </CardTitle>
            <CardDescription>
              Pay in cash when you arrive at the venue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Bring exact amount: ${booking.amount.total}</li>
                    <li>Arrive 15 minutes before your slot</li>
                    <li>Booking will be confirmed upon payment</li>
                    <li>No refunds for late arrivals</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <Button
              onClick={handleCashPayment}
              disabled={processing}
              className="w-full"
            >
              {processing ? 'Processing...' : 'Confirm Cash Payment'}
            </Button>
          </CardContent>
        </Card>
      )}

      {booking.paymentMethod === 'bank_transfer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Bank Transfer Payment
            </CardTitle>
            <CardDescription>
              Upload proof of your bank transfer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PaymentProofUpload
              bookingId={booking.id}
              onUploadComplete={setUploadedProof}
              onUploadError={setError}
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <Button
              onClick={handleBankTransferPayment}
              disabled={processing || !uploadedProof}
              className="w-full"
            >
              {processing ? 'Processing...' : 'Confirm Bank Transfer Payment'}
            </Button>
          </CardContent>
        </Card>
      )}

      {booking.paymentMethod === 'stripe' && (
        <StripeCheckout
          bookingId={booking.id}
          amount={booking.amount.total}
          onPaymentSuccess={onPaymentComplete}
          onPaymentError={setError}
        />
      )}

      {/* Status Badge */}
      <div className="text-center">
        <Badge variant="outline" className="text-sm">
          Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Badge>
      </div>
    </div>
  );
}
