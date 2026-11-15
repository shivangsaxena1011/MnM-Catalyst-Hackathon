import nodemailer from 'nodemailer';

/**
 * Honest Email Service using Nodemailer
 * Strictly reports actual delivery status. Never claims an email was sent if SMTP is unconfigured or failed.
 */

const {
  SMTP_HOST,
  SMTP_PORT = 587,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM = 'SAATHI CARE <notifications@saathicare.health>',
} = process.env;

export function isSmtpConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

let transporter = null;

if (isSmtpConfigured()) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log(`[EmailService] SMTP configured with host: ${SMTP_HOST}:${SMTP_PORT}`);
  } catch (err) {
    console.error('[EmailService] Failed to initialize Nodemailer transporter:', err.message);
  }
} else {
  console.warn('[EmailService] [Notice] SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not fully provided. Email service will run in simulated fallback mode. Notifications will remain active in-app.');
}

/**
 * Send an email notification
 * Returns { success: boolean, status: 'sent' | 'unconfigured' | 'failed', messageId?: string, error?: string }
 */
export async function sendNotificationEmail({ to, subject, htmlContent, textFallback }) {
  if (!to) {
    return { success: false, status: 'failed', error: 'No recipient email provided' };
  }

  // Security: Sanitize subject and recipient to prevent CRLF injection
  const safeSubject = String(subject).replace(/[\r\n]+/g, ' ');
  const safeTo = String(to).replace(/[\r\n]+/g, ' ').trim();

  if (!isSmtpConfigured() || !transporter) {
    console.log(`[EmailService - Simulation] Unconfigured SMTP. Simulated email to: ${safeTo} | Subject: "${safeSubject}"`);
    return {
      success: true,
      status: 'unconfigured',
      notice: 'SMTP unconfigured. Message logged to in-app notification center and console.',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: safeTo,
      subject: safeSubject,
      text: textFallback || safeSubject,
      html: htmlContent,
    });

    console.log(`[EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return { success: true, status: 'sent', messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
    return { success: false, status: 'failed', error: err.message };
  }
}

/**
 * Email template for Caregiver Escalation Alert
 */
export function buildEscalationEmail({ patientName, medicineName, dosage, scheduledSlot, scheduledTime, tier }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
      <div style="background: #0B1E33; padding: 24px; text-align: center; color: #FFFFFF;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">SAATHI CARE</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #94A3B8;">Smart Care Escalation System</p>
      </div>
      <div style="padding: 28px; color: #1E293B;">
        <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #991B1B; margin: 0 0 6px 0; font-size: 18px;">⚠️ Unconfirmed Medication Dose Alert (Tier ${tier})</h2>
          <p style="margin: 0; font-size: 14px; color: #7F1D1D; line-height: 1.5;">
            <strong>${patientName}</strong> has not confirmed their scheduled dose of <strong>${medicineName} (${dosage})</strong> for <strong>${scheduledSlot.toUpperCase()}</strong> (${scheduledTime}).
          </p>
        </div>

        <p style="font-size: 15px; line-height: 1.6;">
          As an authorized Care Circle member, you are being notified to follow up gently with ${patientName}.
        </p>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="color: #64748B; padding: 4px 0;">Patient:</td><td style="font-weight: 600;">${patientName}</td></tr>
            <tr><td style="color: #64748B; padding: 4px 0;">Medication:</td><td style="font-weight: 600;">${medicineName}</td></tr>
            <tr><td style="color: #64748B; padding: 4px 0;">Prescribed Dosage:</td><td style="font-weight: 600;">${dosage}</td></tr>
            <tr><td style="color: #64748B; padding: 4px 0;">Slot:</td><td style="font-weight: 600;">${scheduledSlot} (${scheduledTime})</td></tr>
          </table>
        </div>

        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 13px; color: #92400E;">
          🛡️ <strong>Important Safety Guidance:</strong> Never instruct the patient to take a double dose to make up for a missed one. If a dose is missed beyond the doctor-approved window, skip it and continue on schedule.
        </div>

        <p style="font-size: 13px; color: #64748B; text-align: center; margin-top: 30px;">
          View details and record updates inside the SAATHI CARE Dashboard.
        </p>
      </div>
    </div>
  `;
}

/**
 * Email template for Doctor Appointment Reminder
 */
export function buildAppointmentEmail({ patientName, doctorName, specialty, hospital, appointmentDate, appointmentTime, notes }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
      <div style="background: #0B1E33; padding: 24px; text-align: center; color: #FFFFFF;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">SAATHI CARE</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #14B8A6;">Appointment Guardian</p>
      </div>
      <div style="padding: 28px; color: #1E293B;">
        <div style="background: #F0FDFA; border-left: 4px solid #0D9488; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #0F766E; margin: 0 0 6px 0; font-size: 18px;">🗓️ Upcoming Doctor Consultation Reminder</h2>
          <p style="margin: 0; font-size: 14px; color: #115E59; line-height: 1.5;">
            Reminder: <strong>${patientName}</strong> has an upcoming medical consultation scheduled.
          </p>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="color: #64748B; padding: 5px 0;">Doctor:</td><td style="font-weight: 600;">${doctorName} (${specialty})</td></tr>
            <tr><td style="color: #64748B; padding: 5px 0;">Location:</td><td style="font-weight: 600;">${hospital}</td></tr>
            <tr><td style="color: #64748B; padding: 5px 0;">Date:</td><td style="font-weight: 600;">${appointmentDate}</td></tr>
            <tr><td style="color: #64748B; padding: 5px 0;">Time:</td><td style="font-weight: 600;">${appointmentTime}</td></tr>
            ${notes ? `<tr><td style="color: #64748B; padding: 5px 0;">Notes:</td><td style="font-style: italic;">${notes}</td></tr>` : ''}
          </table>
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Please ensure relevant health records, current prescriptions, and questions are ready for the consultation.
        </p>

        <p style="font-size: 13px; color: #64748B; text-align: center; margin-top: 25px;">
          Managed via SAATHI CARE Appointment Guardian
        </p>
      </div>
    </div>
  `;
}

/**
 * Email template for Upcoming Medication Dose Reminder
 */
export function buildUpcomingDoseEmail({ patientName, medicineName, dosage, instructions, scheduledSlot, scheduledTime, minutesUntil }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
      <div style="background: #0B1E33; padding: 24px; text-align: center; color: #FFFFFF;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">SAATHI CARE</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #14B8A6;">Medication Schedule Reminder</p>
      </div>
      <div style="padding: 28px; color: #1E293B;">
        <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #065F46; margin: 0 0 6px 0; font-size: 18px;">⏰ Upcoming Dose Due Soon (~${minutesUntil} mins)</h2>
          <p style="margin: 0; font-size: 14px; color: #047857; line-height: 1.5;">
            Scheduled dose for <strong>${patientName}</strong> is approaching for <strong>${scheduledSlot.toUpperCase()}</strong>.
          </p>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="color: #64748B; padding: 5px 0;">Medication:</td><td style="font-weight: 600;">${medicineName}</td></tr>
            <tr><td style="color: #64748B; padding: 5px 0;">Dosage:</td><td style="font-weight: 600;">${dosage}</td></tr>
            <tr><td style="color: #64748B; padding: 5px 0;">Scheduled Time:</td><td style="font-weight: 600;">${scheduledTime} (${scheduledSlot})</td></tr>
            ${instructions ? `<tr><td style="color: #64748B; padding: 5px 0;">Instructions:</td><td style="font-style: italic;">${instructions}</td></tr>` : ''}
          </table>
        </div>

        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px; margin: 15px 0; font-size: 13px; color: #92400E;">
          💡 <em>Tap "YES, I TOOK IT" on the Elder Dashboard once consumed to record your adherence.</em>
        </div>

        <p style="font-size: 13px; color: #64748B; text-align: center; margin-top: 25px;">
          Sent by SAATHI CARE Medication Circle
        </p>
      </div>
    </div>
  `;
}
