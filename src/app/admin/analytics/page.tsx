"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  MapPin,
  BarChart3,
  PieChart,
  Download,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import Link from "next/link";

// Types
interface AnalyticsData {
  revenue: {
    total: number;
    monthly: Array<{ month: string; revenue: number; bookings: number }>;
    growth: number;
  };
  bookings: {
    total: number;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    byDay: Array<{ day: string; count: number }>;
  };
  utilization: {
    overall: number;
    byField: Array<{ fieldName: string; utilization: number; revenue: number }>;
    byTimeSlot: Array<{ timeSlot: string; bookings: number }>;
  };
  users: {
    total: number;
    new: number;
    growth: number;
  };
}

// Mock data - will be replaced with real API calls
const mockAnalyticsData: AnalyticsData = {
  revenue: {
    total: 28500,
    growth: 15.2,
    monthly: [
      { month: 'Aug', revenue: 12000, bookings: 45 },
      { month: 'Sep', revenue: 15500, bookings: 62 },
      { month: 'Oct', revenue: 18200, bookings: 78 },
      { month: 'Nov', revenue: 22100, bookings: 89 },
      { month: 'Dec', revenue: 28500, bookings: 102 },
      { month: 'Jan', revenue: 32800, bookings: 118 }
    ]
  },
  bookings: {
    total: 145,
    byStatus: [
      { status: 'approved', count: 98, percentage: 67.6 },
      { status: 'pending', count: 23, percentage: 15.9 },
      { status: 'rejected', count: 15, percentage: 10.3 },
      { status: 'canceled', count: 9, percentage: 6.2 }
    ],
    byDay: [
      { day: 'Mon', count: 15 },
      { day: 'Tue', count: 18 },
      { day: 'Wed', count: 22 },
      { day: 'Thu', count: 25 },
      { day: 'Fri', count: 28 },
      { day: 'Sat', count: 35 },
      { day: 'Sun', count: 32 }
    ]
  },
  utilization: {
    overall: 68.5,
    byField: [
      { fieldName: 'Stade Municipal', utilization: 85.2, revenue: 8500 },
      { fieldName: 'Complex Al Amal', utilization: 72.8, revenue: 6200 },
      { fieldName: 'Terrain Hay Mohammadi', utilization: 65.1, revenue: 4800 },
      { fieldName: 'Stade Al Massira', utilization: 58.3, revenue: 3900 },
      { fieldName: 'Complex Sportif Centre', utilization: 45.7, revenue: 2800 }
    ],
    byTimeSlot: [
      { timeSlot: '08:00', bookings: 5 },
      { timeSlot: '10:00', bookings: 8 },
      { timeSlot: '12:00', bookings: 12 },
      { timeSlot: '14:00', bookings: 18 },
      { timeSlot: '16:00', bookings: 25 },
      { timeSlot: '18:00', bookings: 32 },
      { timeSlot: '20:00', bookings: 28 },
      { timeSlot: '22:00', bookings: 15 }
    ]
  },
  users: {
    total: 89,
    new: 12,
    growth: 15.2
  }
};

const COLORS = {
  approved: '#10B981',
  pending: '#F59E0B',
  rejected: '#EF4444',
  canceled: '#6B7280',
  primary: '#DC2626',
  secondary: '#1D4ED8'
};

const PIE_COLORS = [COLORS.approved, COLORS.pending, COLORS.rejected, COLORS.canceled];

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(mockAnalyticsData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/analytics?timeRange=${timeRange}`);

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={handleRefresh} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Revenue insights and business performance metrics
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.revenue.total.toLocaleString()} MAD</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{analyticsData.revenue.growth}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.bookings.total}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              {analyticsData.bookings.byStatus.find(s => s.status === 'approved')?.count} approved
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.utilization.overall}%</div>
            <div className="flex items-center text-xs text-blue-600">
              <Clock className="w-3 h-3 mr-1" />
              Across all fields
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.users.total}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{analyticsData.users.new} new this period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue and booking volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.revenue.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `${value} MAD` : value,
                    name === 'revenue' ? 'Revenue' : 'Bookings'
                  ]} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke={COLORS.secondary}
                    fill={COLORS.secondary}
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
            <CardDescription>Current booking status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={analyticsData.bookings.byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {analyticsData.bookings.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [
                    `${value} (${props.payload.percentage}%)`,
                    props.payload.status
                  ]} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {analyticsData.bookings.byStatus.map((status, index) => (
                <div key={status.status} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index] }}
                  />
                  <span className="text-sm">{status.status} ({status.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Booking Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Booking Pattern</CardTitle>
            <CardDescription>Bookings by day of the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.bookings.byDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Popular Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Time Slots</CardTitle>
            <CardDescription>Booking distribution by time of day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.utilization.byTimeSlot}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeSlot" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke={COLORS.secondary}
                    strokeWidth={3}
                    dot={{ fill: COLORS.secondary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Field Performance</CardTitle>
          <CardDescription>Utilization and revenue by field</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Field Name</th>
                  <th className="text-left p-4 font-medium">Utilization</th>
                  <th className="text-left p-4 font-medium">Revenue</th>
                  <th className="text-left p-4 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.utilization.byField.map((field, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">{field.fieldName}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${field.utilization}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{field.utilization}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{field.revenue.toLocaleString()} MAD</div>
                    </td>
                    <td className="p-4">
                      <Badge className={
                        field.utilization >= 80 ? 'bg-green-100 text-green-800' :
                        field.utilization >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {field.utilization >= 80 ? 'Excellent' :
                         field.utilization >= 60 ? 'Good' : 'Needs Attention'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
          <CardDescription>Data-driven suggestions to improve performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Peak Performance</div>
                  <div className="text-sm text-green-700">
                    Saturday and Friday show highest booking rates. Consider dynamic pricing.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-800">Underutilized Hours</div>
                  <div className="text-sm text-yellow-700">
                    Morning slots (8AM-12PM) have low utilization. Offer promotions.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">Field Optimization</div>
                  <div className="text-sm text-blue-700">
                    Stade Municipal consistently outperforms. Analyze success factors.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-800">Review Required</div>
                  <div className="text-sm text-red-700">
                    {analyticsData.bookings.byStatus.find(s => s.status === 'pending')?.count} bookings await approval.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
