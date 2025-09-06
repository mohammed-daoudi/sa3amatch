import { z } from 'zod';

// Field validations
export const locationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().optional(),
});

export const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  isAvailable: z.boolean().default(true),
});

export const createFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(100),
  description: z.string().min(1, 'Description is required').max(1000),
  pricePerHour: z.number().min(0, 'Price must be positive'),
  location: locationSchema,
  photos: z.array(z.string().url()).max(10, 'Maximum 10 photos allowed'),
  availability: z.array(availabilitySchema),
  amenities: z.array(z.string()).max(20),
  fieldType: z.enum(['outdoor', 'indoor']),
  surface: z.enum(['grass', 'artificial', 'concrete']),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
});

export const updateFieldSchema = createFieldSchema.partial();

// Booking validations
export const createBookingSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
  date: z.string().refine((date) => new Date(date) > new Date(), 'Date must be in the future'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'stripe']),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  const start = new Date(`1970-01-01T${data.startTime}:00`);
  const end = new Date(`1970-01-01T${data.endTime}:00`);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'canceled']),
  adminNotes: z.string().max(1000).optional(),
  cancelationReason: z.string().max(500).optional(),
});

// User validations
export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
});

// Search and filter validations
export const fieldSearchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  fieldType: z.enum(['outdoor', 'indoor']).optional(),
  surface: z.enum(['grass', 'artificial', 'concrete']).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().min(0).max(50).optional(), // km
  date: z.string().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const bookingSearchSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'canceled']).optional(),
  fieldId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'stripe']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => file instanceof File, 'File is required'),
  type: z.enum(['payment_proof', 'field_photo']),
});

// Admin analytics validation
export const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  fieldId: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// Type exports
export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type FieldSearchParams = z.infer<typeof fieldSearchSchema>;
export type BookingSearchParams = z.infer<typeof bookingSearchSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
