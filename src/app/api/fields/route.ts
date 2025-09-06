import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Field } from '@/lib/models';
import { fieldSearchSchema, createFieldSchema } from '@/lib/validations';
import { requireAuth, requireAdmin } from '@/lib/auth';

// GET /api/fields - List fields with search and filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries());

    // Convert string numbers to actual numbers
    if (queryParams.page) (queryParams as any).page = parseInt(queryParams.page);
    if (queryParams.limit) (queryParams as any).limit = parseInt(queryParams.limit);
    if (queryParams.minPrice) (queryParams as any).minPrice = parseFloat(queryParams.minPrice);
    if (queryParams.maxPrice) (queryParams as any).maxPrice = parseFloat(queryParams.maxPrice);
    if (queryParams.latitude) (queryParams as any).latitude = parseFloat(queryParams.latitude);
    if (queryParams.longitude) (queryParams as any).longitude = parseFloat(queryParams.longitude);
    if (queryParams.radius) (queryParams as any).radius = parseFloat(queryParams.radius);

    const params = fieldSearchSchema.parse(queryParams);

    // Build MongoDB query
    const query: any = { isActive: true };

    // Text search
    if (params.query) {
      query.$or = [
        { name: { $regex: params.query, $options: 'i' } },
        { description: { $regex: params.query, $options: 'i' } },
        { 'location.address': { $regex: params.query, $options: 'i' } },
      ];
    }

    // Filters
    if (params.city) {
      query['location.city'] = { $regex: params.city, $options: 'i' };
    }

    if (params.fieldType) {
      query.fieldType = params.fieldType;
    }

    if (params.surface) {
      query.surface = params.surface;
    }

    if (params.minPrice || params.maxPrice) {
      query.pricePerHour = {};
      if (params.minPrice) query.pricePerHour.$gte = params.minPrice;
      if (params.maxPrice) query.pricePerHour.$lte = params.maxPrice;
    }

    if (params.amenities && params.amenities.length > 0) {
      query.amenities = { $in: params.amenities };
    }

    // Geospatial search
    if (params.latitude && params.longitude) {
      const radius = params.radius || 10; // Default 10km radius
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [params.longitude, params.latitude]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Availability filter (if date and time provided)
    if (params.date && params.startTime && params.endTime) {
      // This would require more complex aggregation to check actual availability
      // For now, we'll just filter by basic availability schedule
      const dayOfWeek = new Date(params.date).getDay();
      query['availability'] = {
        $elemMatch: {
          dayOfWeek: dayOfWeek,
          isAvailable: true,
          startTime: { $lte: params.startTime },
          endTime: { $gte: params.endTime }
        }
      };
    }

    // Pagination
    const skip = (params.page - 1) * params.limit;

    // Execute query
    const [fields, total] = await Promise.all([
      Field.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(params.limit)
        .lean(),
      Field.countDocuments(query)
    ]);

    return NextResponse.json({
      fields,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit)
      }
    });

  } catch (error) {
    console.error('Error fetching fields:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/fields - Create new field (admin only)
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAdmin();
    await dbConnect();

    const body = await request.json();
    const fieldData = createFieldSchema.parse(body);

    const field = new Field({
      ...fieldData,
      ownerId: userId,
      isActive: true
    });

    await field.save();

    return NextResponse.json(field, { status: 201 });

  } catch (error) {
    console.error('Error creating field:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid field data', details: error },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
