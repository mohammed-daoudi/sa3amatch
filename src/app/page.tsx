import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Shield, Star, Users, Calendar } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">Sa3aMatch</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/fields" className="text-gray-700 hover:text-green-600">
                Find Fields
              </Link>
              <Link href="/sign-in" className="text-gray-700 hover:text-green-600">
                Sign In
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Book Football Fields in Khouribga
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Discover, book, and play on the best football fields in the city.
              Simple, fast, and reliable field booking platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/fields">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  <MapPin className="mr-2 h-5 w-5" />
                  Find Fields Near You
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white hover:text-green-600">
                  Start Booking
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Sa3aMatch?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to book and manage your football field reservations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Real-time Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Check field availability in real-time and book instantly.
                  No more phone calls or waiting for confirmations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Multiple payment options including cash, bank transfer, and online payments.
                  Your transactions are always secure.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Star className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Quality Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All fields are verified and rated by the community.
                  Find the perfect field for your game.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Join a community of football enthusiasts.
                  Rate fields, share experiences, and discover new venues.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Easy Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Intuitive booking interface makes scheduling your games simple.
                  Manage all your bookings in one place.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Location-based Search</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Find fields near you with our smart location search.
                  Filter by distance, price, and amenities.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Play?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of players who trust Sa3aMatch for their field bookings
          </p>
          <Link href="/sign-up">
            <Button size="lg" variant="secondary">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Sa3aMatch</h3>
              <p className="text-gray-400">
                The best platform for booking football fields in Khouribga.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/fields" className="hover:text-white">Find Fields</Link></li>
                <li><Link href="/sign-up" className="hover:text-white">Sign Up</Link></li>
                <li><Link href="/sign-in" className="hover:text-white">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">
                Khouribga, Morocco<br />
                Email: info@sa3amatch.com
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Sa3aMatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
