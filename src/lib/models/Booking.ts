import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  fieldId: mongoose.Types.ObjectId;
  userId: string; // Clerk user ID
  timeSlot: {
    date: Date;
    startTime: string;
    endTime: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  paymentMethod: 'cash' | 'bank_transfer' | 'stripe';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paymentProof?: string; // File URL for bank transfer proof
  amount: {
    total: number;
    deposit?: number;
    remaining?: number;
  };
  stripePaymentIntentId?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  fieldId: {
    type: Schema.Types.ObjectId,
    ref: 'Field',
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  timeSlot: {
    date: {
      type: Date,
      required: true,
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
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'stripe'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded'],
    default: 'pending',
  },
  paymentProof: {
    type: String,
  },
  amount: {
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    deposit: {
      type: Number,
      min: 0,
    },
    remaining: {
      type: Number,
      min: 0,
    },
  },
  stripePaymentIntentId: {
    type: String,
  },
  notes: {
    type: String,
  },
  adminNotes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Compound index to prevent double bookings
bookingSchema.index(
  { fieldId: 1, 'timeSlot.date': 1, 'timeSlot.startTime': 1, 'timeSlot.endTime': 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['rejected', 'cancelled'] } }
  }
);

export const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);
