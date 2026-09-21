// src/routes/adminRoutes.js
import express from 'express';
import { pool } from '../db/index.js';
import crypto from 'crypto';
import { sendEmail, getSetPasswordEmailTemplate } from '../services/emailService.js';

const router = express.Router();

// STEP 1: Generate invites (tokens only, no email)
router.post('/generate-invites', async (req, res) => {
  try {
    console.log('📧 Generating invite tokens...');

    // FIXED: Get unique emails only (use MIN or MAX for id)
    const [applications] = await pool.execute(`
      SELECT 
        MIN(a.id) as id,
        a.email,
        MAX(a.full_name) as full_name,
        a.user_id
      FROM bench_club_applications a
      LEFT JOIN users u ON a.email = u.email
      WHERE u.id IS NULL
      GROUP BY a.email
    `);

    console.log(`📧 Found ${applications.length} unique users without accounts`);

    const invites = [];

    for (const app of applications) {
      // ✅ Check if an unused invite already exists for this email
      const [existingInvites] = await pool.execute(
        `SELECT token, expires_at FROM user_invites 
         WHERE email = ? AND used = 0 AND expires_at > NOW()`,
        [app.email]
      );

      let token;
      let expiresAt;

      if (existingInvites.length > 0) {
        // ✅ Reuse existing valid token
        token = existingInvites[0].token;
        expiresAt = existingInvites[0].expires_at;
        console.log(`♻️ Reusing existing invite for ${app.email}`);
      } else {
        // ✅ Generate new token
        token = crypto.randomBytes(32).toString('hex');
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // ✅ Delete any old used/expired invites for this email
        await pool.execute(
          'DELETE FROM user_invites WHERE email = ?',
          [app.email]
        );

        // ✅ Insert new invite
        await pool.execute(
          `INSERT INTO user_invites (email, token, application_id, used, expires_at) 
           VALUES (?, ?, ?, 0, ?)`,
          [app.email, token, app.id, expiresAt]
        );

        console.log(`✨ Generated new invite for ${app.email}`);
      }

      const link = `https://login.ntygear.com/set-password?token=${token}`;

      invites.push({
        email: app.email,
        name: app.full_name,
        token,
        link,
        emailSent: false,
        error: null,
      });
    }

    res.json({
      success: true,
      message: `${invites.length} unique invite tokens generated. Ready to send emails.`,
      data: invites,
    });

  } catch (error) {
    console.error('Generate invites error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate invites.',
    });
  }
});

// ✅ STEP 2: Bulk Send Emails (FIXED - No duplicates)
router.post('/send-bulk-invites', async (req, res) => {
  try {
    const { emails } = req.body;

    console.log('📤 Sending bulk invites...');

    let query = `
      SELECT 
        ui.email,
        ui.token,
        ui.expires_at,
        MIN(ui.application_id) as application_id
      FROM user_invites ui
      WHERE ui.used = 0 AND ui.expires_at > NOW()
    `;
    const params = [];

    if (emails && emails.length > 0) {
      query += ` AND ui.email IN (${emails.map(() => '?').join(',')})`;
      params.push(...emails);
    }

    // ✅ GROUP BY email to ensure only ONE invite per email
    query += ' GROUP BY ui.email';

    const [invites] = await pool.execute(query, params);

    console.log(`📤 Found ${invites.length} unique invites to send`);

    if (invites.length === 0) {
      return res.json({
        success: true,
        message: 'No pending invites to send.',
        data: { total: 0, sent: 0, failed: 0, results: [] },
      });
    }

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const invite of invites) {
      try {
        // Get user's name
        const [apps] = await pool.execute(
          'SELECT full_name FROM bench_club_applications WHERE email = ? LIMIT 1',
          [invite.email]
        );

        const name = apps[0]?.full_name || 'Member';
        const link = `https://login.ntygear.com/set-password?token=${invite.token}`;

        const template = getSetPasswordEmailTemplate(name, link);
        await sendEmail(invite.email, template);

        sentCount++;
        results.push({
          email: invite.email,
          name,
          sent: true,
          error: null,
        });

        console.log(`✅ Invite sent to ${invite.email}`);

        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (emailError) {
        failedCount++;
        results.push({
          email: invite.email,
          name: 'Unknown',
          sent: false,
          error: emailError instanceof Error ? emailError.message : 'Email failed',
        });
        console.error(`❌ Failed to send to ${invite.email}:`, emailError);
      }
    }

    res.json({
      success: true,
      message: `${sentCount} emails sent, ${failedCount} failed`,
      data: {
        total: invites.length,
        sent: sentCount,
        failed: failedCount,
        results,
      },
    });

  } catch (error) {
    console.error('Bulk send error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send emails.',
    });
  }
});

// ✅ STEP 3: Send Single Invite
router.post('/send-invite', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required.',
      });
    }

    const [invites] = await pool.execute(
      `SELECT email, token, expires_at 
       FROM user_invites 
       WHERE email = ? AND used = 0 AND expires_at > NOW()`,
      [email]
    );

    if (invites.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid invite found for this email. Generate first.',
      });
    }

    const invite = invites[0];

    const [apps] = await pool.execute(
      'SELECT full_name FROM bench_club_applications WHERE email = ? LIMIT 1',
      [email]
    );

    const name = apps[0]?.full_name || 'Member';
    const link = `https://login.ntygear.com/set-password?token=${invite.token}`;

    const template = getSetPasswordEmailTemplate(name, link);
    await sendEmail(email, template);

    res.json({
      success: true,
      message: `Invite sent to ${email}`,
    });

  } catch (error) {
    console.error('Send invite error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invite.',
    });
  }
});

// ✅ Get all pending invites (already generated)
router.get('/pending-invites', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        ui.email,
        ui.token,
        ui.expires_at,
        ui.used,
        a.full_name as name
      FROM user_invites ui
      LEFT JOIN bench_club_applications a ON a.email = ui.email
      WHERE ui.used = 0 AND ui.expires_at > NOW()
      GROUP BY ui.email
      ORDER BY ui.created_at DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Fetch pending invites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending invites.',
    });
  }
});

export default router;