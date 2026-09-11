import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function getHeaders() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
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
  const headers = getHeaders();
  if (!headers) {
    console.warn(`[Brevo Email Pending] BREVO_API_KEY is not defined. Email skipped for: ${to.map(t => t.email).join(', ')} | Subject: "${subject}"`);
    return { success: false, pendingConfig: true, message: 'BREVO_API_KEY not configured' };
  }

  const fromEmail = process.env.SMTP_FROM ?? 'noreply@jemy.shop';
  try {
    const res = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: 'Jemy Eyewear Atelier', email: fromEmail },
        to,
        subject,
        htmlContent,
      },
      { headers }
    );
    return { success: true, messageId: res.data?.messageId };
  } catch (err: any) {
    console.error('[Brevo Error]', err?.response?.data || err.message);
    return { success: false, error: err?.response?.data || err.message };
  }
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
    subject: `Order Confirmed - ${orderId}`,
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
    subject: `Prescription ${isVerified ? 'Verified' : 'Requires Attention'} - Order ${orderId}`,
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
    subject: `Your Jemy order is on its way! - ${orderId}`,
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

export interface AbandonedCartItem {
  name: string;
  image?: string;
  priceFormatted?: string;
  quantity: number;
}

export async function sendAbandonedCartEmail(params: {
  email: string;
  name?: string;
  items: AbandonedCartItem[];
  discountCode?: string;
}) {
  const { email, name = 'there', items = [], discountCode = 'JEMY10' } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jemy.shop';
  const cartUrl = `${siteUrl}/cart`;

  const itemsHtml = items.map(item => `
    <div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.06)">
      ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;background:#F4F4F0" />` : ''}
      <div style="flex:1">
        <p style="margin:0;font-size:14px;font-weight:bold;color:#1C2740">${item.name}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#8E929C">Qty: ${item.quantity} ${item.priceFormatted ? `· ${item.priceFormatted}` : ''}</p>
      </div>
    </div>
  `).join('');

  return await sendEmail({
    to: [{ email, name }],
    subject: 'Your handcrafted frames are waiting at Jemy Atelier',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background-color:#EAEBE6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EAEBE6;padding:40px 16px">
          <tr>
            <td align="center">
              <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(0,0,0,0.06);box-shadow:0 12px 36px rgba(0,0,0,0.05)" cellpadding="0" cellspacing="0">
                <!-- Header -->
                <tr>
                  <td style="padding:36px 40px 24px;text-align:center;background:#1C2740">
                    <p style="margin:0;font-size:11px;font-weight:bold;letter-spacing:0.25em;color:#D4AF37;text-transform:uppercase">JEMY · ARCHITECTURAL EYEWEAR</p>
                    <h1 style="margin:16px 0 0;font-size:26px;font-weight:bold;color:#ffffff;letter-spacing:-0.02em">Still Thinking About These?</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:32px 40px">
                    <p style="margin:0 0 16px;font-size:15px;color:#4A4F5A;line-height:1.6">
                      Hi ${name},<br />
                      We noticed you left handcrafted frames in your bag. Our seasonal editions are produced in limited batches and reserved for a short window.
                    </p>

                    <!-- Items List -->
                    <div style="margin:24px 0">
                      ${itemsHtml}
                    </div>

                    ${discountCode ? `
                    <!-- Offer Banner -->
                    <div style="background:#FAF8F5;border:1px dashed #D4AF37;border-radius:12px;padding:16px 20px;text-align:center;margin:24px 0">
                      <p style="margin:0;font-size:11px;font-weight:bold;color:#8A6D1C;text-transform:uppercase;letter-spacing:0.15em">Private Atelier Invitation</p>
                      <p style="margin:6px 0;font-size:16px;font-weight:bold;color:#1C2740">Use code <span style="letter-spacing:2px;color:#D4AF37;font-family:monospace">${discountCode}</span> for 10% off</p>
                      <p style="margin:0;font-size:11px;color:#8E929C">Valid on your order for the next 48 hours.</p>
                    </div>
                    ` : ''}

                    <!-- CTA Button -->
                    <div style="text-align:center;margin:32px 0 16px">
                      <a href="${cartUrl}" style="display:inline-block;background:#1C2740;color:#ffffff;text-decoration:none;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.18em;padding:18px 36px;border-radius:50px;box-shadow:0 4px 16px rgba(28,39,64,0.2)">
                        Complete Your Order &rarr;
                      </a>
                    </div>

                    <p style="margin:24px 0 0;text-align:center;font-size:12px;color:#8E929C;line-height:1.5">
                      Need lens calibration advice or a prescription review?<br />
                      Simply reply to this email to consult our optical specialists.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;background:#F9FAF9;border-top:1px solid rgba(0,0,0,0.05);text-align:center">
                    <p style="margin:0;font-size:11px;color:#A0A4AE">© ${new Date().getFullYear()} Jemy Eyewear. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}
