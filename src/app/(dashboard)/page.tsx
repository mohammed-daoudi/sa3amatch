import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Star, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

// Mock data - will be replaced with real API calls
const mockStats = {
  totalBookings: 12,
  upcomingBookings: 3,
  favoriteFields: 5,
  totalSpent: 2400
};

const mockUpcomingBookings = [
  {
    id: "1",
    fieldName: "Stade Municipal",
    date: "2024-09-08",
    startTime: "14:00",
    endTime: "16:00",
    status: "approved",
    totalPrice: 400
  },
  {
    id: "2",
    fieldName: "Complex Sportif Al Amal",
    date: "2024-09-10",
    startTime: "18:00",
    endTime: "20:00",
    status: "pending",
    totalPrice: 300
  },
  {
    id: "3",
    fieldName: "Terrain Hay Mohammadi",
    date: "2024-09-12",
    startTime: "16:00",
    endTime: "17:30",
    status: "approved",
    totalPrice: 120
  }
];

const mockRecentActivity = [
  {
    id: "1",
    type: "booking_confirmed",
    description: "Booking at Stade Municipal confirmed",
    timestamp: "2 hours ago"
  },
  {
    id: "2",
    type: "field_favorited",
    description: "Added Complex Sportif Al Amal to favorites",
    timestamp: "1 day ago"
  },
  {
    id: "3",
    type: "booking_completed",
    description: "Completed booking at Terrain Hay Mohammadi",
    timestamp: "3 days ago"
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Next booking in 2 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Fields</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.favoriteFields}</div>
            <p className="text-xs text-muted-foreground">
              Ready to book
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalSpent} MAD</div>
            <p className="text-xs text-muted-foreground">
              +180 MAD from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>
              Your next scheduled field reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUpcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{booking.fieldName}</h4>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(booking.date).toLocaleDateString()}
                      <Clock className="w-4 h-4 mr-1 ml-3" />
                      {booking.startTime} - {booking.endTime}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant={booking.status === 'approved' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                      <span className="font-medium text-green-600">
                        {booking.totalPrice} MAD
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/dashboard/bookings">
                <Button variant="outline" className="w-full">
                  View All Bookings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get things done faster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/fields">
              <Button className="w-full h-20 flex flex-col items-center justify-center">
                <MapPin className="w-6 h-6 mb-2" />
                Find New Fields
              </Button>
            </Link>
            <Link href="/dashboard/bookings">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <Calendar className="w-6 h-6 mb-2" />
                Manage Bookings
              </Button>
            </Link>
            <Link href="/dashboard/favorites">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <Star className="w-6 h-6 mb-2" />
                View Favorites
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
