import { NextRequest, NextResponse } from 'next/server';
import { Field } from '@/lib/models/Field';
import connectToMongoDB from '@/lib/db';
import { z } from 'zod';

const fieldsQuerySchema = z.object({
  search: z.string().optional(),
  surface: z.enum(['grass', 'artificial', 'concrete']).optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  lighting: z.string().transform(val => val === 'true').optional(),
  minPrice: z.string().transform(val => val ? Number(val) : undefined).optional(),
  maxPrice: z.string().transform(val => val ? Number(val) : undefined).optional(),
  sortBy: z.enum(['rating', 'price-low', 'price-high', 'name']).default('rating'),
  page: z.string().optional().default('1').transform(val => val ? Number(val) : 1),
  limit: z.string().optional().default('10').transform(val => val ? Number(val) : 10),
  lat: z.string().transform(val => val ? Number(val) : undefined).optional(),
  lng: z.string().transform(val => val ? Number(val) : undefined).optional(),
  radius: z.string().optional().default('10').transform(val => val ? Number(val) : 10), // km
});

export async function GET(req: NextRequest) {
  try {
    await connectToMongoDB();

    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const {
      search,
      surface,
      size,
      lighting,
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit,
      lat,
      lng,
      radius
    } = fieldsQuerySchema.parse(queryParams);

    // Build query
    const query: Record<string, any> = { status: 'active' };

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (surface) query.surface = surface;
    if (size) query.size = size;
    if (lighting !== undefined) query.lighting = lighting;

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerHour = {};
      if (minPrice !== undefined) query.pricePerHour.$gte = minPrice;
      if (maxPrice !== undefined) query.pricePerHour.$lte = maxPrice;
    }

    // Geolocation search
    if (lat !== undefined && lng !== undefined) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Build sort criteria
    let sortCriteria: Record<string, any> = {};
    switch (sortBy) {
      case 'price-low':
        sortCriteria = { pricePerHour: 1 };
        break;
      case 'price-high':
        sortCriteria = { pricePerHour: -1 };
        break;
      case 'rating':
        sortCriteria = { 'rating.average': -1, 'rating.count': -1 };
        break;
      case 'name':
        sortCriteria = { name: 1 };
        break;
      default:
        sortCriteria = { 'rating.average': -1 };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [fields, totalCount] = await Promise.all([
      Field.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
      Field.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      fields: fields.map(field => ({
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
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 });
    }

    console.error('Error fetching fields:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToMongoDB();

    const body = await req.json();

    // Basic validation - in a real app, you'd want more comprehensive validation
    const field = new Field(body);
    await field.save();

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
        status: field.status
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating field:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
