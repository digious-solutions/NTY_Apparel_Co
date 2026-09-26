// src/routes/benchClubRoutes.js
import express from 'express';
import { pool } from '../db/index.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// ✅ Authentication Middleware
const authenticateToken = (req, res, next) => {
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
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

// ✅ Cloudinary Upload Function
const uploadToCloudinary = async (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'bench-club',
        public_id: `bench_${Date.now()}_${fileName.split('.')[0]}`,
        eager: [{ format: 'mp4', transformation: [{ quality: 'auto' }] }],
        eager_async: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result?.secure_url || '',
            publicId: result?.public_id || '',
          });
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// ✅ Multer for video upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

// ✅ Video Upload Route
router.post('/upload-video', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required.',
      });
    }

    const { url: videoUrl, publicId: videoPublicId } = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname
    );

    res.json({
      success: true,
      data: {
        video_url: videoUrl,
        public_id: videoPublicId,
      },
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload video.',
    });
  }
});

// ✅ Submit Application
router.post('/apply', authenticateToken, async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      user_id,
      fullName,
      email,
      socialHandle,
      phoneNumber,
      lift,
      weightTier,
      videoUrl,
      additionalNotes,
    } = req.body;

    if (!user_id || !fullName || !email || !socialHandle || !lift || !weightTier || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be filled.',
        required: ['user_id', 'fullName', 'email', 'socialHandle', 'lift', 'weightTier', 'videoUrl'],
      });
    }

    const [userCheck] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE id = ?',
      [user_id]
    );

    const userExists = userCheck[0]?.count > 0;

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please login again.',
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO bench_club_applications 
       (user_id, full_name, email, instagram_handle, phone_number, lift_type, weight_tier, video_url, additional_notes, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user_id,
        fullName.trim().substring(0, 100),
        email.trim().toLowerCase().substring(0, 100),
        socialHandle.trim().substring(0, 50),
        phoneNumber ? phoneNumber.trim().substring(0, 20) : null,
        lift.trim().substring(0, 50),
        parseInt(weightTier, 10) || 0,
        videoUrl.trim().substring(0, 500),
        additionalNotes ? additionalNotes.trim().substring(0, 500) : null,
        'pending',
      ]
    );

    const insertId = result.insertId;
    const responseTime = Date.now() - startTime;

    console.log(`✅ Application submitted in ${responseTime}ms, ID: ${insertId}`);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      data: {
        id: insertId,
        user_id,
        video_url: videoUrl,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Submit Error (${responseTime}ms):`, error);

    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'You have already submitted an application for this tier.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.',
    });
  }
});

// ✅ Get user's applications
router.get('/my-applications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT 
        id, 
        full_name as name, 
        email, 
        instagram_handle, 
        lift_type, 
        weight_tier, 
        video_url, 
        additional_notes as notes, 
        status, 
        created_at 
      FROM bench_club_applications 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Fetch my applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications.',
    });
  }
});

// ✅ Get user's member status
router.get('/my-member', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT 
        id, 
        full_name as name, 
        email, 
        weight_tier, 
        member_number, 
        created_at as approved_at 
      FROM bench_club_members 
      WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      data: rows[0] || null,
    });
  } catch (error) {
    console.error('Fetch member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member status.',
    });
  }
});

// ✅ Get all applications (Admin) - with lift_type filter
router.get('/applications', async (req, res) => {
  try {
    const { status, lift_type } = req.query;

    let query = `
      SELECT 
        id, full_name as name, email, 
        phone_number as phone, instagram_handle, 
        lift_type, weight_tier, video_url, 
        additional_notes as notes, status, created_at
      FROM bench_club_applications
    `;

    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (lift_type) {
      // ✅ "Both" applications bhi dikhao specific club filter par
      conditions.push('(lift_type = ? OR lift_type = ?)');
      params.push(lift_type, 'Both');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch applications.' });
  }
});

// ✅ Approve application (Admin)
router.put('/applications/:id/approve', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [apps] = await connection.execute(
      'SELECT user_id, full_name, email, lift_type, weight_tier FROM bench_club_applications WHERE id = ? AND status = "pending"',
      [id]
    );

    if (!apps.length) {
      throw new Error('Application not found or already processed');
    }

    const app = apps[0];

    // ✅ Check if user already has this tier for SAME lift type
    const [existingMember] = await connection.execute(
      'SELECT id, weight_tier, member_number FROM bench_club_members WHERE user_id = ? AND weight_tier = ? AND lift_type = ?',
      [app.user_id, app.weight_tier, app.lift_type]
    );

    if (existingMember.length > 0) {
      await connection.execute(
        'UPDATE bench_club_applications SET status = ?, updated_at = NOW() WHERE id = ?',
        ['approved', id]
      );

      await connection.commit();

      return res.json({
        success: true,
        data: existingMember[0] || null,
        message: `User already has ${app.weight_tier} lb ${app.lift_type} tier. Application approved!`,
        isDuplicate: true,
      });
    }

    // ✅ Check if user exists with DIFFERENT tier for SAME lift type
    const [existingUser] = await connection.execute(
      'SELECT id, user_id, weight_tier, member_number FROM bench_club_members WHERE user_id = ? AND lift_type = ?',
      [app.user_id, app.lift_type]
    );

    if (existingUser.length > 0) {
      const existing = existingUser[0];

      await connection.execute(
        `UPDATE bench_club_members 
         SET weight_tier = ?, 
             application_id = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [app.weight_tier, id, existing.id]
      );

      await connection.execute(
        'UPDATE bench_club_applications SET status = ?, updated_at = NOW() WHERE id = ?',
        ['approved', id]
      );

      await connection.commit();

      const [memberResult] = await connection.execute(
        'SELECT * FROM bench_club_members WHERE id = ?',
        [existing.id]
      );

      return res.json({
        success: true,
        data: memberResult[0] || null,
        message: `Member upgraded to ${app.weight_tier} lb ${app.lift_type} tier! Member #${String(existing.member_number).padStart(4, '0')}`,
        isUpgrade: true,
      });
    }

    // ✅ New member - Create new
    const [countResult] = await connection.execute(
      'SELECT MAX(member_number) as max_num FROM bench_club_members'
    );
    const nextNumber = (countResult[0]?.max_num || 0) + 1;

    await connection.execute(
      `INSERT INTO bench_club_members 
       (user_id, full_name, email, lift_type, weight_tier, member_number, application_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [app.user_id, app.full_name, app.email, app.lift_type, app.weight_tier, nextNumber, id]
    );

    await connection.execute(
      'UPDATE bench_club_applications SET status = ?, updated_at = NOW() WHERE id = ?',
      ['approved', id]
    );

    await connection.commit();

    const [memberResult] = await connection.execute(
      'SELECT * FROM bench_club_members WHERE application_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: memberResult[0] || null,
      message: `Application approved successfully! Member #${String(nextNumber).padStart(4, '0')}`,
      isUpgrade: false,
    });

  } catch (error) {
    await connection.rollback();
    console.error('Approval error:', error);

    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'This user already has a membership. Please check existing members.',
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve application.',
    });
  } finally {
    connection.release();
  }
});

