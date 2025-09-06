import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking, Field, User, TimeSlot } from '@/lib/models';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { emailService } from '@/lib/email';
import { bookingService } from '@/lib/booking-service';
import { clerkClient } from '@clerk/nextjs/server';
import mongoose from 'mongoose';

// GET /api/bookings/[id] - Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth();
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    // Find booking with field details
    const booking = await Booking.findById(params.id)
      .populate('fieldId', 'name location photos pricePerHour')
      .lean() as any;

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this booking
    const { searchParams } = new URL(request.url);
    const isAdminRequest = searchParams.get('admin') === 'true';

    if (isAdminRequest) {
      await requireAdmin();
    } else if (booking.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // If admin request, get user details
    let enrichedBooking = booking;
    if (isAdminRequest) {
      const user = await User.findOne({ clerkId: booking.userId })
        .select('firstName lastName email phoneNumber createdAt')
        .lean() as any;

      if (user) {
        // Count total bookings for this user
        const totalBookings = await Booking.countDocuments({ userId: booking.userId });

        enrichedBooking = {
          ...booking,
          userDetails: {
            ...user,
            totalBookings,
            joinedDate: user.createdAt
          }
        };
      }
    }

    return NextResponse.json(enrichedBooking);

  } catch (error) {
    console.error('Error fetching booking:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings/[id] - Update booking (admin moderation)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = await requireAdmin();
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, adminNotes, cancelationReason } = body;

    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    // Handle different actions
    switch (action) {
      case 'approve':
        if (booking.status !== 'pending') {
          return NextResponse.json(
            { error: 'Only pending bookings can be approved' },
            { status: 400 }
          );
        }

        // Check if time slot is still available
        const conflictingBooking = await Booking.findOne({
          _id: { $ne: params.id },
          fieldId: booking.fieldId,
          date: booking.date,
          $or: [
            {
              startTime: { $lt: booking.endTime },
              endTime: { $gt: booking.startTime }
            }
          ],
          status: 'approved'
        });

        if (conflictingBooking) {
          return NextResponse.json(
            { error: 'Time slot is no longer available' },
            { status: 409 }
          );
        }

        updateData.status = 'approved';
        updateData.approvedBy = adminId;
        updateData.approvedAt = new Date();
        break;

      case 'reject':
        if (booking.status !== 'pending') {
          return NextResponse.json(
            { error: 'Only pending bookings can be rejected' },
            { status: 400 }
          );
        }
        updateData.status = 'rejected';
        break;

      case 'cancel':
        // Use booking service for atomic cancellation
        const cancelResult = await bookingService.cancelBooking(
          params.id,
          adminId,
          cancelationReason
        );

        if (!cancelResult.success) {
          return NextResponse.json(
            { error: cancelResult.error },
            { status: 400 }
          );
        }

        // Return early with the canceled booking from the service
        // Send email notification
        if (cancelResult.booking) {
          try {
            const clerk = await clerkClient();
            const user = await clerk.users.getUser(cancelResult.booking.userId);
            const userEmail = user.emailAddresses?.[0]?.emailAddress;
            const userName = user.firstName || undefined;

            if (userEmail) {
              await emailService.sendBookingCanceled(cancelResult.booking as any, userEmail, userName);
            }
          } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
            // Don't fail the cancellation if email fails
          }
        }

        return NextResponse.json(cancelResult.booking);
        break;

      case 'update_notes':
        // Just update admin notes
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Always update admin notes if provided
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate('fieldId', 'name location photos pricePerHour');

    // Send email notification for status changes
    if (updatedBooking && ['approve', 'reject', 'cancel'].includes(action)) {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(updatedBooking.userId);
        const userEmail = user.emailAddresses?.[0]?.emailAddress;
        const userName = user.firstName || undefined;

        if (userEmail) {
          switch (action) {
            case 'approve':
              await emailService.sendBookingApproved(updatedBooking as any, userEmail, userName);
              break;
            case 'reject':
              await emailService.sendBookingRejected(updatedBooking as any, userEmail, userName);
              break;
            case 'cancel':
              await emailService.sendBookingCanceled(updatedBooking as any, userEmail, userName);
              break;
          }
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the booking update if email fails
      }
    }

    return NextResponse.json(updatedBooking);

  } catch (error) {
    console.error('Error updating booking:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Delete booking (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = await requireAdmin();
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of canceled or rejected bookings
    if (!['canceled', 'rejected'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Only canceled or rejected bookings can be deleted' },
        { status: 400 }
      );
    }

    await Booking.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'Booking deleted successfully',
      deletedBy: adminId
    });

  } catch (error) {
    console.error('Error deleting booking:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
