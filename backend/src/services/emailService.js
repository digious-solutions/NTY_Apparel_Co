// src/services/emailService.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.office365.com';
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE_RAW = (process.env.SMTP_SECURE || '').toLowerCase().trim();
const SMTP_SECURE = ['true', '1', 'yes', 'ssl'].includes(SMTP_SECURE_RAW) && SMTP_PORT === 465;
const SMTP_REQUIRES_TLS = ['starttls', 'tls'].includes(SMTP_SECURE_RAW) || (!SMTP_SECURE && SMTP_PORT === 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'noreply@local.test';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'NATTY';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  requireTLS: SMTP_REQUIRES_TLS,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
});

export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
};

export const sendEmail = async (to, template) => {
  try {
    const mailOptions = {
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text || '',
      attachments: template.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
};

export const getOTPEmailTemplate = (otp, expiresInMinutes = 10) => {
  return {
    subject: '🔐 Password Reset OTP - NATTY',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000000; }
          .header h1 { font-size: 24px; color: #1a1a1a; margin: 0; }
          .header span { color: #000000; }
          .otp-box { background-color: #f8f4e8; border: 2px dashed #000000; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a; }
          .info { color: #666666; font-size: 14px; line-height: 1.6; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999999; }
          .highlight { color: #000000; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NATTY <span>APPAREL</span></h1>
            <p style="color: #666; font-size: 14px; margin: 5px 0 0;">Password Reset Request</p>
          </div>

          <div style="padding: 20px 0;">
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">We received a request to reset your password. Use the OTP below to verify your identity:</p>

            <div class="otp-box">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your One-Time Password (OTP) is:</p>
              <div class="otp-code">${otp}</div>
            </div>

            <p style="font-size: 14px; color: #666;">This OTP is valid for <span class="highlight">10 minutes</span>.</p>
            <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
          </div>

          <div class="footer">
            <p>NATTY Apparel &bull; Built for the natural athlete</p>
            <p style="margin-top: 5px;">© ${new Date().getFullYear()} NTY Apparel. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      NTY APPAREL - Password Reset OTP

      Your OTP for password reset is: ${otp}

      This OTP is valid for 10 minutes.

      If you didn't request this, please ignore this email.

      NTY Apparel - Built for the natural athlete
    `,
  };
};

export const getLiftName = (liftType) =>
  String(liftType).trim().toLowerCase() === 'bench press' ? 'Bench Press' : 'Deadlift';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

const emailHtml = (title, preview, content) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 0; background: #f4f4f4; color: #1a1a1a; font-family: Arial, sans-serif; }
      .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all; }
      .container { max-width: 600px; margin: 0 auto; padding: 28px 24px; background: #fff; }
      .brand { margin: 0 0 28px; padding-bottom: 16px; border-bottom: 2px solid #111; font-size: 16px; letter-spacing: 3px; }
      p, li { font-size: 15px; line-height: 1.7; }
      h2 { margin: 28px 0 12px; font-size: 17px; }
      ul { padding-left: 22px; }
      .offer { margin: 18px 0; padding: 16px; background: #f5f5f5; }
      .signoff { margin-top: 28px; }
      a { color: #111; }
    </style>
  </head>
  <body>
    <div class="preheader">${preview}</div>
    <div class="container">
      <p class="brand"><strong>NATTY</strong> APPAREL</p>
      ${content}
    </div>
  </body>
  </html>
`;

const memberDashboard = `
  <h2>YOUR MEMBER DASHBOARD</h2>
  <p>Access your unlocked apparel, view your verified lifts, submit new lifts, and connect with members through our Discord.</p>
  <p><a href="https://login.ntygear.com/auth" style="text-decoration: underline; color: black;"v>View your dashboard</a></p>
`;

const signoff = `
  <p class="signoff">Stay Real. Stay Natty.</p>
  <p>The Natty Team</p>
`;

export const getBenchClubReceivedEmail = (name) => {
  const subject = 'We’ve Received Your Natty Verified Application';
  const preview = 'Your lift has been submitted. Here’s what happens next.';
  const firstName = escapeHtml(name);

  return {
    subject,
    preview,
    html: emailHtml(subject, preview, `
      <p>Hey ${firstName},</p>
      <p>We’ve received your Natty Verified application!</p>
      <p>Our team will review your submission to ensure it meets our verification standards.</p>
      <p>We do our best to review applications within 48 hours, although high submission volume can occasionally cause delays.</p>
      <p>You’ll receive another email once your application has been reviewed.</p>
      <p>Once approved, you’ll officially unlock access to our exclusive Natty Verified apparel.</p>
      <h2>YOUR MEMBER DASHBOARD</h2>
      <p>Visit your dashboard to track your submissions, view your verification status, and submit new lifts.</p>
      <p><a href="https://login.ntygear.com/auth" style="text-decoration: underline; color: black;">View your dashboard</a></p>
      ${signoff}
    `),
    text: `Hey ${name},

We’ve received your Natty Verified application!

Our team will review your submission to ensure it meets our verification standards.

We do our best to review applications within 48 hours, although high submission volume can occasionally cause delays.

You’ll receive another email once your application has been reviewed.

Once approved, you’ll officially unlock access to our exclusive Natty Verified apparel.

YOUR MEMBER DASHBOARD

Visit your dashboard to track your submissions, view your verification status, and submit new lifts.

https://login.ntygear.com/auth

Stay Real. Stay Natty.

The Natty Team`,
  };
};

export const getBenchClubApprovedEmail = (name) => {
  const subject = 'You’re In! Welcome to the Natty Verified Bench Club';
  const preview = 'You’ve earned your spot. Now unlock your exclusive member offer.';
  const firstName = escapeHtml(name);

  return {
    subject,
    preview,
    html: emailHtml(subject, preview, `
      <p>Hey ${firstName},</p>
      <p><strong>Congratulations! You’re officially in!</strong></p>
      <p>We’ve reviewed your lift, and you’re now an official member of the <strong>Natty Verified Bench Press Club!</strong></p>
      <p>Welcome to the club.</p>
      <p>And now you’ve earned something else.</p>
      <p><strong>Exclusive access to Natty Verified apparel.</strong></p>
      <h2>YOUR EXCLUSIVE WELCOME OFFER</h2>
      <p>Our second drop is expected mid to late November, and as a newly verified member, you’re getting a special welcome offer.</p>
      <div class="offer">
        <p><strong>Natty Verified Bench Club Tee</strong></p>
        <p>Regular Price: $55</p>
        <p><strong>Your Price: $40 (Save $15)</strong></p>
        <p>Available in Black and Ivory.</p>
        <p>FREE U.S. shipping.</p>
      </div>
      <h2>PRE-ORDER NOW – PAY IN FULL</h2>
      <p>U.S. ($40):<br><a href="https://buy.stripe.com/aFacMX58Uaa05eJ0JE8IU0e" style="text-decoration: underline; color:black">Order in the U.S.</a></p>
      <p>International ($50, including $10 shipping):<br><a href="https://buy.stripe.com/14A7sDeJueqgcHb2RM8IU0f" style="text-decoration: underline; color:black">International order</a></p>
      <h2>OR RESERVE YOURS FOR $10</h2>
      <p>Not ready to pay in full? Secure your shirt with a $10 reservation and pay the remaining balance later.</p>
      <p><a href="https://buy.stripe.com/3cI5kvgRC6XOfTneAu8IU07" style="text-decoration: underline; color:black">Reserve your tee for $10</a></p>
      <p>Your reservation option totals $45 for U.S. orders, including shipping. International shipping is additional.</p>
      <p>This offer is exclusive to Natty Verified members. Drop 2 is a pre-order, and shipping begins once inventory arrives.</p>
      <h2>MORE THAN JUST CLOTHING</h2>
      <p>We created Natty to be more than another fitness apparel brand. When someone sees you wearing Natty Verified, they know you didn’t just buy your way in.</p>
      <p>You earned it.</p>
      ${memberDashboard}
      <p>Welcome to the club. Wear it with pride.</p>
      ${signoff}
    `),
    text: `Hey ${name},

Congratulations! You’re officially in!

We’ve reviewed your lift, and you’re now an official member of the Natty Verified Bench Press Club!

Welcome to the club.

And now you’ve earned something else.

Exclusive access to Natty Verified apparel.

YOUR EXCLUSIVE WELCOME OFFER

Our second drop is expected mid to late November, and as a newly verified member, you’re getting a special welcome offer.

Natty Verified Bench Club Tee
Regular Price: $55
Your Price: $40 (Save $15)
Available in Black and Ivory.
FREE U.S. shipping.

PRE-ORDER NOW – PAY IN FULL

U.S. ($40):
https://buy.stripe.com/aFacMX58Uaa05eJ0JE8IU0e

International ($50, including $10 shipping):
https://buy.stripe.com/14A7sDeJueqgcHb2RM8IU0f

OR RESERVE YOURS FOR $10

Not ready to pay in full? Secure your shirt with a $10 reservation and pay the remaining balance later.
https://buy.stripe.com/3cI5kvgRC6XOfTneAu8IU07

Your reservation option totals $45 for U.S. orders, including shipping. International shipping is additional.

This offer is exclusive to Natty Verified members. Drop 2 is a pre-order, and shipping begins once inventory arrives.

MORE THAN JUST CLOTHING

We created Natty to be more than another fitness apparel brand. When someone sees you wearing Natty Verified, they know you didn’t just buy your way in.

You earned it.

YOUR MEMBER DASHBOARD

Access your unlocked apparel, view your verified lifts, submit new lifts, and connect with members through our Discord.
https://login.ntygear.com/auth

Welcome to the club. Wear it with pride.

Stay Real. Stay Natty.

The Natty Team`,
  };
};

export const getDeadliftApprovedEmail = (name) => {
  const subject = 'You’re In! Welcome to the Natty Verified Deadlift Club';
  const preview = 'You’ve earned your spot. Now unlock your exclusive member offer.';
  const firstName = escapeHtml(name);

  return {
    subject,
    preview,
    html: emailHtml(subject, preview, `
      <p>Hey ${firstName},</p>
      <p><strong>Congratulations! You’re officially in!</strong></p>
      <p>We’ve reviewed your lift, and you’re now an official member of the <strong>Natty Verified Deadlift Club!</strong></p>
      <p>Welcome to the club.</p>
      <p>And now you’ve earned something else.</p>
      <p><strong>Exclusive access to Natty Verified apparel.</strong></p>
      <h2>YOUR EXCLUSIVE WELCOME OFFER</h2>
      <p>Our first drop of Deadlift Club Shorts is expected mid to late November, and as a newly verified member, you’re getting a special welcome offer.</p>
      <div class="offer">
        <p><strong>Natty Verified Deadlift Club Shorts</strong></p>
        <p>Regular Price: $55</p>
        <p><strong>Your Price: $40 (Save $15)</strong></p>
        <p>Fewer than 100 pairs available.</p>
        <p>FREE U.S. shipping.</p>
      </div>
      <h2>PRE-ORDER NOW – PAY IN FULL</h2>
      <p>U.S. ($40):<br><a href="https://buy.stripe.com/3cI00b6cYfuk8qV7828IU0c" style="text-decoration: underline; color:black">Order in the U.S.</a></p>
      <p>International ($50, shipping included):<br><a href="https://buy.stripe.com/7sYbITdFqaa036BeAu8IU0d" style="text-decoration: underline; color:black">International order</a></p>
      <h2>OR RESERVE YOURS FOR $10</h2>
      <p>Not ready to pay in full? Secure your shorts with a $10 reservation and pay the remaining balance later.</p>
      <p><a href="https://buy.stripe.com/14AeV5gRC2HygXr3VQ8IU09">Reserve your shorts for $10</a></p>
      <p>Your reservation option totals $45 for U.S. orders, including shipping. International shipping is additional.</p>
      <p>This offer is exclusive to Natty Verified members. Your pre-order secures your shorts from our limited first drop, with shipping beginning once inventory arrives.</p>
      <h2>MORE THAN JUST CLOTHING</h2>
      <p>We created Natty to be more than another fitness apparel brand. When someone sees you wearing Natty Verified, they know you didn’t just buy your way in.</p>
      <p>You earned it.</p>
      ${memberDashboard}
      <p>Welcome to the club. Wear it with pride.</p>
      ${signoff}
    `),
    text: `Hey ${name},

Congratulations! You’re officially in!

We’ve reviewed your lift, and you’re now an official member of the Natty Verified Deadlift Club!

Welcome to the club.

And now you’ve earned something else.

Exclusive access to Natty Verified apparel.

YOUR EXCLUSIVE WELCOME OFFER

Our first drop of Deadlift Club Shorts is expected mid to late November, and as a newly verified member, you’re getting a special welcome offer.

Natty Verified Deadlift Club Shorts
Regular Price: $55
Your Price: $40 (Save $15)
Fewer than 100 pairs available.
FREE U.S. shipping.

PRE-ORDER NOW – PAY IN FULL

U.S. ($40):
https://buy.stripe.com/3cI00b6cYfuk8qV7828IU0c

International ($50, shipping included):
https://buy.stripe.com/7sYbITdFqaa036BeAu8IU0d

OR RESERVE YOURS FOR $10

Not ready to pay in full? Secure your shorts with a $10 reservation and pay the remaining balance later.
https://buy.stripe.com/14AeV5gRC2HygXr3VQ8IU09

Your reservation option totals $45 for U.S. orders, including shipping. International shipping is additional.

This offer is exclusive to Natty Verified members. Your pre-order secures your shorts from our limited first drop, with shipping beginning once inventory arrives.

MORE THAN JUST CLOTHING

We created Natty to be more than another fitness apparel brand. When someone sees you wearing Natty Verified, they know you didn’t just buy your way in.

You earned it.

YOUR MEMBER DASHBOARD

Access your unlocked apparel, view your verified lifts, submit new lifts, and connect with members through our Discord.
https://login.ntygear.com/auth

Welcome to the club. Wear it with pride.

Stay Real. Stay Natty.

The Natty Team`,
  };
};

const rejectionRequirements = {
  bench: [
    'Must be a natural lifter.',
    'Standard barbell bench press only. No Smith machines.',
    'Bar must touch the chest.',
    'Full lockout required.',
    'No spotter assistance.',
    'No slingshots or supportive bench shirts.',
    'No excessive bouncing or hip thrusting.',
    'Weight plates must be clearly visible.',
    'Full, unedited lift video required.',
  ],
  deadlift: [
    'Must be a natural lifter.',
    'Lift must begin with the barbell on the floor.',
    'Conventional and sumo deadlifts are allowed.',
    'Full lockout required, including hips and knees.',
    'Straps and belts are allowed.',
    'No rack pulls, Romanian deadlifts, or trap/hex bars.',
    'No supportive deadlift suits or hitching.',
    'Weight plates must be clearly visible.',
    'Full, unedited lift video required.',
  ],
};

export const getApplicationRejectedEmail = (name, liftType) => {
  const liftName = getLiftName(liftType);
  const clubName = liftName === 'Bench Press' ? 'Bench Club' : 'Deadlift Club';
  const requirements = liftName === 'Bench Press' ? rejectionRequirements.bench : rejectionRequirements.deadlift;
  const title = `Update on Your Natty Verified ${clubName} Application`;
  const requirementTitle = liftName === 'Bench Press' ? 'BENCH CLUB REQUIREMENTS' : 'DEADLIFT CLUB REQUIREMENTS';
  const firstName = escapeHtml(name);

  return {
    subject: title,
    preview: `We’ve reviewed your Natty Verified ${clubName} application.`,
    html: emailHtml(title, `We’ve reviewed your Natty Verified ${clubName} application.`, `
      <p>Hey ${firstName},</p>
      <p>We’ve reviewed your Natty Verified ${clubName} application.</p>
      <p>Unfortunately, we weren’t able to approve your submission at this time.</p>
      <p>This doesn’t necessarily mean you aren’t strong enough. It simply means your submitted lift didn’t meet all of our verification requirements.</p>
      <h2>${requirementTitle}</h2>
      <ul>${requirements.map((requirement) => `<li>${requirement}</li>`).join('')}</ul>
      <p>You’re welcome to submit another video that meets these requirements.</p>
      <h2>YOUR MEMBER DASHBOARD</h2>
      <p>Review your submissions, check your status, and submit a new lift here:</p>
      <p><a href="https://login.ntygear.com/auth">View your dashboard</a></p>
      <p>We hope to welcome you to the club soon.</p>
      ${signoff}
    `),
    text: `Hey ${name},

We’ve reviewed your Natty Verified ${clubName} application.

Unfortunately, we weren’t able to approve your submission at this time.

This doesn’t necessarily mean you aren’t strong enough. It simply means your submitted lift didn’t meet all of our verification requirements.

${requirementTitle}

${requirements.map((requirement) => `- ${requirement}`).join('\n')}

You’re welcome to submit another video that meets these requirements.

YOUR MEMBER DASHBOARD

Review your submissions, check your status, and submit a new lift here:

https://login.ntygear.com/auth

We hope to welcome you to the club soon.

Stay Real. Stay Natty.

The Natty Team`,
  };
};

export const getGenericEmail = (subject, content) => {
  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000000; }
          .header h1 { font-size: 24px; color: #1a1a1a; margin: 0; }
          .header span { color: #000000; }
          .content { padding: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NTY <span>APPAREL</span></h1>
          </div>
          <div class="content">${content}</div>
          <div class="footer">
            <p>NTY Apparel &bull; Built for the natural athlete</p>
            <p style="margin-top: 5px;">© ${new Date().getFullYear()} NTY Apparel. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: content.replace(/<[^>]*>/g, ''),
  };
};

export const getSetPasswordEmailTemplate = (name, setPasswordLink) => {
  const subject = `🔐 Set Your NTY Apparel Password, ${name}!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #B8860B; }
        .header h1 { font-size: 24px; color: #1a1a1a; margin: 0; }
        .header span { color: #B8860B; }
        .content { padding: 30px 0; }
        .content h2 { color: #1a1a1a; font-size: 22px; margin-bottom: 15px; }
        .content p { color: #555; font-size: 15px; line-height: 1.8; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; }
        .warning { background: #fff3cd; padding: 12px; border-radius: 5px; color: #856404; font-size: 13px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NTY <span>APPAREL</span></h1>
          <p style="color: #666; font-size: 14px; margin: 5px 0 0;">Set Your Password</p>
        </div>
        <div class="content">
          <h2>Hey ${name},</h2>
          <p>We've upgraded our system! To access your Bench Club dashboard, and exclusive gear, you need to set a password for your account.</p>
          <p>Click the button below to set your password:</p>
          
          <!-- BULLETPROOF BUTTON -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px auto;">
            <tr>
              <td align="center" bgcolor="#B8860B" style="border-radius:5px;">
                <a href="${setPasswordLink}" 
                   target="_blank" 
                   style="display:inline-block; padding:14px 35px; font-family:Arial,sans-serif; font-size:15px; font-weight:bold; color:#ffffff !important; text-decoration:none; border-radius:5px; background-color:#B8860B;">
                  Set My Password
                </a>
              </td>
            </tr>
          </table>
          <div class="warning" style="text-align:center !important;">
            ⏳ This link expires in 7 days.
          </div>
          <div class="warning" style="text-align:center !important;">
            "We're getting close to the full launch of the new site. In the meantime, Bench Club members already have Early Access to their earned Bench Club gear. If you'd like to get yours before the full launch, you can access it here."
          </div>
          <p style="text-align:center !important;">For US members: </p>
           <p style="text-align:center !important;">https://buy.stripe.com/9B68wH0SE0zq22xboi8IU02</p>
          <p style="text-align:center !important;">For international members:</p>
          <p style="text-align:center !important;">https://buy.stripe.com/5kQ3cn7h2fuk4aF63Y8IU06</p>
        </div>
        <div class="footer">
          <p>NTY Apparel &bull; Built for the natural athlete</p>
          <p style="margin-top: 5px;">© ${new Date().getFullYear()} NTY Apparel. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
};

export const getAffiliateApprovedEmailTemplate = (
  name,
  code,
  link,
  discountPercent,
  commissionPercent
) => {
  const subject = `🎉 You're Approved! Your Affiliate Code: ${code}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #B8860B; }
        .header h1 { font-size: 24px; color: #1a1a1a; margin: 0; }
        .header span { color: #B8860B; }
        .content { padding: 30px 0; }
        .content h2 { color: #1a1a1a; font-size: 22px; margin-bottom: 15px; }
        .content p { color: #555; font-size: 15px; line-height: 1.8; }
        .code-box { background: #f8f4e8; border: 2px dashed #B8860B; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a1a; font-family: monospace; }
        .stats { display: flex; gap: 10px; margin: 20px 0; }
        .stat { flex: 1; background: #f8f8f8; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #B8860B; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .button { display: inline-block; background: #B8860B; color: white !important; padding: 14px 35px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NTY <span>APPAREL</span></h1>
          <p style="color: #666; font-size: 14px; margin: 5px 0 0;">Partner Program</p>
        </div>
        <div class="content">
          <h2>🎉 Welcome to the team, ${name}!</h2>
          <p>Your affiliate application has been <strong>approved</strong>. You're now an official NTY Partner!</p>

          <div class="code-box">
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your unique referral code:</p>
            <div class="code">${code}</div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="stat-value">${discountPercent}%</div>
              <div class="stat-label">Customer Discount</div>
            </div>
            <div class="stat">
              <div class="stat-value">${commissionPercent}%</div>
              <div class="stat-label">Your Commission</div>
            </div>
          </div>

          <p><strong>Your referral link:</strong></p>
          <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 13px;">
            ${link}
          </p>

          <p style="text-align: center;">
            <a href="${link}" class="button">Start Sharing</a>
          </p>

          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            <strong>How it works:</strong>
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 2;">
            <li>Share your link or code with your audience</li>
            <li>They get ${discountPercent}% off their order</li>
            <li>You earn ${commissionPercent}% commission on every sale</li>
            <li>Track your earnings in your dashboard</li>
          </ul>
        </div>
        <div class="footer">
          <p>NTY Apparel &bull; Built for the natural athlete</p>
          <p style="margin-top: 5px;">© ${new Date().getFullYear()} NTY Apparel. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
};