import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking, Field, User } from '@/lib/models';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { emailService } from '@/lib/email';
import { currentUser } from '@clerk/nextjs/server';
import { bookingService } from '@/lib/booking-service';
import mongoose from 'mongoose';

// GET /api/bookings - List bookings (admin gets all, users get their own)
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    // Build query based on user role
    const query: Record<string, any> = {};

    if (isAdmin) {
      // Verify admin access
      await requireAdmin();

      // Admin can filter by various parameters
      const status = searchParams.get('status');
      const paymentMethod = searchParams.get('paymentMethod');
      const fieldId = searchParams.get('fieldId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (status) query.status = status;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (fieldId && mongoose.Types.ObjectId.isValid(fieldId)) {
        query.fieldId = fieldId;
      }
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
    } else {
      // Regular users only see their own bookings
      query.userId = userId;
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Execute query with population
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('fieldId', 'name location photos pricePerHour')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query)
    ]);

    // If admin request, also get user details
    let enrichedBookings = bookings;
    if (isAdmin) {
      const userIds = [...new Set(bookings.map((b: any) => b.userId))];
      const users = await User.find({ clerkId: { $in: userIds } })
        .select('clerkId firstName lastName email phoneNumber')
        .lean();

      const userMap = new Map(users.map((u: any) => [u.clerkId, u]));

      enrichedBookings = bookings.map((booking: any) => ({
        ...booking,
        userDetails: userMap.get(booking.userId) || null
      }));
    }

    return NextResponse.json({
      bookings: enrichedBookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);

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

// POST /api/bookings - Create new booking with concurrency protection
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    await dbConnect();

    const body = await request.json();
    const { fieldId, date, startTime, endTime, paymentMethod, notes, paymentProof } = body;

    // Validate required fields
    if (!fieldId || !date || !startTime || !endTime || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!['cash', 'bank_transfer', 'stripe'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Prepare booking request
    const bookingRequest = {
      fieldId,
      userId,
      date,
      startTime,
      endTime,
      paymentMethod,
      notes,
      paymentProof: paymentProof && paymentMethod === 'bank_transfer' ? {
        filename: paymentProof.filename,
        url: paymentProof.url,
        uploadedAt: new Date(paymentProof.uploadedAt || Date.now())
      } : undefined
    };

    // Use booking service for atomic booking creation
    const result = await bookingService.createBooking(bookingRequest);

    if (!result.success) {
      const statusCode = (() => {
        switch (result.errorCode) {
          case 'FIELD_NOT_FOUND': return 404;
          case 'FIELD_INACTIVE': return 400;
          case 'INVALID_TIME': return 400;
          case 'TIME_CONFLICT': return 409;
          case 'VALIDATION_ERROR': return 400;
          default: return 500;
        }
      })();

      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: statusCode }
      );
    }

    // Send confirmation email
    try {
      const user = await currentUser();
      if (user?.emailAddresses?.[0]?.emailAddress) {
        await emailService.sendBookingCreated(
          result.booking as any,
          user.emailAddresses[0].emailAddress,
          user.firstName || undefined
        );
      }
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json(result.booking, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
