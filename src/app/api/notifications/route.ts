import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking } from '@/lib/models';
import { emailService } from '@/lib/email';
import { requireAdmin } from '@/lib/auth';
import { clerkClient } from '@clerk/nextjs/server';
import mongoose from 'mongoose';

// POST /api/notifications - Send test emails or manual notifications (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();

    const body = await request.json();
    const { type, bookingId, userEmail, testData } = body;

    switch (type) {
      case 'test_booking_created':
        if (!testData) {
          return NextResponse.json(
            { error: 'Test data required for test emails' },
            { status: 400 }
          );
        }

        const result = await emailService.sendBookingCreated(
          testData,
          userEmail || 'test@example.com',
          'Test User'
        );

        return NextResponse.json({
          message: 'Test email sent',
          success: result.success,
          error: result.error
        });

      case 'resend_confirmation':
        if (!bookingId) {
          return NextResponse.json(
            { error: 'Booking ID required' },
            { status: 400 }
          );
        }

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
          return NextResponse.json(
            { error: 'Invalid booking ID' },
            { status: 400 }
          );
        }

        const booking = await Booking.findById(bookingId)
          .populate('fieldId', 'name location photos pricePerHour');

        if (!booking) {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          );
        }

        // Get user details
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(booking.userId);
        const targetEmail = userEmail || user.emailAddresses?.[0]?.emailAddress;
        const userName = user.firstName || undefined;

        if (!targetEmail) {
          return NextResponse.json(
            { error: 'No email address available' },
            { status: 400 }
          );
        }

        // Send appropriate email based on booking status
        let emailResult;
        switch (booking.status) {
          case 'pending':
            emailResult = await emailService.sendBookingCreated(booking as any, targetEmail, userName);
            break;
          case 'approved':
            emailResult = await emailService.sendBookingApproved(booking as any, targetEmail, userName);
            break;
          case 'rejected':
            emailResult = await emailService.sendBookingRejected(booking as any, targetEmail, userName);
            break;
          case 'canceled':
            emailResult = await emailService.sendBookingCanceled(booking as any, targetEmail, userName);
            break;
          default:
            return NextResponse.json(
              { error: 'Cannot send email for booking status: ' + booking.status },
              { status: 400 }
            );
        }

        return NextResponse.json({
          message: `${booking.status} email resent`,
          bookingId: booking._id,
          status: booking.status,
          recipient: targetEmail,
          success: emailResult.success,
          error: emailResult.error
        });

      case 'send_reminder':
        if (!bookingId) {
          return NextResponse.json(
            { error: 'Booking ID required' },
            { status: 400 }
          );
        }

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
          return NextResponse.json(
            { error: 'Invalid booking ID' },
            { status: 400 }
          );
        }

        const reminderBooking = await Booking.findById(bookingId)
          .populate('fieldId', 'name location photos pricePerHour');

        if (!reminderBooking) {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          );
        }

        if (reminderBooking.status !== 'approved') {
          return NextResponse.json(
            { error: 'Only approved bookings can receive reminders' },
            { status: 400 }
          );
        }

        const reminderClerk = await clerkClient();
        const reminderUser = await reminderClerk.users.getUser(reminderBooking.userId);
        const reminderEmail = userEmail || reminderUser.emailAddresses?.[0]?.emailAddress;
        const reminderUserName = reminderUser.firstName || undefined;

        if (!reminderEmail) {
          return NextResponse.json(
            { error: 'No email address available' },
            { status: 400 }
          );
        }

        const reminderResult = await emailService.sendBookingReminder(
          reminderBooking as any,
          reminderEmail,
          reminderUserName
        );

        return NextResponse.json({
          message: 'Reminder email sent',
          bookingId: reminderBooking._id,
          recipient: reminderEmail,
          success: reminderResult.success,
          error: reminderResult.error
        });

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error sending notification:', error);

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

// GET /api/notifications - Get notification statistics (admin only)
export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();

    // Get some basic stats about recent bookings that would trigger emails
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const upcomingApproved = await Booking.countDocuments({
      status: 'approved',
      date: { $gte: new Date() }
    });

    return NextResponse.json({
      message: 'Email notification statistics',
      period: 'Last 7 days',
      recentBookingsByStatus: recentBookings.reduce((acc: any, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      upcomingApprovedBookings: upcomingApproved,
      emailConfig: {
        resendConfigured: !!process.env.RESEND_API_KEY,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'Not configured'
      }
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);

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
