import mongoose from 'mongoose';
import { Booking, TimeSlot, Field } from './models';
import { IBooking } from './models/Booking';
import { ITimeSlot } from './models/TimeSlot';

export interface BookingRequest {
  fieldId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'stripe';
  notes?: string;
  paymentProof?: {
    filename: string;
    url: string;
    uploadedAt: Date;
  };
}

export interface BookingResult {
  success: boolean;
  booking?: IBooking;
  error?: string;
  errorCode?: 'FIELD_NOT_FOUND' | 'FIELD_INACTIVE' | 'INVALID_TIME' | 'TIME_CONFLICT' | 'LOCK_FAILED' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
}

class BookingService {
  private static instance: BookingService;

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  /**
   * Clean up expired temporary locks
   */
  async cleanupExpiredLocks(): Promise<void> {
    const now = new Date();
    await TimeSlot.deleteMany({
      lockedUntil: { $lt: now },
      status: 'reserved'
    });
  }

  /**
   * Generate all time slot combinations for a given time range
   */
  private generateTimeSlots(startTime: string, endTime: string): Array<{ start: string; end: string }> {
    const slots: Array<{ start: string; end: string }> = [];

    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const formatTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    // Generate hourly slots (you can adjust granularity as needed)
    for (let current = startMinutes; current < endMinutes; current += 60) {
      const slotEnd = Math.min(current + 60, endMinutes);
      slots.push({
        start: formatTime(current),
        end: formatTime(slotEnd)
      });
    }

    return slots;
  }

  /**
   * Check if requested time overlaps with existing bookings
   */
  private async checkTimeConflicts(
    fieldId: string,
    date: Date,
    startTime: string,
    endTime: string,
    session: mongoose.ClientSession
  ): Promise<boolean> {
    const query = {
      fieldId: new mongoose.Types.ObjectId(fieldId),
      date: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };

    const existingSlots = await TimeSlot.find(query).session(session);
    return existingSlots.length > 0;
  }

  /**
   * Reserve time slots atomically
   */
  private async reserveTimeSlots(
    fieldId: string,
    bookingId: mongoose.Types.ObjectId,
    date: Date,
    startTime: string,
    endTime: string,
    session: mongoose.ClientSession
  ): Promise<ITimeSlot[]> {
    const timeSlots = this.generateTimeSlots(startTime, endTime);
    const lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minute lock

    const reservedSlots: ITimeSlot[] = [];

    for (const slot of timeSlots) {
      try {
        const timeSlot = new TimeSlot({
          fieldId: new mongoose.Types.ObjectId(fieldId),
          date,
          startTime: slot.start,
          endTime: slot.end,
          bookingId,
          status: 'reserved',
          lockedUntil: lockUntil
        });

        const savedSlot = await timeSlot.save({ session });
        reservedSlots.push(savedSlot);
      } catch (error: any) {
        // If we get a duplicate key error, it means the slot is already taken
        if (error.code === 11000) {
          // Clean up any slots we've already reserved
          if (reservedSlots.length > 0) {
            await TimeSlot.deleteMany({
              _id: { $in: reservedSlots.map(s => s._id) }
            }).session(session);
          }
          throw new Error('TIME_CONFLICT');
        }
        throw error;
      }
    }

    return reservedSlots;
  }

  /**
   * Confirm reserved time slots by changing status to 'booked'
   */
  private async confirmTimeSlots(
    timeSlotIds: mongoose.Types.ObjectId[],
    session: mongoose.ClientSession
  ): Promise<void> {
    await TimeSlot.updateMany(
      { _id: { $in: timeSlotIds } },
      {
        $set: { status: 'booked' },
        $unset: { lockedUntil: 1 }
      }
    ).session(session);
  }

  /**
   * Release reserved time slots (in case of booking failure)
   */
  private async releaseTimeSlots(
    timeSlotIds: mongoose.Types.ObjectId[],
    session: mongoose.ClientSession
  ): Promise<void> {
    await TimeSlot.deleteMany({
      _id: { $in: timeSlotIds }
    }).session(session);
  }

  /**
   * Create a booking with full concurrency protection
   */
  async createBooking(request: BookingRequest): Promise<BookingResult> {
    // Clean up expired locks first
    await this.cleanupExpiredLocks();

    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        // Validate field
        const field = await Field.findById(request.fieldId).session(session);
        if (!field) {
          return { success: false, error: 'Field not found', errorCode: 'FIELD_NOT_FOUND' };
        }

        if (!field.isActive) {
          return { success: false, error: 'Field is not active', errorCode: 'FIELD_INACTIVE' };
        }

        // Validate time format and logic
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(request.startTime) || !timeRegex.test(request.endTime)) {
          return { success: false, error: 'Invalid time format', errorCode: 'INVALID_TIME' };
        }

        const start = new Date(`1970-01-01T${request.startTime}:00`);
        const end = new Date(`1970-01-01T${request.endTime}:00`);

