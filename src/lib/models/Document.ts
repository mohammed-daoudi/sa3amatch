import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
  userId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadType: 'profile' | 'document' | 'payment_proof' | 'id_document' | 'license';
  bookingId?: mongoose.Types.ObjectId; // For payment proofs
  description?: string;
  documentType?: 'id' | 'license' | 'proof_of_address' | 'other';
  verified?: boolean;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

const documentSchema = new Schema<IDocument>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  uploadType: {
    type: String,
    enum: ['profile', 'document', 'payment_proof', 'id_document', 'license'],
    required: true,
    index: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    index: true,
  },
  description: {
    type: String,
  },
  documentType: {
    type: String,
    enum: ['id', 'license', 'proof_of_address', 'other'],
    default: 'other',
  },
  verified: {
    type: Boolean,
    default: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  verifiedAt: {
    type: Date,
  },
  verifiedBy: {
    type: String,
  },
}, {
  timestamps: true,
});

// Create compound indexes for efficient queries
documentSchema.index({ userId: 1, uploadType: 1 });
documentSchema.index({ bookingId: 1, uploadType: 1 });
documentSchema.index({ userId: 1, documentType: 1 });

export const Document = mongoose.models.Document || mongoose.model<IDocument>('Document', documentSchema);
