import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';

// GET /api/favorites/[fieldId] - Check if field is favorited by user
export async function GET(
  request: NextRequest,
  { params }: { params: { fieldId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fieldId } = params;

    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isFavorited = user.favorites.some((fav: any) => fav.toString() === fieldId);

    return NextResponse.json({ isFavorited });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
