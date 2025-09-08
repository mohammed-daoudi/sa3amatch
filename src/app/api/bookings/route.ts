import { NextRequest, NextResponse } from 'next/server';
import { Booking } from '@/lib/models/Booking';
import { Field } from '@/lib/models/Field';
import connectToMongoDB from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const bookingSchema = z.object({
  fieldId: z.string(),
  date: z.string().refine((date) => {
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  }, 'Booking date cannot be in the past'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  playerName: z.string().min(2, 'Player name must be at least 2 characters'),
  playerEmail: z.string().email('Invalid email address'),
  playerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'stripe']),
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

    // Validate input
    const validationResult = bookingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid booking data',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const { fieldId, date, startTime, endTime, playerName, playerEmail, playerPhone, paymentMethod, notes } = validationResult.data;

    // Check if field exists
    const field = await Field.findById(fieldId);
    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Check for time slot conflicts using the correct schema structure
    const existingBooking = await Booking.findOne({
      fieldId,
      'timeSlot.date': new Date(date),
      $or: [
        {
          'timeSlot.startTime': { $lt: endTime },
          'timeSlot.endTime': { $gt: startTime }
        }
      ],
      status: { $nin: ['rejected', 'cancelled'] }
    });

    if (existingBooking) {
      return NextResponse.json({
        error: 'Time slot conflicts with existing booking',
        conflictingBooking: existingBooking._id
      }, { status: 409 });
    }

    // Validate that start time is before end time
    if (startTime >= endTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Check if booking is for a valid time (not in the past)
    const bookingDateTime = new Date(`${date}T${startTime}:00`);
    if (bookingDateTime <= new Date()) {
      return NextResponse.json({ error: 'Cannot book past time slots' }, { status: 400 });
    }

    // Calculate duration in hours
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalAmount = field.pricePerHour * durationHours;

    // Create booking with correct schema structure
    const booking = new Booking({
      fieldId,
      userId,
      timeSlot: {
        date: new Date(date),
        startTime,
        endTime
      },
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      amount: {
        total: totalAmount,
        deposit: paymentMethod === 'bank_transfer' ? totalAmount * 0.3 : undefined, // 30% deposit for bank transfer
        remaining: paymentMethod === 'bank_transfer' ? totalAmount * 0.7 : undefined
      },
      notes: notes || '',
      // Store player info in notes for now (we'll add proper user profile fields later)
      adminNotes: `Player: ${playerName}, Email: ${playerEmail}, Phone: ${playerPhone}`
    });

    await booking.save();

    // TODO: Send confirmation email via Resend
    // TODO: Process payment if needed

    return NextResponse.json({
      success: true,
      booking: {
        id: booking._id,
        fieldId: booking.fieldId,
        fieldName: field.name,
        timeSlot: booking.timeSlot,
        paymentMethod: booking.paymentMethod,
        amount: booking.amount,
        status: booking.status,
        createdAt: booking.createdAt
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Time slot is already booked' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToMongoDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: Record<string, any> = { userId };
    if (status) {
      query.status = status;
    }

    // Get bookings with pagination
    const skip = (page - 1) * limit;
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate('fieldId', 'name location photos')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      bookings: bookings.map(booking => ({
        id: booking._id,
        field: booking.fieldId,
        timeSlot: booking.timeSlot,
        amount: booking.amount,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
