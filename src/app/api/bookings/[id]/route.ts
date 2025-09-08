import { NextRequest, NextResponse } from 'next/server';
import { Booking, IBooking } from '@/lib/models/Booking';
import { Field } from '@/lib/models/Field';
import connectToMongoDB from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;

    // Find booking and populate field details
    const booking = await Booking.findById(bookingId)
      .populate('fieldId')
      .exec();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if user owns this booking (or is admin)
    if (booking.userId !== userId) {
      // TODO: Add admin role check here
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking._id,
        field: booking.fieldId,
        timeSlot: booking.timeSlot,
        amount: booking.amount,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        notes: booking.notes,
        adminNotes: booking.adminNotes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;
    const updates = await req.json();

    // Find existing booking
    const existingBooking = await Booking.findById(bookingId).exec();
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check ownership
    if (existingBooking.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Restrict updates based on booking status
    if (existingBooking.status === 'approved' && updates.status === 'cancelled') {
      // Allow cancellation
      const bookingDateTime = new Date(`${existingBooking.timeSlot.date.toISOString().split('T')[0]}T${existingBooking.timeSlot.startTime}:00`);
      const now = new Date();
      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilBooking < 24) {
        return NextResponse.json({
          error: 'Cannot cancel booking less than 24 hours before start time'
        }, { status: 400 });
      }
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('fieldId').exec();

    if (!updatedBooking) {
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

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
        adminNotes: updatedBooking.adminNotes,
        createdAt: updatedBooking.createdAt,
        updatedAt: updatedBooking.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;

    // Find booking
    const booking = await Booking.findById(bookingId).exec();
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check ownership
    if (booking.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow deletion if booking is pending
    if (booking.status !== 'pending') {
      return NextResponse.json({
        error: 'Can only delete pending bookings'
      }, { status: 400 });
    }

    await Booking.findByIdAndDelete(bookingId);

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
