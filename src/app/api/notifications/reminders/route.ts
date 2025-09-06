import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking } from '@/lib/models';
import { emailService } from '@/lib/email';
import { clerkClient } from '@clerk/nextjs/server';

// POST /api/notifications/reminders - Send reminder emails for upcoming bookings
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (could be from a cron job)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'development-secret';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find bookings happening in 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Get approved bookings for tomorrow
    const upcomingBookings = await Booking.find({
      status: 'approved',
      date: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      }
    }).populate('fieldId', 'name location photos pricePerHour');

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Send reminder email for each booking
    for (const booking of upcomingBookings) {
      try {
        // Get user details from Clerk
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(booking.userId);
        const userEmail = user.emailAddresses?.[0]?.emailAddress;
        const userName = user.firstName || undefined;

        if (userEmail) {
          const result = await emailService.sendBookingReminder(
            booking as any,
            userEmail,
            userName
          );

          if (result.success) {
            successCount++;
            results.push({
              bookingId: booking._id,
              userEmail,
              status: 'sent'
            });
          } else {
            errorCount++;
            results.push({
              bookingId: booking._id,
              userEmail,
              status: 'failed',
              error: result.error
            });
          }
        } else {
          errorCount++;
          results.push({
            bookingId: booking._id,
            status: 'failed',
            error: 'No email address found'
          });
        }
      } catch (error) {
        errorCount++;
        results.push({
          bookingId: booking._id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'Reminder emails processed',
      summary: {
        totalBookings: upcomingBookings.length,
        successCount,
        errorCount
      },
      results
    });

  } catch (error) {
    console.error('Error sending reminder emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/notifications/reminders - Get preview of upcoming bookings that would receive reminders
export async function GET() {
  try {
    await dbConnect();

    // Find bookings happening in 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Get approved bookings for tomorrow
    const upcomingBookings = await Booking.find({
      status: 'approved',
      date: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      }
    })
    .populate('fieldId', 'name location')
    .select('userId date startTime endTime duration totalPrice fieldId')
    .lean();

    return NextResponse.json({
      date: tomorrow.toISOString().split('T')[0],
      bookingsCount: upcomingBookings.length,
      bookings: upcomingBookings.map(booking => ({
        id: booking._id,
        userId: booking.userId,
        field: booking.fieldId,
        time: `${booking.startTime} - ${booking.endTime}`,
        duration: booking.duration
      }))
    });

  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
