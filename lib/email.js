// lib/email.js
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'info@mooiprofessional.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'info@mooiprofessional.com';
const COMPANY_NAME = 'Mooi Professional';

/**
 * Send a simple test email
 */
export async function sendTestEmail(toEmail) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[email] SENDGRID_API_KEY not set');
    return { success: false, reason: 'no_api_key' };
  }

  const msg = {
    to: toEmail,
    from: FROM_EMAIL, // Must be your verified sender
    subject: 'Test Email from Mooi Professional',
    text: 'This is a test email from Mooi Professional. If you received this, email is working!',
    html: '<strong>This is a test email from Mooi Professional.</strong><br><br>If you received this, email is working!',
  };

  try {
    await sgMail.send(msg);
    console.log('[email] Test email sent to:', toEmail);
    return { success: true };
  } catch (error) {
    console.error('[email] Error:', error);
    if (error.response) {
      console.error('[email] Response body:', error.response.body);
    }
    return { success: false, error: error.message, details: error.response?.body };
  }
}

/**
 * Send order confirmation emails to both customer and owner
 */
export async function sendOrderEmails({ order, customerEmail, customerName }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[email] SENDGRID_API_KEY not set, skipping emails');
    return { success: false, reason: 'no_api_key' };
  }

  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
  const orderTotal = order.total || order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Format order items for email
  const itemsList = order.orderItems
    .map(item => `• ${item.product?.name || 'Product'} × ${item.quantity} — ${currency}${item.price}`)
    .join('\n');

  try {
    // Email to Customer
    const customerMsg = {
      to: customerEmail,
      from: FROM_EMAIL,
      subject: `Order Confirmed — ${COMPANY_NAME} #${order.id.slice(-8).toUpperCase()}`,
      text: `
Thank you for your order, ${customerName}!

ORDER ID: #${order.id.slice(-8).toUpperCase()}

ITEMS:
${itemsList}

TOTAL: ${currency}${orderTotal.toLocaleString()}

We're preparing your order and will notify you once it ships.

— The ${COMPANY_NAME} Team
      `.trim(),
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="text-align: center; font-size: 24px; border-bottom: 2px solid #000; padding-bottom: 15px;">
    MOOI<span style="font-weight: 300;">PROFESSIONAL</span>
  </h1>
  <p style="text-align: center; color: #666; font-size: 12px; letter-spacing: 2px;">ORDER #${order.id.slice(-8).toUpperCase()}</p>
  
  <h2 style="margin-top: 30px;">Thank You, ${customerName}!</h2>
  <p>Your order has been confirmed.</p>
  
  <div style="background: #f9f9f9; padding: 20px; margin: 20px 0;">
    <p style="font-weight: bold; margin-bottom: 10px;">ORDER ITEMS:</p>
    ${order.orderItems.map(item => `
      <p style="margin: 5px 0;">${item.product?.name || 'Product'} × ${item.quantity} — ${currency}${item.price}</p>
    `).join('')}
    <p style="font-weight: bold; border-top: 2px solid #000; margin-top: 15px; padding-top: 15px;">
      TOTAL: ${currency}${orderTotal.toLocaleString()}
    </p>
  </div>
  
  <p>We're preparing your order and will notify you once it ships.</p>
  <p style="color: #666; margin-top: 30px;">— The ${COMPANY_NAME} Team</p>
</div>
      `.trim(),
    };

    // Email to Owner
    const ownerMsg = {
      to: OWNER_EMAIL,
      from: FROM_EMAIL,
      subject: `🛒 New Order — #${order.id.slice(-8).toUpperCase()} — ${currency}${orderTotal}`,
      text: `
NEW ORDER RECEIVED

Order ID: #${order.id.slice(-8).toUpperCase()}
Customer: ${customerName} (${customerEmail})

ITEMS:
${itemsList}

TOTAL: ${currency}${orderTotal.toLocaleString()}

SHIPPING ADDRESS:
${order.address?.name || customerName}
${order.address?.street || ''}
${order.address?.city || ''}, ${order.address?.state || ''} ${order.address?.zip || ''}
Phone: ${order.address?.phone || 'N/A'}
      `.trim(),
    };

    // Send both emails
    console.log('[email] Sending customer email to:', customerEmail);
    console.log('[email] Sending owner email to:', OWNER_EMAIL);

    await sgMail.send(customerMsg);
    console.log('[email] Customer email sent');

    await sgMail.send(ownerMsg);
    console.log('[email] Owner email sent');

    return { success: true };

  } catch (error) {
    console.error('[email] Failed to send order emails:', error);
    if (error.response) {
      console.error('[email] Response body:', error.response.body);
    }
    return { success: false, error: error.message, details: error.response?.body };
  }
}
