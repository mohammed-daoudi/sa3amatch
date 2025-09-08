import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Booking } from '@/lib/models/Booking';
import connectToMongoDB from '@/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(req: NextRequest) {
  try {
    await connectToMongoDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('fieldId').exec();
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user owns the booking
    if (booking.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify booking is in correct state for payment
    if (booking.status !== 'pending' || booking.paymentStatus !== 'pending') {
      return NextResponse.json({
        error: 'Booking is not available for payment'
      }, { status: 400 });
    }

    // Verify payment method is stripe
    if (booking.paymentMethod !== 'stripe') {
      return NextResponse.json({
        error: 'Booking payment method is not Stripe'
      }, { status: 400 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.amount.total * 100), // Amount in cents
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        userId,
        fieldId: booking.fieldId._id.toString(),
        fieldName: booking.fieldId.name,
        timeSlot: `${booking.timeSlot.date.toISOString().split('T')[0]} ${booking.timeSlot.startTime}-${booking.timeSlot.endTime}`
      },
      description: `Sa3aMatch booking for ${booking.fieldId.name}`,
    });

    // Update booking with payment intent ID
    await Booking.findByIdAndUpdate(bookingId, {
      stripePaymentIntentId: paymentIntent.id,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: booking.amount.total
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        error: 'Payment processing error',
        details: error.message
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
