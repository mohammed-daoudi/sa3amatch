import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeSlot extends Document {
  fieldId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  bookingId: mongoose.Types.ObjectId;
  status: 'reserved' | 'booked';
  lockedUntil?: Date; // For temporary locks during booking process
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema<ITimeSlot>({
  fieldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
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
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['reserved', 'booked'],
    default: 'reserved',
    index: true,
  },
  lockedUntil: {
    type: Date,
    index: true,
  },
}, {
  timestamps: true,
});

// Ensure no overlapping time slots for the same field and date
TimeSlotSchema.index({
  fieldId: 1,
  date: 1,
  startTime: 1,
  endTime: 1
}, {
  unique: true
});

// Index for cleanup of expired locks
TimeSlotSchema.index({ lockedUntil: 1 }, {
  partialFilterExpression: {
    lockedUntil: { $exists: true }
  }
});

export const TimeSlot = mongoose.models.TimeSlot || mongoose.model<ITimeSlot>('TimeSlot', TimeSlotSchema);
