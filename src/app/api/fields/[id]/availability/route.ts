import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { bookingService } from '@/lib/booking-service';
import mongoose from 'mongoose';

// GET /api/fields/[id]/availability - Get available time slots for a field
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Validate field ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid field ID' },
        { status: 400 }
      );
    }

    // Get date from query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Get available slots using booking service
    const result = await bookingService.getAvailableSlots(params.id, date);

    if (!result.success) {
      const statusCode = result.error === 'Field not found or inactive' ? 404 : 400;
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      fieldId: params.id,
      date,
      availableSlots: result.availableSlots,
      totalSlots: result.availableSlots?.length || 0
    });

  } catch (error) {
    console.error('Error fetching field availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
