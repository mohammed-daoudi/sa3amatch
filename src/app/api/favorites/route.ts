import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { Field } from '@/lib/models/Field';

// GET /api/favorites - Get user's favorite fields
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ clerkId: userId })
      .populate('favorites');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ favorites: user.favorites || [] });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a field to favorites
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fieldId } = await request.json();

    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if field exists
    const field = await Field.findById(fieldId);
    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Find user and add field to favorites if not already added
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.favorites.includes(fieldId)) {
      user.favorites.push(fieldId);
      await user.save();
    }

    return NextResponse.json({ message: 'Field added to favorites', isFavorited: true });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove a field from favorites
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');

    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Find user and remove field from favorites
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.favorites = user.favorites.filter((fav: any) => fav.toString() !== fieldId);
    await user.save();

    return NextResponse.json({ message: 'Field removed from favorites', isFavorited: false });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
