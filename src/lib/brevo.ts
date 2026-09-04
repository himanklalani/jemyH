import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function getHeaders() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not defined');
  return {
    'api-key': apiKey,
    'Content-Type': 'application/json',
  };
}

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}

async function sendEmail({ to, subject, htmlContent }: SendEmailParams) {
  const fromEmail = process.env.SMTP_FROM ?? 'noreply@jemy.shop';
  await axios.post(
    BREVO_API_URL,
    {
      sender: { name: 'Jemy', email: fromEmail },
      to,
      subject,
      htmlContent,
    },
    { headers: getHeaders() }
  );
}

// ─── Transactional Email Functions ───────────────────────────────────────────

export async function sendOTPEmail(email: string, otp: string) {
  await sendEmail({
    to: [{ email }],
    subject: 'Verify your Jemy account',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#111">Welcome to Jemy</h2>
        <p>Your one-time verification code is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111;margin:24px 0">${otp}</div>
        <p style="color:#666;font-size:13px">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, otp: string) {
  await sendEmail({
    to: [{ email }],
    subject: 'Reset your Jemy password',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#111">Password Reset</h2>
        <p>Use the code below to reset your password:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111;margin:24px 0">${otp}</div>
        <p style="color:#666;font-size:13px">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderId: string,
  totalPrice: number,
  currency: string
) {
  await sendEmail({
    to: [{ email, name }],
    subject: `Order Confirmed — ${orderId}`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#111">Your order is confirmed!</h2>
        <p>Hi ${name}, thank you for shopping with Jemy.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Total:</strong> ${currency} ${totalPrice.toFixed(2)}</p>
        <p>We'll send you a shipping update once your order is on its way.</p>
      </div>
    `,
  });
}

export async function sendPrescriptionStatusEmail(
  email: string,
  name: string,
  status: 'verified' | 'rejected',
  orderId: string
) {
  const isVerified = status === 'verified';
  await sendEmail({
    to: [{ email, name }],
    subject: `Prescription ${isVerified ? 'Verified' : 'Requires Attention'} — Order ${orderId}`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#111">Prescription Update</h2>
        <p>Hi ${name},</p>
        ${isVerified
          ? `<p>Great news! Your prescription for order <strong>${orderId}</strong> has been verified. We're now preparing your eyewear.</p>`
          : `<p>We were unable to verify the prescription for order <strong>${orderId}</strong>. Please contact us at <a href="mailto:${process.env.US_SUPPORT_EMAIL}">${process.env.US_SUPPORT_EMAIL}</a> to resolve this.</p>`
        }
      </div>
    `,
  });
}

export async function sendShippingUpdateEmail(
  email: string,
  name: string,
  orderId: string,
  trackingNumber: string,
  carrier: string
) {
  await sendEmail({
    to: [{ email, name }],
    subject: `Your Jemy order is on its way! — ${orderId}`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#111">Your order is shipped!</h2>
        <p>Hi ${name}, your Jemy order <strong>${orderId}</strong> has been dispatched.</p>
        <p><strong>Carrier:</strong> ${carrier}</p>
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        <p style="color:#666;font-size:13px">Allow 24–48 hours for tracking to activate.</p>
      </div>
    `,
  });
}

export async function sendReviewRequestEmail(
  email: string,
  name: string,
  orderId: string
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jemy.shop';
  await sendEmail({
    to: [{ email, name }],
    subject: 'How was your Jemy experience?',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#111">We'd love your feedback</h2>
        <p>Hi ${name}, thank you for your recent order!</p>
        <p>We'd really appreciate if you could leave a short review.</p>
        <a href="${siteUrl}/orders/${orderId}/review"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#111;color:#fff;border-radius:6px;text-decoration:none">
          Leave a Review
        </a>
      </div>
    `,
  });
}