// ✅ Reject application (Admin)
router.put('/applications/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const [apps] = await pool.execute(
      'SELECT id, user_id, weight_tier, lift_type FROM bench_club_applications WHERE id = ? AND status = "pending"',
      [id]
    );

    if (!apps.length) {
      return res.status(404).json({
        success: false,
        error: 'Application not found or already processed.',
      });
    }

    const app = apps[0];

    const [existingMember] = await pool.execute(
      'SELECT id FROM bench_club_members WHERE user_id = ? AND weight_tier = ? AND lift_type = ?',
      [app.user_id, app.weight_tier, app.lift_type]
    );

    if (existingMember.length > 0) {
      return res.status(400).json({
        success: false,
        error: `User already has ${app.weight_tier} lb ${app.lift_type} tier. Cannot reject.`,
      });
    }

    const [result] = await pool.execute(
      'UPDATE bench_club_applications SET status = ?, updated_at = NOW() WHERE id = ?',
      ['rejected', id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Application not found or already processed');
    }

    res.json({
      success: true,
      message: 'Application rejected successfully.',
    });

  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject application.',
    });
  }
});

// ✅ PUT /api/bench-club/applications/:id
// Sirf pending applications edit ho sakti hain
router.put('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      phone_number,
      instagram_handle,
      lift_type,
      weight_tier,
      additional_notes,
    } = req.body;

    // ✅ Pehle check karo ke application pending hai ya nahi
    const [existing] = await pool.execute(
      'SELECT id, status FROM bench_club_applications WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (existing[0].status !== 'pending') {
      return res.status(403).json({
        success: false,
        error: `Cannot edit ${existing[0].status} applications. Only pending applications can be edited.`,
      });
    }

    // Validation
    if (weight_tier !== undefined) {
      const tier = parseInt(weight_tier, 10);
      if (isNaN(tier) || tier < 0 || tier > 2000) {
        return res.status(400).json({ success: false, error: 'Invalid weight tier' });
      }
    }

    if (lift_type && !['Bench Press', 'Deadlift', 'Both'].includes(lift_type)) {
      return res.status(400).json({ success: false, error: 'Invalid lift type' });
    }

    // ✅ Correct column names
    const [result] = await pool.execute(
      `UPDATE bench_club_applications 
       SET full_name = COALESCE(?, full_name),
           email = COALESCE(?, email),
           phone_number = COALESCE(?, phone_number),
           instagram_handle = COALESCE(?, instagram_handle),
           lift_type = COALESCE(?, lift_type),
           weight_tier = COALESCE(?, weight_tier),
           additional_notes = COALESCE(?, additional_notes)
       WHERE id = ? AND status = 'pending'`,
      [
        full_name || null,
        email ? email.trim().toLowerCase() : null,
        phone_number || null,
        instagram_handle || null,
        lift_type || null,
        weight_tier !== undefined ? parseInt(weight_tier, 10) : null,
        additional_notes !== undefined ? additional_notes : null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Return updated row
    const [rows] = await pool.execute(
      `SELECT 
        id, full_name as name, email, phone_number as phone,
        instagram_handle, lift_type, weight_tier, video_url,
        additional_notes as notes, status, created_at
       FROM bench_club_applications WHERE id = ?`,
      [id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Update application error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Get all members (Admin) - with lift_type filter
router.get('/members', async (req, res) => {
  try {
    const { lift_type } = req.query;

    let query = `
      SELECT 
        id, full_name as name, email, 
        lift_type, weight_tier, 
        member_number, created_at as approved_at
      FROM bench_club_members
    `;

    const params = [];

    if (lift_type) {
      query += ' WHERE (lift_type = ? OR lift_type = ?)';
      params.push(lift_type, 'Both');
    }

    query += ' ORDER BY member_number ASC';

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch members error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch members.' });
  }
});

// ✅ PUT /api/bench-club/members/:id
router.put('/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, lift_type, weight_tier, member_number } = req.body;

    // Validate
    if (lift_type && !['Bench Press', 'Deadlift', 'Both'].includes(lift_type)) {
      return res.status(400).json({ success: false, error: 'Invalid lift type' });
    }
    if (weight_tier !== undefined) {
      const tier = parseInt(weight_tier, 10);
      if (isNaN(tier) || tier < 0 || tier > 2000) {
        return res.status(400).json({ success: false, error: 'Invalid weight tier' });
      }
    }

    // member_number UNIQUE check
    if (member_number !== undefined) {
      const num = parseInt(member_number, 10);
      if (isNaN(num) || num <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid member number' });
      }
      const [existing] = await pool.execute(
        'SELECT id FROM bench_club_members WHERE member_number = ? AND id != ?',
        [num, id]
      );
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Member number ${num} already taken`,
        });
      }
    }

    const [result] = await pool.execute(
      `UPDATE bench_club_members 
       SET full_name = COALESCE(?, full_name),
           email = COALESCE(?, email),
           lift_type = COALESCE(?, lift_type),
           weight_tier = COALESCE(?, weight_tier),
           member_number = COALESCE(?, member_number)
       WHERE id = ?`,
      [
        full_name || null,
        email ? email.trim().toLowerCase() : null,
        lift_type || null,
        weight_tier !== undefined ? parseInt(weight_tier, 10) : null,
        member_number !== undefined ? parseInt(member_number, 10) : null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const [rows] = await pool.execute(
      `SELECT 
        id, full_name as name, email, lift_type, weight_tier, 
        member_number, created_at as approved_at
       FROM bench_club_members WHERE id = ?`,
      [id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Update member error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Member number already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ DELETE /api/bench-club/members/:id
router.delete('/members/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [member] = await pool.execute(
      `SELECT id, full_name, email, lift_type, weight_tier, member_number
       FROM bench_club_members WHERE id = ?`,
      [id]
    );

    if (member.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const m = member[0];

    await pool.execute('DELETE FROM bench_club_members WHERE id = ?', [id]);

    console.log(`🗑️ Member deleted:`, m);

    res.json({
      success: true,
      message: `Member ${m.full_name} (#${String(m.member_number).padStart(4, '0')}) removed`,
    });
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Profile Update Route
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    console.log('📝 Updating profile for user:', userId, { name, email });

    let updateFields = [];
    let values = [];

    if (name !== undefined && name !== null) {
      updateFields.push('name = ?');
      values.push(name.trim());
    }

    if (email !== undefined && email !== null) {
      updateFields.push('email = ?');
      values.push(email.trim().toLowerCase());
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update.',
      });
    }

    values.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    console.log('🔍 Query:', query, 'Values:', values);

    const [result] = await pool.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: rows[0] || null,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile.',
    });
  }
});

export default router;