import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking, Field, User } from '@/lib/models';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();

    // Get current date for calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch basic counts
    const [totalFields, totalBookings, totalUsers, activeFields] = await Promise.all([
      Field.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments(),
      Field.countDocuments({ isActive: { $ne: false } }) // Assuming fields have an isActive field
    ]);

    // Revenue calculations
    const [currentMonthRevenue, lastMonthRevenue] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' },
            count: { $sum: 1 }
          }
        }
      ]),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: lastMonth, $lte: endOfLastMonth },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ])
    ]);

    const totalRevenue = currentMonthRevenue[0]?.total || 0;
    const lastMonthTotal = lastMonthRevenue[0]?.total || 0;
    const approvedBookingsCount = currentMonthRevenue[0]?.count || 0;

    // Calculate growth
    const monthlyGrowth = lastMonthTotal > 0
      ? ((totalRevenue - lastMonthTotal) / lastMonthTotal * 100)
      : 0;

    // Pending bookings
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // Average booking value
    const averageBookingValue = approvedBookingsCount > 0
      ? Math.round(totalRevenue / approvedBookingsCount)
      : 0;

    // Recent bookings (last 10)
    const recentBookings = await Booking.find()
      .populate('fieldId', 'name')
      .populate('userId') // This might need adjustment based on your User schema
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Transform recent bookings data
    const transformedRecentBookings = await Promise.all(
      recentBookings.map(async (booking: any) => {
        // Get user details from Clerk ID if needed
        let userName = 'Unknown User';
        if (booking.userId) {
          try {
            const user = await User.findOne({ clerkId: booking.userId }).lean() as any;
            if (user) {
              userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User';
            }
          } catch (error) {
            console.error('Error fetching user details:', error);
          }
        }

        return {
          id: booking._id.toString(),
          fieldName: booking.fieldId?.name || 'Unknown Field',
          userName,
          date: booking.date,
          time: `${booking.startTime}-${booking.endTime}`,
          status: booking.status,
          amount: booking.totalPrice
        };
      })
    );

    const stats = {
      totalFields,
      totalBookings,
      totalUsers,
      totalRevenue,
      pendingBookings,
      activeFields,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10, // Round to 1 decimal
      averageBookingValue,
      recentBookings: transformedRecentBookings
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching admin overview:', error);

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
