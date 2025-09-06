'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const bookingSchema = z.object({
  date: z.string().refine((date) => new Date(date) > new Date(), 'Date must be in the future'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'stripe']),
  notes: z.string().optional(),
}).refine((data) => {
  const start = new Date(`1970-01-01T${data.startTime}:00`);
  const end = new Date(`1970-01-01T${data.endTime}:00`);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  fieldId: string;
  pricePerHour: number;
  timeSlots: string[];
}

export default function BookingForm({ fieldId, pricePerHour, timeSlots }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [uploadedProof, setUploadedProof] = useState<{ url: string; filename: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const watchedStartTime = watch('startTime');
  const watchedEndTime = watch('endTime');
  const watchedPaymentMethod = watch('paymentMethod');

  // Calculate duration and total price
  const calculatePrice = () => {
    if (!watchedStartTime || !watchedEndTime) return 0;

    const start = new Date(`1970-01-01T${watchedStartTime}:00`);
    const end = new Date(`1970-01-01T${watchedEndTime}:00`);

    if (end <= start) return 0;

    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return duration * pricePerHour;
  };

  const totalPrice = calculatePrice();
  const duration = totalPrice > 0 ? totalPrice / pricePerHour : 0;

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bookingId', 'temp_' + Date.now());

    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedProof({
          url: data.url,
          filename: data.filename,
        });
        return data;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload payment proof. Please try again.');
      return null;
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);

    try {
      // If bank transfer and file selected, upload it first
      let paymentProofData = null;
      if (data.paymentMethod === 'bank_transfer' && paymentProof) {
        paymentProofData = await handleFileUpload(paymentProof);
        if (!paymentProofData) {
          setIsSubmitting(false);
          return;
        }
      }

      // Create booking
      const bookingData = {
        ...data,
        fieldId,
        paymentProof: paymentProofData || uploadedProof,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const booking = await response.json();
        setShowSuccess(true);
        reset();
        setPaymentProof(null);
        setUploadedProof(null);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <Card className="sticky top-24">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold text-green-600">Booking Successful!</h3>
            <p className="text-gray-600">
              Your booking has been submitted and is pending approval. You'll receive an email confirmation shortly.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Book This Field</CardTitle>
        <CardDescription>
          Select your preferred date and time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <Input
              type="date"
              {...register('date')}
              className="w-full"
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Time</label>
            <select
              {...register('startTime')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.startTime && (
              <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Time</label>
            <select
              {...register('endTime')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.endTime && (
              <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              {...register('paymentMethod')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select payment method</option>
              <option value="cash">Cash Payment</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="stripe">Credit Card</option>
            </select>
            {errors.paymentMethod && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Payment Proof Upload for Bank Transfer */}
          {watchedPaymentMethod === 'bank_transfer' && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-blue-800 mb-2">Bank Transfer Instructions</h4>
              <div className="text-sm text-blue-700 mb-3 space-y-1">
                <p><strong>Account:</strong> Sa3aMatch Sports</p>
                <p><strong>IBAN:</strong> MA64 0000 0000 0000 0000 0000</p>
                <p><strong>Amount:</strong> {totalPrice} MAD</p>
              </div>

              <label className="block text-sm font-medium mb-2 text-blue-800">
                Upload Payment Proof <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('File size must be less than 5MB');
                        return;
                      }
                      setPaymentProof(file);
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                />
                {paymentProof && (
                  <div className="flex items-center text-sm text-green-600">
                    <Upload className="w-4 h-4 mr-1" />
                    Ready to upload: {paymentProof.name}
                  </div>
                )}
                {uploadedProof && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Uploaded: {uploadedProof.filename}
                  </div>
                )}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Accepted formats: JPG, PNG, PDF (max 5MB)
              </p>
            </div>
          )}

          {/* Cash Payment Info */}
          {watchedPaymentMethod === 'cash' && (
            <div className="border rounded-lg p-4 bg-green-50">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-4 h-4 text-green-600 mr-2" />
                <h4 className="font-medium text-green-800">Cash Payment</h4>
              </div>
              <p className="text-sm text-green-700">
                You can pay {totalPrice} MAD in cash when you arrive at the field.
                Your booking will be pending until payment is confirmed.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <Textarea
              {...register('notes')}
              placeholder="Any special requests or notes..."
              className="w-full"
              rows={3}
            />
          </div>

          {totalPrice > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span>Duration</span>
                <span className="font-medium">{duration} hour{duration !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Price per hour</span>
                <span className="font-medium">{pricePerHour} MAD</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-green-600">{totalPrice} MAD</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || (watchedPaymentMethod === 'bank_transfer' && !paymentProof && !uploadedProof)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Processing...' : 'Book Now'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            You will receive a confirmation email after booking.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
