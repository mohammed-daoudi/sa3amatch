import { auth } from '@clerk/nextjs/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Heart, TrendingUp, Star } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const { userId } = await auth();

  // TODO: Fetch user data, recent bookings, favorite fields
  const stats = {
    totalBookings: 12,
    upcomingBookings: 3,
    favoriteFields: 5,
    totalSpent: 480,
  };

  const upcomingBookings = [
    {
      id: '1',
      fieldName: 'Green Valley Football Field',
      date: '2024-09-08',
      time: '14:00 - 16:00',
      status: 'approved',
      amount: 80,
    },
    {
      id: '2',
      fieldName: 'Stadium Municipal',
      date: '2024-09-10',
      time: '18:00 - 20:00',
      status: 'pending',
      amount: 100,
    },
  ];

  const favoriteFields = [
    {
      id: '1',
      name: 'Green Valley Football Field',
      location: 'Khouribga Center',
      rating: 4.8,
      pricePerHour: 40,
    },
    {
      id: '2',
      name: 'Stadium Municipal',
      location: 'Hay Mohammadi',
      rating: 4.5,
      pricePerHour: 50,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your bookings.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
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
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Next: Tomorrow 2:00 PM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Fields</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favoriteFields}</div>
            <p className="text-xs text-muted-foreground">
              Saved for quick booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent}</div>
            <p className="text-xs text-muted-foreground">
              This year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with these popular actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-auto flex-col space-y-2 py-4">
              <Link href="/fields">
                <MapPin className="h-6 w-6" />
                <span>Browse Fields</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col space-y-2 py-4">
              <Link href="/bookings">
                <Calendar className="h-6 w-6" />
                <span>View Bookings</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col space-y-2 py-4">
              <Link href="/favorites">
                <Heart className="h-6 w-6" />
                <span>My Favorites</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Your next scheduled matches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{booking.fieldName}</h4>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <span>{booking.date}</span>
                    <span>{booking.time}</span>
                  </div>
                  <Badge variant={booking.status === 'approved' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-medium">${booking.amount}</p>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/bookings/${booking.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" asChild className="w-full">
              <Link href="/bookings">View All Bookings</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Favorite Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Favorite Fields</CardTitle>
            <CardDescription>Your saved fields for quick booking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {favoriteFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{field.name}</h4>
                  <div className="flex items-center text-sm text-gray-600 space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span>{field.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 ml-1">{field.rating}</span>
                    </div>
                    <span className="text-sm text-gray-600">${field.pricePerHour}/hour</span>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/fields/${field.id}`}>Book Now</Link>
                </Button>
              </div>
            ))}
            <Button variant="outline" asChild className="w-full">
              <Link href="/favorites">View All Favorites</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
