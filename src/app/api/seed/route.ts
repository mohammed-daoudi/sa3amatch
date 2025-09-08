import { NextResponse } from 'next/server';
import { Field } from '@/lib/models/Field';
import connectToMongoDB from '@/lib/db';

const sampleFields = [
  {
    name: 'Green Valley Football Field',
    description: 'Professional grass field with excellent lighting and facilities. Perfect for competitive matches and training sessions.',
    location: {
      address: 'Khouribga Center, Morocco',
      coordinates: {
        lat: 32.8811,
        lng: -6.9063
      }
    },
    pricePerHour: 40,
    photos: ['/api/placeholder/400/300'],
    amenities: ['Parking', 'Changing Rooms', 'Lighting', 'Showers', 'Security'],
    lighting: true,
    size: 'large',
    surface: 'grass',
    rating: {
      average: 4.8,
      count: 24
    },
    ownerId: 'owner-1',
    status: 'active'
  },
  {
    name: 'Stadium Municipal',
    description: 'Municipal stadium with artificial turf and modern facilities. Great for tournaments and large events.',
    location: {
      address: 'Hay Mohammadi, Khouribga',
      coordinates: {
        lat: 32.8711,
        lng: -6.9163
      }
    },
    pricePerHour: 50,
    photos: ['/api/placeholder/400/300'],
    amenities: ['Parking', 'Changing Rooms', 'Lighting', 'Cafeteria', 'Medical Room'],
    lighting: true,
    size: 'large',
    surface: 'artificial',
    rating: {
      average: 4.5,
      count: 18
    },
    ownerId: 'owner-2',
    status: 'active'
  },
  {
    name: 'City Sports Complex',
    description: 'Multiple fields available with competitive pricing. Family-friendly environment with good facilities.',
    location: {
      address: 'Hay Salam, Khouribga',
      coordinates: {
        lat: 32.8611,
        lng: -6.8963
      }
    },
    pricePerHour: 35,
    photos: ['/api/placeholder/400/300'],
    amenities: ['Parking', 'Changing Rooms', 'Snack Bar'],
    lighting: false,
    size: 'medium',
    surface: 'artificial',
    rating: {
      average: 4.2,
      count: 12
    },
    ownerId: 'owner-3',
    status: 'active'
  },
  {
    name: 'Al Widad Sports Center',
    description: 'Modern facility with state-of-the-art artificial turf. Perfect for evening matches with excellent lighting.',
    location: {
      address: 'Hay Al Massira, Khouribga',
      coordinates: {
        lat: 32.8911,
        lng: -6.9263
      }
    },
    pricePerHour: 45,
    photos: ['/api/placeholder/400/300'],
    amenities: ['Parking', 'Changing Rooms', 'Lighting', 'Sound System'],
    lighting: true,
    size: 'large',
    surface: 'artificial',
    rating: {
      average: 4.6,
      count: 15
    },
    ownerId: 'owner-4',
    status: 'active'
  },
  {
    name: 'Neighborhood Football Court',
    description: 'Small but well-maintained concrete court. Great for casual games and youth training.',
    location: {
      address: 'Hay Essalam, Khouribga',
      coordinates: {
        lat: 32.8511,
        lng: -6.9363
      }
    },
    pricePerHour: 25,
    photos: ['/api/placeholder/400/300'],
    amenities: ['Parking', 'Water Fountain'],
    lighting: false,
    size: 'small',
    surface: 'concrete',
    rating: {
      average: 3.8,
      count: 8
    },
    ownerId: 'owner-5',
    status: 'active'
  },
  {
    name: 'Elite Training Ground',
    description: 'Premium grass field designed for professional training. Top-quality surface and excellent drainage.',
    location: {
      address: 'Hay Al Andalous, Khouribga',
      coordinates: {
        lat: 32.8711,
        lng: -6.8863
      }
    },
    pricePerHour: 60,
    photos: ['/api/placeholder/400/300'],
    amenities: ['Parking', 'Changing Rooms', 'Lighting', 'Medical Room', 'Gym Access'],
    lighting: true,
    size: 'large',
    surface: 'grass',
    rating: {
      average: 4.9,
      count: 31
    },
    ownerId: 'owner-6',
    status: 'active'
  }
];

export async function POST() {
  try {
    await connectToMongoDB();

    // Clear existing fields (optional - be careful in production)
    await Field.deleteMany({});

    // Insert sample fields
    const createdFields = await Field.insertMany(sampleFields);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${createdFields.length} fields`,
      count: createdFields.length
    });
  } catch (error) {
    console.error('Error seeding fields:', error);
    return NextResponse.json({ error: 'Failed to seed fields' }, { status: 500 });
  }
}
