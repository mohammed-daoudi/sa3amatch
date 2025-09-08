import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/lib/models/User';
import { Field } from '@/lib/models/Field';
import connectToMongoDB from '@/lib/db';
import { z } from 'zod';

const favoriteSchema = z.object({
  fieldId: z.string(),
});

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToMongoDB();

    const user = await User.findOne({ clerkId: userId }).populate({
      path: 'favorites',
      match: { status: 'active' },
      select: 'name description location pricePerHour photos amenities lighting size surface rating'
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      favorites: user.favorites.map((field: any) => ({
        id: field._id,
        name: field.name,
        description: field.description,
        location: field.location,
        pricePerHour: field.pricePerHour,
        photos: field.photos,
        amenities: field.amenities,
        lighting: field.lighting,
        size: field.size,
        surface: field.surface,
        rating: field.rating
      }))
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fieldId } = favoriteSchema.parse(body);

    await connectToMongoDB();

    // Check if field exists
    const field = await Field.findById(fieldId);
    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Add to favorites if not already added
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $addToSet: { favorites: fieldId } },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Field added to favorites',
      favoritesCount: user.favorites.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
    }

    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fieldId = searchParams.get('fieldId');

    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID required' }, { status: 400 });
    }

    await connectToMongoDB();

    // Remove from favorites
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $pull: { favorites: fieldId } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Field removed from favorites',
      favoritesCount: user.favorites.length
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
