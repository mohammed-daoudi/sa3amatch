"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  Loader2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface OverviewStats {
  totalFields: number;
  totalBookings: number;
  totalUsers: number;
  totalRevenue: number;
  pendingBookings: number;
  activeFields: number;
  monthlyGrowth: number;
  averageBookingValue: number;
  recentBookings: Array<{
    id: string;
    fieldName: string;
    userName: string;
    date: string;
    time: string;
    status: string;
    amount: number;
  }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch overview stats
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/overview');

        if (!response.ok) {
          throw new Error('Failed to fetch overview data');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching overview stats:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleRefresh = () => {
    setStats(null);
    setIsLoading(true);
    // Trigger useEffect by changing a dependency or call fetchStats directly
    setTimeout(() => {
      window.location.reload();
    }, 100);
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
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
        <p className="text-gray-600">No data available</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of your football field booking platform
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/admin/fields/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFields}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeFields} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingBookings} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">
              Avg. {stats.averageBookingValue} MAD/booking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/bookings?status=pending">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-3 text-yellow-600" />
                  <div>
                    <div className="font-medium">Review Pending Bookings</div>
                    <div className="text-sm text-gray-600">{stats.pendingBookings} bookings waiting</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/fields">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-green-600" />
                  <div>
                    <div className="font-medium">Manage Fields</div>
                    <div className="text-sm text-gray-600">Add, edit, or deactivate fields</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-3 text-blue-600" />
                  <div>
                    <div className="font-medium">View Analytics</div>
                    <div className="text-sm text-gray-600">Revenue and usage insights</div>
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>
              Latest booking requests requiring attention
            </CardDescription>
          </div>
          <Link href="/admin/bookings">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-medium">{booking.fieldName}</div>
                    <div className="text-sm text-gray-600">
                      {booking.userName} • {booking.date} • {booking.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-medium">{booking.amount} MAD</div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  {booking.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
