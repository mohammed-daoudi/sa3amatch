import { NextResponse } from 'next/server';
import connectToMongoDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { Field } from '@/lib/models/Field';
import { Booking } from '@/lib/models/Booking';
import { Review } from '@/lib/models/Review';

export async function GET() {
  try {
    // Connect to database
    await connectToMongoDB();

    // Test database connection by counting documents in each collection
    const userCount = await User.countDocuments();
    const fieldCount = await Field.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const reviewCount = await Review.countDocuments();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      collections: {
        users: userCount,
        fields: fieldCount,
        bookings: bookingCount,
        reviews: reviewCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
