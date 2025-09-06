import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking, Field, User } from '@/lib/models';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '6months';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '1month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 6);
    }

    // Fetch basic stats
    const [totalBookings, totalFields, totalUsers] = await Promise.all([
      Booking.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Field.countDocuments(),
      User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      })
    ]);

    // Revenue calculation
    const revenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Monthly revenue trend
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Convert month numbers to names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyData = monthlyRevenue.map(item => ({
      month: monthNames[item._id.month - 1],
      revenue: item.revenue,
      bookings: item.bookings
    }));

    // Booking status distribution
    const bookingsByStatus = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusData = bookingsByStatus.map(item => ({
      status: item._id,
      count: item.count,
      percentage: totalBookings > 0 ? (item.count / totalBookings * 100).toFixed(1) : 0
    }));

    // Bookings by day of week
    const bookingsByDay = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const dayData = bookingsByDay.find(item => item._id === (i + 1));
      return {
        day: dayNames[i],
        count: dayData?.count || 0
      };
    });

    // Field utilization
    const fieldUtilization = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'approved'
        }
      },
      {
        $lookup: {
          from: 'fields',
          localField: 'fieldId',
          foreignField: '_id',
          as: 'field'
        }
      },
      {
        $unwind: '$field'
      },
      {
        $group: {
          _id: '$fieldId',
          fieldName: { $first: '$field.name' },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalHours: { $sum: '$duration' }
        }
      },
      {
        $addFields: {
          utilization: {
            $multiply: [
              { $divide: ['$totalHours', { $multiply: [30, 16] }] }, // Assuming 16 hours/day, 30 days
              100
            ]
          }
        }
      },
      {
        $sort: { utilization: -1 }
      }
    ]);

    // Time slot analysis
    const timeSlotData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$startTime',
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const timeSlots = timeSlotData.map(item => ({
      timeSlot: item._id,
      bookings: item.bookings
    }));

    // Calculate growth metrics (comparing with previous period)
    const previousPeriodEnd = new Date(startDate);
    const previousPeriodStart = new Date(startDate);
    const periodDuration = endDate.getTime() - startDate.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);

    const [previousRevenue, previousUsers] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]),
      User.countDocuments({
        createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
      })
    ]);

    const prevRevenue = previousRevenue[0]?.total || 1;
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;
    const userGrowth = previousUsers > 0 ? ((totalUsers - previousUsers) / previousUsers * 100).toFixed(1) : 0;

    // Calculate overall utilization
    const totalPossibleHours = fieldUtilization.reduce((sum, field) => sum + (30 * 16), 0); // 30 days * 16 hours per field
    const totalBookedHours = fieldUtilization.reduce((sum, field) => sum + field.totalHours, 0);
    const overallUtilization = totalPossibleHours > 0 ? (totalBookedHours / totalPossibleHours * 100).toFixed(1) : 0;

    const analyticsData = {
      revenue: {
        total: totalRevenue,
        growth: parseFloat(revenueGrowth.toString()),
        monthly: monthlyData
      },
      bookings: {
        total: totalBookings,
        byStatus: statusData,
        byDay: dailyData
      },
      utilization: {
        overall: parseFloat(overallUtilization.toString()),
        byField: fieldUtilization.map(field => ({
          fieldName: field.fieldName,
          utilization: parseFloat(field.utilization.toFixed(1)),
          revenue: field.totalRevenue
        })),
        byTimeSlot: timeSlots
      },
      users: {
        total: totalUsers,
        new: totalUsers,
        growth: parseFloat(userGrowth.toString())
      }
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error fetching analytics:', error);

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
