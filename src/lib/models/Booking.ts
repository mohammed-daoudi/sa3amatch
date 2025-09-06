import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'canceled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'stripe';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IPaymentProof {
  filename: string;
  url: string;
  uploadedAt: Date;
}

export interface IBooking extends Document {
  fieldId: mongoose.Types.ObjectId;
  userId: string; // Clerk ID
  date: Date;
  startTime: string; // "14:00"
  endTime: string; // "16:00"
  duration: number; // in hours
  totalPrice: number;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProof?: IPaymentProof;
  stripePaymentIntentId?: string;
  notes?: string;
  adminNotes?: string;
  approvedBy?: string; // Clerk ID of admin who approved
  approvedAt?: Date;
  canceledBy?: string; // Clerk ID of user/admin who canceled
  canceledAt?: Date;
  cancelationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentProofSchema = new Schema<IPaymentProof>({
  filename: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const BookingSchema = new Schema<IBooking>({
  fieldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
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
  duration: {
    type: Number,
    required: true,
    min: 0.5,
    max: 12,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'canceled'],
    default: 'pending',
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'stripe'],
    required: true,
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  paymentProof: PaymentProofSchema,
  stripePaymentIntentId: {
    type: String,
    sparse: true,
    index: true,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  approvedBy: {
    type: String,
    index: true,
  },
  approvedAt: {
    type: Date,
  },
  canceledBy: {
    type: String,
    index: true,
  },
  canceledAt: {
    type: Date,
  },
  cancelationReason: {
    type: String,
    trim: true,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

// Compound indexes for common queries
BookingSchema.index({ fieldId: 1, date: 1, startTime: 1 });
BookingSchema.index({ userId: 1, status: 1, date: -1 });
BookingSchema.index({ status: 1, date: 1 });
BookingSchema.index({ fieldId: 1, status: 1, date: 1 });

// Index for preventing double bookings
BookingSchema.index({
  fieldId: 1,
  date: 1,
  startTime: 1,
  endTime: 1,
  status: 1
}, {
  unique: true,
  partialFilterExpression: {
    status: { $in: ['pending', 'approved'] }
  }
});

export const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
