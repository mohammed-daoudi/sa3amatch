"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  Download,
  AlertCircle,
  FileText,
  CreditCard,
  Loader2
} from "lucide-react";
import Link from "next/link";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentMethodColor = (method: string) => {
  switch (method) {
    case 'cash': return 'bg-blue-100 text-blue-800';
    case 'bank_transfer': return 'bg-purple-100 text-purple-800';
    case 'stripe': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'paid': return 'bg-green-100 text-green-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'refunded': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams({
          admin: 'true',
          limit: '50'
        });

        if (selectedStatus) params.append('status', selectedStatus);
        if (selectedPaymentMethod) params.append('paymentMethod', selectedPaymentMethod);
        if (selectedDate) params.append('startDate', selectedDate);

        const response = await fetch(`/api/bookings?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();
        setBookings(data.bookings || []);

        // Calculate stats
        const bookingsArray = data.bookings || [];
        setStats({
          total: bookingsArray.length,
          pending: bookingsArray.filter((b: any) => b.status === 'pending').length,
          approved: bookingsArray.filter((b: any) => b.status === 'approved').length,
          rejected: bookingsArray.filter((b: any) => b.status === 'rejected').length,
          totalRevenue: bookingsArray
            .filter((b: any) => b.status === 'approved')
            .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
        });
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [selectedStatus, selectedPaymentMethod, selectedDate, refreshTrigger]);

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject', adminNotes?: string) => {
    setIsProcessing(bookingId);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          adminNotes: adminNotes || `Booking ${action}d by admin`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} booking`);
      }

      // Refresh bookings list
      setRefreshTrigger(prev => prev + 1);

      // Show success message (you could use a toast component here)
      alert(`Booking ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${action} booking. Please try again.`);
    } finally {
      setIsProcessing(null);
    }
  };

  // Filter bookings based on search term
  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const userDetails = booking.userDetails || {};

    return (
      booking._id?.toLowerCase().includes(searchLower) ||
      booking.fieldId?.name?.toLowerCase().includes(searchLower) ||
      userDetails.firstName?.toLowerCase().includes(searchLower) ||
      userDetails.lastName?.toLowerCase().includes(searchLower) ||
      userDetails.email?.toLowerCase().includes(searchLower)
    );
  });

  const pendingBookings = bookings.filter(b => b.status === 'pending');

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
        <Button
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Moderation</h1>
          <p className="text-gray-600 mt-2">
            Review and manage booking requests
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Actions Alert */}
      {pendingBookings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {pendingBookings.length} booking{pendingBookings.length > 1 ? 's' : ''} require immediate attention
                </p>
                <p className="text-sm text-yellow-700">
                  Review pending bookings to avoid customer delays
                </p>
              </div>
              <Button
                size="sm"
                className="ml-auto"
                variant="outline"
                onClick={() => setSelectedStatus('pending')}
              >
                Review Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user name, field, or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="canceled">Canceled</option>
              </select>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Payments</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="stripe">Stripe</option>
              </select>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            Manage and moderate booking requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bookings found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Booking Details</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Schedule</th>
                    <th className="text-left p-4 font-medium">Payment</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-medium">{booking.fieldId?.name || 'Unknown Field'}</div>
                          <div className="text-sm text-gray-600 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            ID: {booking._id}
                          </div>
                          {booking.notes && (
                            <div className="text-sm text-gray-600 flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {booking.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {booking.userDetails?.firstName} {booking.userDetails?.lastName}
                          </div>
                          <div className="text-sm text-gray-600">{booking.userDetails?.email}</div>
                          <div className="text-sm text-gray-500">
                            Booked: {new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-medium">{new Date(booking.date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {booking.startTime} - {booking.endTime}
                          </div>
                          <div className="text-sm text-gray-600">
                            Duration: {booking.duration}h
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="font-medium">{booking.totalPrice} MAD</div>
                          <div className="flex flex-col space-y-1">
                            <Badge className={getPaymentMethodColor(booking.paymentMethod)}>
                              {booking.paymentMethod?.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                              {booking.paymentStatus}
                            </Badge>
                          </div>
                          {booking.paymentProof && (
                            <Button variant="ghost" size="sm" className="p-0 h-auto">
                              <Eye className="w-3 h-3 mr-1" />
                              View Proof
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        {booking.adminNotes && (
                          <div className="text-xs text-gray-500 mt-1">
                            Admin notes available
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          {booking.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleBookingAction(booking._id, 'approve')}
                                disabled={isProcessing === booking._id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {isProcessing === booking._id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBookingAction(booking._id, 'reject', 'Needs review')}
                                disabled={isProcessing === booking._id}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                {isProcessing === booking._id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                              </Button>
                            </>
                          ) : (
                            <Link href={`/admin/bookings/${booking._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-3 h-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
