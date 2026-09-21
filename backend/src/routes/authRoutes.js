// src/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/index.js';
import { sendEmail, getOTPEmailTemplate } from '../services/emailService.js'; 

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRY = '7d';

// Helper: Generate JWT Token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

// Helper: Get User Role
const getUserRole = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT role FROM users WHERE id = ?',
    [userId]
  );
  const users = Array.isArray(rows) ? rows : [];
  return users[0]?.role || 'customer';
};

// ✅ Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      });
    }

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, role, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [name.trim(), email.toLowerCase(), hashedPassword, 'customer']
    );

    const userId = result && result.insertId ? result.insertId : null;

    // Generate token
    const token = generateToken(userId, email.toLowerCase(), 'customer');

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        user: {
          id: userId,
          name: name.trim(),
          email: email.toLowerCase(),
          role: 'customer',
        },
        token,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account. Please try again.',
    });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    // Get user
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    const users = Array.isArray(rows) ? rows : [];
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      success: true,
      message: 'Welcome back!',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sign in. Please try again.',
    });
  }
});

// ✅ Get Current User (from token)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      const [rows] = await pool.execute(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [decoded.id]
      );

      const users = Array.isArray(rows) ? rows : [];
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: {
          user: users[0],
          token,
        },
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
});

// ✅ Check if user is admin
router.get('/check-role/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const role = await getUserRole(parseInt(userId, 10));

    res.json({
      success: true,
      isAdmin: role === 'admin',
      role,
    });
  } catch (error) {
    console.error('Check role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check role',
    });
  }
});

// src/routes/authRoutes.ts

// ✅ Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required.',
      });
    }

    // Check if user exists
    const [rows] = await pool.execute(
      'SELECT id, name FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email.',
      });
    }

    const user = rows[0];

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP in database
    await pool.execute(
      `INSERT INTO password_resets (email, otp, expires_at) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?`,
      [email.toLowerCase(), otp, expiresAt, otp, expiresAt]
    );

    // ✅ SEND EMAIL WITH OTP (FIXED)
    try {
      const template = getOTPEmailTemplate(otp, user.name || 'User');
      await sendEmail(email, template);
      console.log(`✅ OTP sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Email send error:', emailError);
      return res.status(502).json({
        success: false,
        error: 'Email provider rejected the OTP email. Please try again later.',
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP.',
    });
  }
});

// ✅ Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required.',
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW()',
      [email.toLowerCase(), otp]
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP.',
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP.',
    });
  }
});

// ✅ Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      });
    }

    // Verify OTP
    const [rows] = await pool.execute(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW()',
      [email.toLowerCase(), otp]
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP.',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, email.toLowerCase()]
    );

    // Delete OTP record
    await pool.execute(
      'DELETE FROM password_resets WHERE email = ?',
      [email.toLowerCase()]
    );

    res.json({
      success: true,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password.',
    });
  }
});

// ✅ Verify invite token
router.get('/verify-invite/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const [rows] = await pool.execute(
      `SELECT email, application_id, used, expires_at 
       FROM user_invites 
       WHERE token = ? AND used = 0 AND expires_at > NOW()`,
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired invite link.',
      });
    }

    res.json({
      success: true,
      data: {
        email: rows[0].email,
        application_id: rows[0].application_id,
      },
    });
  } catch (error) {
    console.error('Verify invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify invite.',
    });
  }
});

// ✅ Set password with invite token
router.post('/set-password', async (req, res) => {
  try {
    const { token, name, password } = req.body;

    if (!token || !name || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      });
    }

    // Verify token
    const [invites] = await pool.execute(
      `SELECT email, application_id 
       FROM user_invites 
       WHERE token = ? AND used = 0 AND expires_at > NOW()`,
      [token]
    );

    if (!invites.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired invite link.',
      });
    }

    const invite = invites[0];

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [invite.email]
    );

    let userId;

    if (existingUsers.length > 0) {
      // User exists - update password
      userId = existingUsers[0].id;
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.execute(
        'UPDATE users SET password_hash = ?, name = ? WHERE id = ?',
        [hashedPassword, name.trim(), userId]
      );
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.execute(
        `INSERT INTO users (name, email, password_hash, role, created_at) 
         VALUES (?, ?, ?, 'customer', NOW())`,
        [name.trim(), invite.email, hashedPassword]
      );
      userId = result.insertId;
    }

    // ✅ Link applications to this user
    await pool.execute(
      `UPDATE bench_club_applications 
       SET user_id = ? 
       WHERE email = ? AND user_id IS NULL`,
      [userId, invite.email]
    );

    // ✅ Link members to this user
    await pool.execute(
      `UPDATE bench_club_members 
       SET user_id = ? 
       WHERE email = ? AND user_id IS NULL`,
      [userId, invite.email]
    );

    // Mark invite as used
    await pool.execute(
      'UPDATE user_invites SET used = 1 WHERE token = ?',
      [token]
    );

    // Generate JWT token
    const jwt = (await import('jsonwebtoken')).default;
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
    const authToken = jwt.sign(
      { id: userId, email: invite.email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Password set successfully!',
      data: {
        user: {
          id: userId,
          name: name.trim(),
          email: invite.email,
          role: 'customer',
        },
        token: authToken,
      },
    });

  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set password.',
    });
  }
});


export default router;