'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  XCircle,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Field {
  _id: string;
  name: string;
  location: { address: string };
  photos: string[];
}

interface Booking {
  id: string;
  field: Field;
  timeSlot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  amount: {
    total: number;
    deposit?: number;
    remaining?: number;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'completed';
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  // Load bookings
  const loadBookings = async (page = 1, status = '', search = '') => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (status) params.append('status', status);

      const response = await fetch(`/api/bookings?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load bookings');
      }

      const data = await response.json();

      let filteredBookings = data.bookings || [];

      // Apply time filter
      if (timeFilter !== 'all') {
        const now = new Date();
        filteredBookings = filteredBookings.filter((booking: Booking) => {
          const bookingDate = new Date(booking.timeSlot.date);
          if (timeFilter === 'upcoming') {
            return bookingDate >= now;
          } else {
            return bookingDate < now;
          }
        });
      }

      // Apply search filter (client-side for now)
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filteredBookings = filteredBookings.filter((booking: Booking) =>
          booking.field.name.toLowerCase().includes(searchLower) ||
          booking.field.location.address.toLowerCase().includes(searchLower)
        );
      }

      setBookings(filteredBookings);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load bookings on component mount and filter changes
  useEffect(() => {
    loadBookings(currentPage, statusFilter, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, timeFilter]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadBookings(1, statusFilter, searchTerm);
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Refresh bookings
      loadBookings(currentPage, statusFilter, searchTerm);
    } catch (error) {
      console.error('Error canceling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  // Status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled':
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Format date and time
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isUpcoming = (booking: Booking) => {
    const bookingDateTime = new Date(`${booking.timeSlot.date}T${booking.timeSlot.startTime}`);
    return bookingDateTime > new Date();
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="h-20 w-20 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">
            {pagination ? `${pagination.totalCount} total bookings` : 'Loading...'}
          </p>
        </div>
        <Button asChild>
          <Link href="/fields">
            Book New Field
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by field name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'all' | 'upcoming' | 'past')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>

            {/* Search Button */}
            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Bookings</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => loadBookings(currentPage, statusFilter, searchTerm)} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Field Image */}
                  <div className="relative">
                    <Image
                      src={booking.field.photos[0] || '/placeholder-field.jpg'}
                      alt={booking.field.name}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    {isUpcoming(booking) && booking.status === 'confirmed' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {booking.field.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="mr-1 h-3 w-3" />
                          {booking.field.location.address}
                        </div>
                      </div>
                      <Badge className={`ml-2 ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status}</span>
                      </Badge>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{formatDate(booking.timeSlot.date)}</div>
                          <div className="text-gray-600">
                            {formatTime(booking.timeSlot.startTime)} - {formatTime(booking.timeSlot.endTime)}
                          </div>
                        </div>
                      </div>

                      {/* Payment */}
                      <div className="flex items-center text-sm">
                        <DollarSign className="mr-2 h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">${booking.amount.total}</div>
                          <div className="text-gray-600 capitalize">
                            {booking.paymentMethod.replace('_', ' ')}
                          </div>
                        </div>
                      </div>

                      {/* Booking Date */}
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">Booked</div>
                          <div className="text-gray-600">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/bookings/${booking.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>

                    {/* Show cancel button for pending/confirmed bookings that are upcoming */}
                    {(booking.status === 'pending' || booking.status === 'confirmed') &&
                     isUpcoming(booking) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !loading && (
        /* Empty State */
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {statusFilter || timeFilter !== 'all' || searchTerm
                ? 'No bookings match your current filters. Try adjusting your search criteria.'
                : 'You haven\'t made any bookings yet. Start by exploring our available fields and make your first booking!'
              }
            </p>
            <div className="flex justify-center space-x-3">
              <Button asChild>
                <Link href="/fields">
                  Browse Fields
                </Link>
              </Button>
              {(statusFilter || timeFilter !== 'all' || searchTerm) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('');
                    setTimeFilter('all');
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} bookings
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page =>
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.page) <= 2
                    )
                    .map((page, index, arr) => (
                      <div key={page}>
                        {index > 0 && arr[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={page === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
