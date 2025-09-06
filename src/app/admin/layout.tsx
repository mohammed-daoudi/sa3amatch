import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Users,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user has admin role from Clerk metadata
  const role = (sessionClaims as any)?.metadata?.role || (sessionClaims as any)?.publicMetadata?.role;

  if (role !== 'admin') {
    redirect('/dashboard');
  }

  const navigationItems = [
    {
      name: 'Overview',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Fields',
      href: '/admin/fields',
      icon: MapPin,
    },
    {
      name: 'Bookings',
      href: '/admin/bookings',
      icon: Calendar,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center">
                <h1 className="text-2xl font-bold text-red-600">Sa3aMatch</h1>
                <span className="ml-2 text-sm font-medium text-gray-600 bg-red-100 px-2 py-1 rounded">
                  Admin
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  User Dashboard
                </Button>
              </Link>
              <Link href="/sign-out">
                <Button variant="ghost" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen border-r">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Admin Info Card */}
          <Card className="m-4 p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Settings className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Admin Panel</h3>
              <p className="text-sm text-gray-600">
                Manage fields, bookings, and users
              </p>
            </div>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
