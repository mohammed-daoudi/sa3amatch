import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: 'user' | 'admin';
  favorites: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
  }],
}, {
  timestamps: true,
});

// Indexes for performance
UserSchema.index({ clerkId: 1, role: 1 });
UserSchema.index({ email: 1, role: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
