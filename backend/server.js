import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';

import benchClubRoutes from './src/routes/benchClubRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import emailRoutes from './src/routes/emailRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import affiliateRoutes from './src/routes/affiliateRoutes.js';
import webhookRoutes from './src/routes/webhookRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'https://yourdomain.com', 'https://nty-apparel-co.vercel.app', 'https://login.ntygear.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Multer Configuration for File Upload (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

// Upload to Cloudinary Helper Function
const uploadToCloudinary = async (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'bench-club',
        public_id: `bench_${Date.now()}_${fileName.split('.')[0]}`,
        eager: [
          { format: 'mp4', transformation: [{ quality: 'auto' }] }
        ],
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

app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
app.use('/api/bench-club', benchClubRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/affiliate', affiliateRoutes);


// API Route: Submit Application
app.post('/api/bench-club/apply', upload.single('video'), async (req, res) => {
  try {
    const {
      fullName,
      email,
      socialHandle,
      phoneNumber,
      lift,
      weightTier,
      additionalNotes,
    } = req.body;

    // Validation
    if (!fullName || !email || !socialHandle || !lift || !weightTier) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be filled.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required.',
      });
    }

    // Upload video to Cloudinary
    const { url: videoUrl, publicId: videoPublicId } = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname
    );

    // Insert into MySQL
    const [result] = await pool.execute(
      `INSERT INTO bench_club_applications 
       (full_name, email, instagram_handle, phone_number, lift_type, weight_tier, video_url, video_public_id, additional_notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName.trim(),
        email.trim().toLowerCase(),
        socialHandle.trim(),
        phoneNumber || null,
        lift,
        parseInt(weightTier, 10),
        videoUrl,
        videoPublicId,
        additionalNotes || null,
        'pending',
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      data: {
        id: result.insertId,
        video_url: videoUrl,
      },
    });
  } catch (error) {
    console.error('Submit Error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.',
    });
  }
});

// API Route: Get All Applications (Admin)
app.get('/api/bench-club/applications', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, instagram_handle, lift_type, weight_tier, status, created_at, video_url FROM bench_club_applications ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications.',
    });
  }
});

// API Route: Update Application Status (Admin)
app.put('/api/bench-club/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status value.',
    });
  }

  try {
    await pool.execute(
      'UPDATE bench_club_applications SET status = ? WHERE id = ?',
      [status, id]
    );
    res.json({
      success: true,
      message: 'Status updated successfully.',
    });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status.',
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
