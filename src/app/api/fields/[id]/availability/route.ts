import { NextRequest, NextResponse } from 'next/server';
import { Field } from '@/lib/models/Field';
import { Booking } from '@/lib/models/Booking';
import connectToMongoDB from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();

    const fieldId = params.id;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Check if field exists
    const field = await Field.findById(fieldId);
    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Generate date range (default to next 7 days)
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Generate time slots (8 AM to 10 PM, 1-hour slots)
    const timeSlots = [
      { start: '08:00', end: '09:00' },
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '12:00', end: '13:00' },
      { start: '13:00', end: '14:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:00' },
      { start: '17:00', end: '18:00' },
      { start: '18:00', end: '19:00' },
      { start: '19:00', end: '20:00' },
      { start: '20:00', end: '21:00' },
      { start: '21:00', end: '22:00' }
    ];

    const availability = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Get existing bookings for this date using the new schema structure
      const existingBookings = await Booking.find({
        fieldId,
        'timeSlot.date': {
          $gte: new Date(dateStr + 'T00:00:00.000Z'),
          $lt: new Date(dateStr + 'T23:59:59.999Z')
        },
        status: { $nin: ['rejected', 'cancelled'] }
      }).select('timeSlot').lean();

      // Generate slots for this day
      const slots = timeSlots.map(slot => {
        const slotDateTime = new Date(`${dateStr}T${slot.start}:00`);
        const now = new Date();
        const isPast = slotDateTime < now;

        // Check if this time slot conflicts with any existing booking
        const isBooked = existingBookings.some(booking => {
          const bookingStart = booking.timeSlot.startTime;
          const bookingEnd = booking.timeSlot.endTime;

          // Check for overlap: booking conflicts if it overlaps with our slot
          return (
            (bookingStart < slot.end && bookingEnd > slot.start)
          );
        });

        return {
          time: slot.start,
          startTime: slot.start,
          endTime: slot.end,
          available: !isPast && !isBooked,
          price: field.pricePerHour,
          reason: isPast ? 'past' : isBooked ? 'booked' : null
        };
      });

      availability.push({
        date: dateStr,
        day: dayName,
        slots
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      availability,
      fieldId,
      pricePerHour: field.pricePerHour
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