        if (end <= start) {
          return { success: false, error: 'End time must be after start time', errorCode: 'INVALID_TIME' };
        }

        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const totalPrice = duration * field.pricePerHour;

        // Parse and validate date
        const bookingDate = new Date(request.date);
        if (isNaN(bookingDate.getTime())) {
          return { success: false, error: 'Invalid date format', errorCode: 'INVALID_TIME' };
        }

        // Check if booking date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (bookingDate < today) {
          return { success: false, error: 'Cannot book in the past', errorCode: 'INVALID_TIME' };
        }

        // Create booking first (to get the ID)
        const bookingData: any = {
          fieldId: request.fieldId,
          userId: request.userId,
          date: bookingDate,
          startTime: request.startTime,
          endTime: request.endTime,
          duration,
          totalPrice,
          paymentMethod: request.paymentMethod,
          notes: request.notes || '',
          status: 'pending',
          paymentStatus: 'pending'
        };

        // Add payment proof if provided
        if (request.paymentProof && request.paymentMethod === 'bank_transfer') {
          bookingData.paymentProof = request.paymentProof;
        }

        const booking = new Booking(bookingData);
        const savedBooking = await booking.save({ session });

        // Try to reserve time slots atomically
        let reservedSlots: ITimeSlot[] = [];
        try {
          reservedSlots = await this.reserveTimeSlots(
            request.fieldId,
            savedBooking._id as mongoose.Types.ObjectId,
            bookingDate,
            request.startTime,
            request.endTime,
            session
          );

          // If we successfully reserved all slots, confirm them
          await this.confirmTimeSlots(
            reservedSlots.map(s => s._id as mongoose.Types.ObjectId),
            session
          );

          // Populate field details for response
          await savedBooking.populate('fieldId', 'name location photos');

          return {
            success: true,
            booking: savedBooking
          };

        } catch (error: any) {
          // Clean up the booking if time slot reservation failed
          await Booking.findByIdAndDelete(savedBooking._id).session(session);

          if (error.message === 'TIME_CONFLICT') {
            return {
              success: false,
              error: 'Time slot is already booked',
              errorCode: 'TIME_CONFLICT'
            };
          }
          throw error;
        }
      });

    } catch (error: any) {
      console.error('Error in createBooking:', error);

      if (error.name === 'ValidationError') {
        return {
          success: false,
          error: 'Invalid booking data: ' + error.message,
          errorCode: 'VALIDATION_ERROR'
        };
      }

      return {
        success: false,
        error: 'Internal server error',
        errorCode: 'UNKNOWN_ERROR'
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Cancel a booking and release its time slots
   */
  async cancelBooking(bookingId: string, canceledBy: string, reason?: string): Promise<BookingResult> {
    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        // Find the booking
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) {
          return { success: false, error: 'Booking not found', errorCode: 'UNKNOWN_ERROR' };
        }

        // Only allow cancellation of pending or approved bookings
        if (!['pending', 'approved'].includes(booking.status)) {
          return {
            success: false,
            error: 'Only pending or approved bookings can be canceled',
            errorCode: 'VALIDATION_ERROR'
          };
        }

        // Update booking status
        booking.status = 'canceled';
        booking.canceledBy = canceledBy;
        booking.canceledAt = new Date();
        if (reason) booking.cancelationReason = reason;

        await booking.save({ session });

        // Release time slots
        await TimeSlot.deleteMany({
          bookingId: booking._id
        }).session(session);

        await booking.populate('fieldId', 'name location photos');

        return {
          success: true,
          booking
        };
      });
    } catch (error: any) {
      console.error('Error in cancelBooking:', error);
      return {
        success: false,
        error: 'Internal server error',
        errorCode: 'UNKNOWN_ERROR'
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get available time slots for a field on a specific date
   */
  async getAvailableSlots(fieldId: string, date: string): Promise<{
    success: boolean;
    availableSlots?: string[];
    error?: string;
  }> {
    try {
      await this.cleanupExpiredLocks();

      const field = await Field.findById(fieldId);
      if (!field || !field.isActive) {
        return { success: false, error: 'Field not found or inactive' };
      }

      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return { success: false, error: 'Invalid date format' };
      }

      // Get booked time slots for this date
      const bookedSlots = await TimeSlot.find({
        fieldId: new mongoose.Types.ObjectId(fieldId),
        date: {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lt: new Date(targetDate.setHours(23, 59, 59, 999))
        }
      }).select('startTime endTime');

      // Generate all possible hourly slots (8 AM to 10 PM)
      const allSlots: string[] = [];
      for (let hour = 8; hour < 22; hour++) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      }

      // Filter out booked slots
      const bookedTimes = new Set(bookedSlots.map(slot => slot.startTime));
      const availableSlots = allSlots.filter(slot => !bookedTimes.has(slot));

      return { success: true, availableSlots };
    } catch (error) {
      console.error('Error getting available slots:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}

export const bookingService = BookingService.getInstance();
