import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  fieldId: mongoose.Types.ObjectId;
  userId: string; // Clerk user ID
  bookingId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  photos?: string[];
  response?: {
    text: string;
    respondedAt: Date;
    respondedBy: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  fieldId: {
    type: Schema.Types.ObjectId,
    ref: 'Field',
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
  photos: [{
    type: String,
  }],
  response: {
    text: String,
    respondedAt: Date,
    respondedBy: String,
  },
}, {
  timestamps: true,
});

// Ensure one review per booking
reviewSchema.index({ bookingId: 1 }, { unique: true });

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
