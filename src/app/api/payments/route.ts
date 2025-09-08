import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Booking } from '@/lib/models/Booking';
import { Document } from '@/lib/models/Document';
import connectToMongoDB from '@/lib/db';
import { z } from 'zod';

const paymentConfirmationSchema = z.object({
  bookingId: z.string(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'stripe']),
  paymentProofId: z.string().optional(), // Document ID for bank transfer proof
  transactionId: z.string().optional(), // For Stripe payments
  amount: z.number().min(0),
  notes: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    await connectToMongoDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = paymentConfirmationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid payment data',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const { bookingId, paymentMethod, paymentProofId, transactionId, amount, notes } = validationResult.data;

    // Find the booking
    const booking = await Booking.findById(bookingId).exec();
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user owns the booking
    if (booking.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify booking is in correct state for payment
    if (booking.status !== 'pending') {
      return NextResponse.json({
        error: 'Booking must be pending to process payment'
      }, { status: 400 });
    }

    // Validate amount matches booking total
    if (amount !== booking.amount.total) {
      return NextResponse.json({
        error: 'Payment amount does not match booking total'
      }, { status: 400 });
    }

    let paymentStatus = 'pending';
    let updatedNotes = booking.notes || '';

    // Handle different payment methods
    switch (paymentMethod) {
      case 'cash':
        // Cash payments are marked as pending until admin confirms
        paymentStatus = 'pending';
        updatedNotes += `\nCash payment selected. Payment will be collected at venue.`;
        break;

      case 'bank_transfer':
        if (!paymentProofId) {
          return NextResponse.json({
            error: 'Payment proof is required for bank transfer'
          }, { status: 400 });
        }

        // Verify the payment proof document exists and belongs to this user
        const paymentProof = await Document.findOne({
          _id: paymentProofId,
          userId,
          uploadType: 'payment_proof',
          bookingId
        }).exec();

        if (!paymentProof) {
          return NextResponse.json({
            error: 'Invalid payment proof document'
          }, { status: 400 });
        }

        paymentStatus = 'pending'; // Pending admin verification
        updatedNotes += `\nBank transfer proof uploaded: ${paymentProof.fileName}`;
        break;

      case 'stripe':
        if (!transactionId) {
          return NextResponse.json({
            error: 'Transaction ID is required for Stripe payments'
          }, { status: 400 });
        }

        // TODO: Verify Stripe payment with their API
        // For now, mark as paid (in production, verify with Stripe)
        paymentStatus = 'paid';
        updatedNotes += `\nStripe payment processed. Transaction ID: ${transactionId}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Update booking with payment information
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus,
        paymentProof: paymentProofId || undefined,
        stripePaymentIntentId: transactionId || undefined,
        notes: updatedNotes + (notes ? `\nCustomer notes: ${notes}` : ''),
        // For cash and bank transfer, admin needs to approve
        status: paymentMethod === 'stripe' ? 'approved' : 'pending',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('fieldId').exec();

    if (!updatedBooking) {
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // TODO: Send email notification about payment confirmation
    // TODO: For Stripe payments, send booking confirmation
    // TODO: For cash/bank transfer, notify admin for approval

    return NextResponse.json({
      success: true,
      booking: {
        id: updatedBooking._id,
        field: updatedBooking.fieldId,
        timeSlot: updatedBooking.timeSlot,
        amount: updatedBooking.amount,
        paymentMethod: updatedBooking.paymentMethod,
        paymentStatus: updatedBooking.paymentStatus,
        status: updatedBooking.status,
        notes: updatedBooking.notes,
        createdAt: updatedBooking.createdAt,
        updatedAt: updatedBooking.updatedAt
      },
      message: paymentMethod === 'stripe'
        ? 'Payment processed successfully. Your booking is confirmed!'
        : 'Payment submitted successfully. Your booking is pending admin approval.'
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to retrieve payment information for a booking
export async function GET(req: NextRequest) {
  try {
    await connectToMongoDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate('fieldId', 'name location')
      .exec();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user owns the booking
    if (booking.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get payment proof if exists
    let paymentProof = null;
    if (booking.paymentProof) {
      paymentProof = await Document.findById(booking.paymentProof)
        .select('fileName filePath fileType uploadedAt')
        .exec();
    }

    return NextResponse.json({
      success: true,
      payment: {
        bookingId: booking._id,
        field: booking.fieldId,
        timeSlot: booking.timeSlot,
        amount: booking.amount,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        paymentProof: paymentProof ? {
          id: paymentProof._id,
          fileName: paymentProof.fileName,
          filePath: paymentProof.filePath,
          fileType: paymentProof.fileType,
          uploadedAt: paymentProof.uploadedAt
        } : null,
        stripePaymentIntentId: booking.stripePaymentIntentId
      }
    });

  } catch (error) {
    console.error('Error fetching payment information:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
