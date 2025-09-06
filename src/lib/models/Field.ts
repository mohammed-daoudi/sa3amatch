import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  city: string;
  district?: string;
}

export interface IAvailability {
  dayOfWeek: number; // 0-6 (Sunday to Saturday)
  startTime: string; // "08:00"
  endTime: string; // "22:00"
  isAvailable: boolean;
}

export interface IField extends Document {
  name: string;
  description: string;
  pricePerHour: number;
  location: ILocation;
  photos: string[];
  availability: IAvailability[];
  amenities: string[];
  fieldType: 'outdoor' | 'indoor';
  surface: 'grass' | 'artificial' | 'concrete';
  capacity: number;
  isActive: boolean;
  ownerId: string; // Clerk ID of the field owner/admin
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v: number[]) {
        return v.length === 2;
      },
      message: 'Coordinates must be [longitude, latitude]',
    },
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  district: {
    type: String,
    trim: true,
  },
});

const AvailabilitySchema = new Schema<IAvailability>({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

const FieldSchema = new Schema<IField>({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  pricePerHour: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  location: {
    type: LocationSchema,
    required: true,
  },
  photos: [{
    type: String,
    trim: true,
  }],
  availability: [AvailabilitySchema],
  amenities: [{
    type: String,
    trim: true,
  }],
  fieldType: {
    type: String,
    enum: ['outdoor', 'indoor'],
    required: true,
    index: true,
  },
  surface: {
    type: String,
    enum: ['grass', 'artificial', 'concrete'],
    required: true,
    index: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  ownerId: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Geospatial index for location-based queries
FieldSchema.index({ 'location.coordinates': '2dsphere' });

// Compound indexes for common queries
FieldSchema.index({ isActive: 1, 'location.city': 1, pricePerHour: 1 });
FieldSchema.index({ isActive: 1, fieldType: 1, surface: 1 });

export const Field = mongoose.models.Field || mongoose.model<IField>('Field', FieldSchema);
