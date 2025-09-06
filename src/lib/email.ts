import { Resend } from 'resend';
import { IBooking } from './models/Booking';
import { IField } from './models/Field';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailContext {
  booking: IBooking & { fieldId: IField };
  userEmail: string;
  userName?: string;
}

// Email templates
const templates = {
  bookingCreated: (ctx: EmailContext) => ({
    subject: `🏟️ Booking Confirmation - ${ctx.booking.fieldId.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚽ Sa3aMatch</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Football Field Booking Platform</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">Booking Confirmation</h2>

          <p style="color: #374151; line-height: 1.6;">
            Hello ${ctx.userName || 'there'},<br><br>
            Your booking has been successfully submitted and is now <strong>pending approval</strong>.
            You'll receive another email once it's approved.
          </p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Field:</td>
                <td style="padding: 8px 0; color: #1f2937;"><strong>${ctx.booking.fieldId.name}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(ctx.booking.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${ctx.booking.startTime} - ${ctx.booking.endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Duration:</td>
                <td style="padding: 8px 0; color: #1f2937;">${ctx.booking.duration} hour${ctx.booking.duration !== 1 ? 's' : ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Total Price:</td>
                <td style="padding: 8px 0; color: #10b981; font-weight: bold; font-size: 18px;">${ctx.booking.totalPrice} MAD</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Payment Method:</td>
                <td style="padding: 8px 0; color: #1f2937;">${ctx.booking.paymentMethod.replace('_', ' ').toUpperCase()}</td>
              </tr>
            </table>
          </div>

          ${ctx.booking.paymentMethod === 'bank_transfer' ? `
            <div style="background: #dbeafe; border: 1px solid #93c5fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0;">💳 Bank Transfer Instructions</h4>
              <p style="color: #1e3a8a; margin: 0; font-size: 14px;">
                <strong>Account:</strong> Sa3aMatch Sports<br>
                <strong>IBAN:</strong> MA64 0000 0000 0000 0000 0000<br>
                <strong>Amount:</strong> ${ctx.booking.totalPrice} MAD<br>
                ${ctx.booking.paymentProof ? '<br><em>✅ Payment proof uploaded</em>' : '<br><em>⚠️ Please upload payment proof after transfer</em>'}
              </p>
            </div>
          ` : ''}

          ${ctx.booking.paymentMethod === 'cash' ? `
            <div style="background: #d1fae5; border: 1px solid #6ee7b7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #047857; margin: 0 0 10px 0;">💰 Cash Payment</h4>
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                Please bring <strong>${ctx.booking.totalPrice} MAD</strong> in cash when you arrive at the field.
              </p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard"
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View in Dashboard
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you have any questions or need to modify your booking, please contact us.<br>
            <strong>Booking ID:</strong> ${ctx.booking._id}
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© 2024 Sa3aMatch. Football field booking made easy.</p>
        </div>
      </div>
    `,
  }),

  bookingApproved: (ctx: EmailContext) => ({
    subject: `✅ Booking Approved - ${ctx.booking.fieldId.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚽ Sa3aMatch</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Great news about your booking!</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #10b981; color: white; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px;">
              ✅
            </div>
            <h2 style="color: #10b981; margin: 0; font-size: 28px;">Booking Approved!</h2>
          </div>

          <p style="color: #374151; line-height: 1.6; text-align: center; font-size: 16px;">
            Hello ${ctx.userName || 'there'},<br><br>
            Your booking for <strong>${ctx.booking.fieldId.name}</strong> has been approved!
            We're excited to see you on the field.
          </p>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #166534; margin: 0 0 15px 0;">📅 Your Session Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #16a34a; font-weight: 500;">Date & Time:</td>
                <td style="padding: 8px 0; color: #166534; font-weight: bold;">
                  ${new Date(ctx.booking.date).toLocaleDateString()} at ${ctx.booking.startTime} - ${ctx.booking.endTime}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #16a34a; font-weight: 500;">Duration:</td>
                <td style="padding: 8px 0; color: #166534;">${ctx.booking.duration} hour${ctx.booking.duration !== 1 ? 's' : ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #16a34a; font-weight: 500;">Location:</td>
                <td style="padding: 8px 0; color: #166534;">${ctx.booking.fieldId.location?.address || 'Address not available'}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">⏰ Important Reminders</h4>
            <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Please arrive 10 minutes early</li>
              <li>Bring appropriate football gear</li>
              ${ctx.booking.paymentMethod === 'cash' ? `<li>Remember to bring ${ctx.booking.totalPrice} MAD in cash</li>` : ''}
              <li>Contact us if you need to cancel or reschedule</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard"
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
              View Booking
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Have a great game! 🥅</p>
        </div>
      </div>
    `,
  }),

  bookingRejected: (ctx: EmailContext) => ({
    subject: `❌ Booking Update - ${ctx.booking.fieldId.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚽ Sa3aMatch</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Update on your booking</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <h2 style="color: #dc2626; margin: 0 0 20px 0;">Booking Not Approved</h2>

          <p style="color: #374151; line-height: 1.6;">
            Hello ${ctx.userName || 'there'},<br><br>
            Unfortunately, we couldn't approve your booking for <strong>${ctx.booking.fieldId.name}</strong>
            on ${new Date(ctx.booking.date).toLocaleDateString()} at ${ctx.booking.startTime} - ${ctx.booking.endTime}.
          </p>

          ${ctx.booking.adminNotes ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #dc2626; margin: 0 0 10px 0;">📝 Reason:</h4>
              <p style="color: #991b1b; margin: 0; font-style: italic;">${ctx.booking.adminNotes}</p>
            </div>
          ` : ''}

          <div style="background: #f0f9ff; border: 1px solid #7dd3fc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="color: #0369a1; margin: 0 0 10px 0;">💡 What's Next?</h4>
            <ul style="color: #0c4a6e; margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Try booking a different time slot</li>
              <li>Choose an alternative date</li>
              <li>Contact us for assistance</li>
              <li>Browse other available fields</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/fields"
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Browse Fields
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">We appreciate your understanding.</p>
        </div>
      </div>
    `,
  }),

  bookingCanceled: (ctx: EmailContext) => ({
    subject: `🚫 Booking Canceled - ${ctx.booking.fieldId.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #6b7280; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚽ Sa3aMatch</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Booking cancellation confirmation</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <h2 style="color: #6b7280; margin: 0 0 20px 0;">Booking Canceled</h2>

          <p style="color: #374151; line-height: 1.6;">
            Hello ${ctx.userName || 'there'},<br><br>
            Your booking for <strong>${ctx.booking.fieldId.name}</strong>
            on ${new Date(ctx.booking.date).toLocaleDateString()} has been canceled.
          </p>

          ${ctx.booking.cancelationReason ? `
            <div style="background: #f9fafb; border: 1px solid #d1d5db; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #6b7280; margin: 0 0 10px 0;">📝 Reason for cancellation:</h4>
              <p style="color: #4b5563; margin: 0; font-style: italic;">${ctx.booking.cancelationReason}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/fields"
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Book Another Field
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Thank you for using Sa3aMatch.</p>
        </div>
      </div>
    `,
  }),

  bookingReminder: (ctx: EmailContext) => ({
    subject: `⏰ Reminder: Your field session tomorrow - ${ctx.booking.fieldId.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚽ Sa3aMatch</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Don't forget your session tomorrow!</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
            <h2 style="color: #f59e0b; margin: 0;">Tomorrow's Session</h2>
          </div>

          <p style="color: #374151; line-height: 1.6; text-align: center;">
            Hello ${ctx.userName || 'there'},<br><br>
            This is a friendly reminder about your upcoming session at <strong>${ctx.booking.fieldId.name}</strong>.
          </p>

          <div style="background: #fffbeb; border: 1px solid #fed7aa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #ea580c; margin: 0 0 15px 0; text-align: center;">📅 Session Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #ea580c; font-weight: 500;">Time:</td>
                <td style="padding: 8px 0; color: #9a3412; font-weight: bold; font-size: 18px;">
                  ${ctx.booking.startTime} - ${ctx.booking.endTime}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #ea580c; font-weight: 500;">Location:</td>
                <td style="padding: 8px 0; color: #9a3412;">${ctx.booking.fieldId.location?.address || 'Address not available'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #ea580c; font-weight: 500;">Duration:</td>
                <td style="padding: 8px 0; color: #9a3412;">${ctx.booking.duration} hour${ctx.booking.duration !== 1 ? 's' : ''}</td>
              </tr>
            </table>
          </div>

          <div style="background: #ecfdf5; border: 1px solid #86efac; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="color: #166534; margin: 0 0 10px 0;">✅ Pre-game Checklist</h4>
            <ul style="color: #166534; margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Football boots and appropriate gear</li>
              <li>Water bottle and towel</li>
              <li>Arrive 10 minutes early</li>
              ${ctx.booking.paymentMethod === 'cash' ? `<li>Bring ${ctx.booking.totalPrice} MAD in cash</li>` : ''}
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard"
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Booking Details
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">See you on the field! ⚽</p>
        </div>
      </div>
    `,
  }),
};

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendBookingCreated(booking: IBooking & { fieldId: IField }, userEmail: string, userName?: string) {
    const template = templates.bookingCreated({ booking, userEmail, userName });
    return this.sendEmail(userEmail, template.subject, template.html);
  }

  async sendBookingApproved(booking: IBooking & { fieldId: IField }, userEmail: string, userName?: string) {
    const template = templates.bookingApproved({ booking, userEmail, userName });
    return this.sendEmail(userEmail, template.subject, template.html);
  }

  async sendBookingRejected(booking: IBooking & { fieldId: IField }, userEmail: string, userName?: string) {
    const template = templates.bookingRejected({ booking, userEmail, userName });
    return this.sendEmail(userEmail, template.subject, template.html);
  }

  async sendBookingCanceled(booking: IBooking & { fieldId: IField }, userEmail: string, userName?: string) {
    const template = templates.bookingCanceled({ booking, userEmail, userName });
    return this.sendEmail(userEmail, template.subject, template.html);
  }

  async sendBookingReminder(booking: IBooking & { fieldId: IField }, userEmail: string, userName?: string) {
    const template = templates.bookingReminder({ booking, userEmail, userName });
    return this.sendEmail(userEmail, template.subject, template.html);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured, skipping email send');
        return { success: false, error: 'RESEND_API_KEY not configured' };
      }

      const result = await resend.emails.send({
        from: 'Sa3aMatch <noreply@sa3amatch.com>',
        to,
        subject,
        html,
      });

      console.log('Email sent successfully:', { to, subject, id: result.data?.id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const emailService = EmailService.getInstance();
