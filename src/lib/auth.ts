import { auth, clerkClient } from '@clerk/nextjs/server';
import { User } from '@/lib/models/User';
import connectToMongoDB from '@/lib/db';

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    await connectToMongoDB();

    // Check if user exists in our database
    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      // Get user data from Clerk
      const clerkUser = await (await clerkClient()).users.getUser(userId);

      // Create user in our database
      user = new User({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        role: 'user', // Default role
        favorites: []
      });

      await user.save();
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin' || false;
}

export async function updateUserRole(clerkId: string, role: 'user' | 'admin') {
  try {
    await connectToMongoDB();

    const user = await User.findOneAndUpdate(
      { clerkId },
      { role },
      { new: true }
    );

    return user;
  } catch (error) {
    console.error('Error updating user role:', error);
    return null;
  }
}
