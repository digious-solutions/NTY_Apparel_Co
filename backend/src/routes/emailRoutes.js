// src/routes/emailRoutes.ts
import express from 'express';
import {
  sendEmail,
  getOTPEmailTemplate,
  getBenchClubReceivedEmail,
  getBenchClubApprovedEmail,
  getDeadliftApprovedEmail,
  getApplicationRejectedEmail,
  getLiftName,
  verifyEmailConnection,
} from '../services/emailService.js';

const router = express.Router();

// ✅ Test Email Connection
router.get('/test', async (req, res) => {
  const connected = await verifyEmailConnection();
  res.json({
    success: connected,
    message: connected ? 'SMTP connected successfully' : 'SMTP connection failed',
  });
});

// ✅ Send OTP Email
router.post('/send-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required.',
      });
    }

    const template = getOTPEmailTemplate(otp);
    await sendEmail(email, template);

    res.json({
      success: true,
      message: 'OTP sent successfully.',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP email.',
    });
  }
});

// ✅ Send Bench Club Application Received Email
router.post('/bench-club-received', async (req, res) => {
  try {
    const { email, name, liftType } = req.body;

    if (!email || !name || !['Bench Press', 'Deadlift'].includes(liftType)) {
      return res.status(400).json({
        success: false,
        error: 'Email, name, and a valid lift type are required.',
      });
    }

    const template = getBenchClubReceivedEmail(name);
    await sendEmail(email, template);

    res.json({
      success: true,
      message: 'Application received email sent.',
    });
  } catch (error) {
    console.error('Send bench club email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send confirmation email.',
    });
  }
});


// Bench Club Status Update Email
router.post('/bench-club-status', async (req, res) => {
  try {
    const { email, name, status, liftType } = req.body;

    if (!email || !name || !status || !['Bench Press', 'Deadlift'].includes(liftType)) {
      return res.status(400).json({
        success: false,
        error: 'Email, name, status, and a valid lift type are required.',
      });
    }

    let template;

    if (status === 'approved') {
      template = getLiftName(liftType) === 'Bench Press'
        ? getBenchClubApprovedEmail(name)
        : getDeadliftApprovedEmail(name);
    } else if (status === 'rejected') {
      template = getApplicationRejectedEmail(name, liftType);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "approved" or "rejected".',
      });
    }

    await sendEmail(email, template);

    res.json({
      success: true,
      message: `Status update email sent to ${email}`,
    });
  } catch (error) {
    console.error('Send bench club status email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send status email.',
    });
  }
});

// src/routes/emailRoutes.ts

// ✅ Welcome Email Template
const getWelcomeEmailTemplate = (name) => {
  const subject = `👋 Welcome to NATTY Apparel, ${name}!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to NATTY Apparel</title>
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #B8860B; }
        .header h1 { font-size: 24px; color: #1a1a1a; margin: 0; }
        .header span { color: #B8860B; }
        .content { padding: 30px 0; }
        .content h2 { color: #1a1a1a; font-size: 22px; margin-bottom: 15px; }
        .content p { color: #555; font-size: 15px; line-height: 1.8; }
        .features { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
        .feature { flex: 1; min-width: 120px; background: #f8f4e8; padding: 12px; border-radius: 8px; text-align: center; }
        .feature span { font-size: 24px; display: block; margin-bottom: 5px; }
        .feature p { font-size: 12px; color: #666; margin: 0; }
        .button { display: inline-block; background: #B8860B; color: white; padding: 14px 35px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NTY <span>APPAREL</span></h1>
          <p style="color: #666; font-size: 14px; margin: 5px 0 0;">Built for the natural athlete</p>
        </div>
        <div class="content">
          <h2>👋 Welcome, ${name}!</h2>
          <p>Thank you for joining the <strong>NTY Apparel</strong> community. You're now part of a movement built for natural athletes who earn their strength the hard way.</p>

          <p style="text-align: center; margin-top: 25px;">
            <a href="https://ntygear.com" class="button" style="color:white">Start Exploring</a>
          </p>
          <p style="text-align: center; font-size: 13px; color: #888; margin-top: 10px;">
            Check your dashboard for exclusive merchandise.
          </p>
        </div>
        <div class="footer">
          <p>NTY Apparel &bull; Built for the natural athlete</p>
          <p style="margin-top: 5px;">© ${new Date().getFullYear()} NTY Apparel. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
    NTY APPAREL - Welcome to the Community!

    Hey ${name},

    Thank you for joining NTY Apparel! You're now part of a movement built for natural athletes who earn their strength the hard way.

    Check your dashboard: https://ntygear.com/account

    NTY Apparel - Built for the natural athlete
  `;
  return { subject, html, text };
};

// ✅ Welcome Email Route
router.post('/welcome', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required.',
      });
    }

    const template = getWelcomeEmailTemplate(name);
    await sendEmail(email, template);

    res.json({
      success: true,
      message: `Welcome email sent to ${email}`,
    });
  } catch (error) {
    console.error('Send welcome email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send welcome email.',
    });
  }
});

export default router;