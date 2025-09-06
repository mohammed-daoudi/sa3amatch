import { auth } from '@clerk/nextjs/server';
import { User } from './models/User';
import dbConnect from './db';

export async function getCurrentUser() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    await dbConnect();
    const user = await User.findOne({ clerkId: userId });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
}

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const role = (sessionClaims as any)?.metadata?.role || (sessionClaims as any)?.publicMetadata?.role;

  if (role !== 'admin') {
    throw new Error('Admin access required');
  }

  return userId;
}

export async function createOrUpdateUser(clerkUser: any) {
  try {
    await dbConnect();

    const existingUser = await User.findOne({ clerkId: clerkUser.id });

    if (existingUser) {
      // Update existing user
      existingUser.email = clerkUser.emailAddresses[0]?.emailAddress;
      existingUser.firstName = clerkUser.firstName;
      existingUser.lastName = clerkUser.lastName;
      existingUser.phoneNumber = clerkUser.phoneNumbers[0]?.phoneNumber;

      await existingUser.save();
      return existingUser;
    } else {
      // Create new user
      const newUser = new User({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber,
        role: 'user',
        favorites: [],
      });

      await newUser.save();
      return newUser;
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}
