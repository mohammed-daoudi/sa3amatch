import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Field, Booking } from '@/lib/models';
import { updateFieldSchema } from '@/lib/validations';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/fields/[id] - Get field details with availability
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid field ID' },
        { status: 400 }
      );
    }

    const field = await Field.findById(params.id).select('-__v').lean() as any;

    if (!field) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      );
    }

    if (!field.isActive) {
      return NextResponse.json(
        { error: 'Field is not available' },
        { status: 404 }
      );
    }

    // Get query parameters for availability check
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let availableSlots = null;

    // If date is provided, calculate available time slots
    if (date) {
      const requestedDate = new Date(date);
      const dayOfWeek = requestedDate.getDay();

      // Find the availability for the requested day
      const dayAvailability = field.availability.find(
        (avail: any) => avail.dayOfWeek === dayOfWeek && avail.isAvailable
      );

      if (dayAvailability) {
        // Get existing bookings for this field and date
        const existingBookings = await Booking.find({
          fieldId: params.id,
          date: {
            $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
            $lt: new Date(requestedDate.setHours(23, 59, 59, 999))
          },
          status: { $in: ['pending', 'approved'] }
        }).select('startTime endTime').lean() as unknown as Array<{ startTime: string; endTime: string }>;

        // Generate available time slots
        availableSlots = generateAvailableSlots(
          dayAvailability.startTime,
          dayAvailability.endTime,
          existingBookings
        );
      } else {
        availableSlots = [];
      }
    }

    return NextResponse.json({
      ...field,
      availableSlots
    });

  } catch (error) {
    console.error('Error fetching field:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/fields/[id] - Update field (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid field ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData = updateFieldSchema.parse(body);

    const field = await Field.findByIdAndUpdate(
      params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!field) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(field);

  } catch (error) {
    console.error('Error updating field:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid field data', details: error },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/fields/[id] - Delete field (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid field ID' },
        { status: 400 }
      );
    }

    // Check if field has active bookings
    const activeBookings = await Booking.countDocuments({
      fieldId: params.id,
      status: { $in: ['pending', 'approved'] },
      date: { $gte: new Date() }
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete field with active bookings' },
        { status: 409 }
      );
    }

    // Soft delete by setting isActive to false
    const field = await Field.findByIdAndUpdate(
      params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!field) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Field deleted successfully' });

  } catch (error) {
    console.error('Error deleting field:', error);

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

// Helper function to generate available time slots
function generateAvailableSlots(
  startTime: string,
  endTime: string,
  existingBookings: Array<{ startTime: string; endTime: string }>
): string[] {
  const slots: string[] = [];
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  // Generate 1-hour slots
  for (let time = start; time < end; time += 60) {
    const slotStart = minutesToTime(time);
    const slotEnd = minutesToTime(time + 60);

    // Check if slot conflicts with existing bookings
    const hasConflict = existingBookings.some(booking => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);

      return (time < bookingEnd && time + 60 > bookingStart);
    });

    if (!hasConflict) {
      slots.push(slotStart);
    }
  }

  return slots;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
