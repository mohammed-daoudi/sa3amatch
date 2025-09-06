import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Calendar, Heart, Home, MapPin } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">Sa3aMatch</h1>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/fields" className="text-gray-700 hover:text-green-600">
                Find Fields
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-green-600">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard</h2>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/dashboard"
                    className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <Home className="w-5 h-5 mr-3" />
                    Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/bookings"
                    className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <Calendar className="w-5 h-5 mr-3" />
                    My Bookings
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/favorites"
                    className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <Heart className="w-5 h-5 mr-3" />
                    Favorite Fields
                  </Link>
                </li>
                <li>
                  <Link
                    href="/fields"
                    className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <MapPin className="w-5 h-5 mr-3" />
                    Browse Fields
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
