import mongoose, { Schema, Document } from 'mongoose';

export interface IField extends Document {
  name: string;
  description: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  pricePerHour: number;
  photos: string[];
  amenities: string[];
  lighting: boolean;
  size: 'small' | 'medium' | 'large';
  surface: 'grass' | 'artificial' | 'concrete';
  availability: {
    [key: string]: {
      start: string;
      end: string;
      available: boolean;
    }[];
  };
  rating: {
    average: number;
    count: number;
  };
  ownerId: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

const fieldSchema = new Schema<IField>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
  },
  pricePerHour: {
    type: Number,
    required: true,
    min: 0,
  },
  photos: [{
    type: String,
  }],
  amenities: [{
    type: String,
  }],
  lighting: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large'],
    required: true,
  },
  surface: {
    type: String,
    enum: ['grass', 'artificial', 'concrete'],
    required: true,
  },
  availability: {
    type: Map,
    of: [{
      start: String,
      end: String,
      available: Boolean,
    }],
    default: {},
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  ownerId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Index for geo queries
fieldSchema.index({ 'location.coordinates': '2dsphere' });

export const Field = mongoose.models.Field || mongoose.model<IField>('Field', fieldSchema);
