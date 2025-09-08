import { NextRequest, NextResponse } from 'next/server';
import { Field } from '@/lib/models/Field';
import connectToMongoDB from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();

    const fieldId = params.id;

    // Find field by ID
    const field = await Field.findById(fieldId).lean() as any;

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Return field details
    return NextResponse.json({
      success: true,
      field: {
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
        rating: field.rating,
        status: field.status,
        createdAt: field.createdAt,
        updatedAt: field.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching field details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();

    const fieldId = params.id;
    const updates = await req.json();

    // Find and update field
    const field = await Field.findByIdAndUpdate(
      fieldId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      field: {
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
        rating: field.rating,
        status: field.status,
        createdAt: field.createdAt,
        updatedAt: field.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating field:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();

    const fieldId = params.id;

    // Find and delete field
    const field = await Field.findByIdAndDelete(fieldId);

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Field deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting field:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
