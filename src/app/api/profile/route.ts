import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/lib/models/User';
import connectToMongoDB from '@/lib/db';
import { z } from 'zod';

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  profilePicture: z.string().optional(),
});

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToMongoDB();

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      phone: user.phone,
      profilePicture: user.profilePicture,
      role: user.role,
      favorites: user.favorites,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateProfileSchema.parse(body);

    await connectToMongoDB();

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        ...validatedData,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      user: {
        phone: user.phone,
        profilePicture: user.profilePicture,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
    }

    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
