import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction =
  | 'create_field'
  | 'update_field'
  | 'delete_field'
  | 'approve_booking'
  | 'reject_booking'
  | 'cancel_booking'
  | 'update_user_role'
  | 'upload_payment_proof'
  | 'update_booking_status'
  | 'bulk_action';

export interface IAuditLog extends Document {
  userId: string; // Clerk ID of the user who performed the action
  action: AuditAction;
  resourceType: 'field' | 'booking' | 'user' | 'system';
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: [
      'create_field',
      'update_field',
      'delete_field',
      'approve_booking',
      'reject_booking',
      'cancel_booking',
      'update_user_role',
      'upload_payment_proof',
      'update_booking_status',
      'bulk_action'
    ],
    required: true,
    index: true,
  },
  resourceType: {
    type: String,
    enum: ['field', 'booking', 'user', 'system'],
    required: true,
    index: true,
  },
  resourceId: {
    type: String,
    required: true,
    index: true,
  },
  details: {
    type: Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound indexes for common audit queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
