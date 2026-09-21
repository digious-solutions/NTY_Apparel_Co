// src/routes/affiliateRoutes.js
import express from 'express';
import { pool } from '../db/index.js';
import crypto from 'crypto';
import { sendEmail, getAffiliateApprovedEmailTemplate } from '../services/emailService.js';
import { createShopifyDiscount } from '../services/shopifyService.js';

const router = express.Router();

// ✅ Generate unique referral code
const generateCode = (name) => {
  const clean = (name || 'AFF').replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean}${random}`;
};

// ============================================
// PUBLIC: Submit Application
// ============================================
router.post('/apply', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      socialHandles,
      instagramFollowers,
      tiktokFollowers,
      totalFollowersRange,
      platformInfo,
      howDidYouFind,
      additionalNotes,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !socialHandles || !howDidYouFind) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be filled.',
      });
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if already applied
    const [existing] = await pool.execute(
      'SELECT id, status FROM affiliate_applications WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      [normalizedEmail]
    );

    if (existing.length > 0 && existing[0].status === 'pending') {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending application.',
      });
    }

    if (existing.length > 0 && existing[0].status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'You are already an approved affiliate.',
      });
    }

    // Parse social handles for Instagram/TikTok
    const igMatch = socialHandles.match(/@([a-zA-Z0-9._]+)/);
    const instagramHandle = igMatch ? igMatch[1] : null;

    // Insert application
    const [result] = await pool.execute(
      `INSERT INTO affiliate_applications 
       (name, first_name, last_name, email, phone, social_handles, 
        instagram_handle, instagram_followers, tiktok_followers, 
        total_followers_range, platform_info, how_did_you_find, additional_notes, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        fullName,
        firstName.trim().substring(0, 60),
        lastName.trim().substring(0, 60),
        normalizedEmail,
        phone.trim().substring(0, 30),
        socialHandles.trim().substring(0, 200),
        instagramHandle,
        instagramFollowers ? parseInt(instagramFollowers, 10) : null,
        tiktokFollowers ? parseInt(tiktokFollowers, 10) : null,
        totalFollowersRange || null,
        platformInfo ? platformInfo.trim().substring(0, 1000) : null,
        howDidYouFind,
        additionalNotes ? additionalNotes.trim().substring(0, 1000) : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! We\'ll review it within 48 hours.',
      data: {
        id: result.insertId,
        status: 'pending',
      },
    });

  } catch (error) {
    console.error('Affiliate apply error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.',
    });
  }
});

// ============================================
// ADMIN: Get All Applications
// ============================================
router.get('/admin/applications', async (req, res) => {
  try {
    const { status } = req.query;

    let query = 'SELECT * FROM affiliate_applications';
    const params = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications.',
    });
  }
});

// ============================================
// ADMIN: Approve Application (with Shopify)
// ============================================
router.post('/admin/applications/:id/approve', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { code, discountPercent, commissionPercent } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Referral code is required.',
      });
    }

    const finalCode = code.trim().toUpperCase();
    const finalDiscount = parseFloat(discountPercent) || 10;
    const finalCommission = parseFloat(commissionPercent) || 15;

    await connection.beginTransaction();

    // Get application
    const [apps] = await connection.execute(
      'SELECT * FROM affiliate_applications WHERE id = ? AND status = "pending"',
      [id]
    );

    if (apps.length === 0) {
      throw new Error('Application not found or already processed');
    }

    const app = apps[0];

    // Check if code already exists
    const [existingCode] = await connection.execute(
      'SELECT id FROM affiliates WHERE referral_code = ?',
      [finalCode]
    );

    if (existingCode.length > 0) {
      throw new Error('This referral code is already in use.');
    }

    // Create affiliate
    const [affResult] = await connection.execute(
      `INSERT INTO affiliates 
       (application_id, name, email, phone, instagram_handle, instagram_followers, 
        tiktok_followers, referral_code, status, approved_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW())`,
      [
        app.id,
        app.name,
        app.email,
        app.phone,
        app.instagram_handle,
        app.instagram_followers,
        app.tiktok_followers,
        finalCode,
      ]
    );

    const affiliateId = affResult.insertId;

    // ✅ Create Shopify Discount Code
    let shopifyPriceRuleId = null;
    let shopifyDiscountCodeId = null;
    let shopifyError = null;

    try {
      const shopifyResult = await createShopifyDiscount({
        code: finalCode,
        discountPercent: finalDiscount,
        title: `${app.name} - Affiliate Discount`,
      });

      shopifyPriceRuleId = shopifyResult.priceRuleId;
      shopifyDiscountCodeId = shopifyResult.discountCodeId;

      console.log(`✅ Shopify discount created: ${finalCode}`);
    } catch (error) {
      shopifyError = error.message;
      console.error(`❌ Shopify discount failed for ${finalCode}:`, error.message);
      // Continue - we'll save the affiliate even if Shopify fails
    }

    // Create coupon link
    await connection.execute(
      `INSERT INTO affiliate_coupon_links 
       (affiliate_id, code, discount_percent, commission_percent, 
        shopify_price_rule_id, shopify_discount_code_id, active) 
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [affiliateId, finalCode, finalDiscount, finalCommission, shopifyPriceRuleId, shopifyDiscountCodeId]
    );

    // Update application status
    await connection.execute(
      'UPDATE affiliate_applications SET status = "approved", reviewed_at = NOW() WHERE id = ?',
      [id]
    );

    await connection.commit();

    // ✅ Send approval email (in background)
    const link = `https://ntygear.com/?ref=${finalCode}`;
    const template = getAffiliateApprovedEmailTemplate(
      app.first_name || app.name,
      finalCode,
      link,
      finalDiscount,
      finalCommission
    );

    sendEmail(app.email, template).catch((err) => {
      console.error('Email send failed:', err);
    });

    res.json({
      success: true,
      message: `Affiliate approved! Code: ${finalCode}`,
      data: {
        affiliateId,
        code: finalCode,
        discountPercent: finalDiscount,
        commissionPercent: finalCommission,
        shopify: {
          created: !!shopifyDiscountCodeId,
          error: shopifyError,
        },
      },
    });

  } catch (error) {
    await connection.rollback();
    console.error('Approve error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve affiliate.',
    });
  } finally {
    connection.release();
  }
});

// ============================================
// ADMIN: Reject Application
// ============================================
router.post('/admin/applications/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'UPDATE affiliate_applications SET status = "rejected", reviewed_at = NOW() WHERE id = ? AND status = "pending"',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found or already processed.',
      });
    }

    res.json({
      success: true,
      message: 'Application rejected.',
    });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject application.',
    });
  }
});

// ============================================
// ADMIN: Get All Affiliates (Approved)
// ============================================
router.get('/admin/affiliates', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        a.*,
        acl.discount_percent,
        acl.commission_percent,
        acl.shopify_discount_code_id,
        acl.uses_count,
        acl.active
       FROM affiliates a
       LEFT JOIN affiliate_coupon_links acl ON acl.affiliate_id = a.id
       WHERE a.status = 'approved'
       ORDER BY a.earnings DESC`
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Fetch affiliates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliates.',
    });
  }
});

// ============================================
// ADMIN: Get All Coupons
// ============================================
router.get('/admin/coupons', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        acl.*,
        a.name as affiliate_name,
        a.email as affiliate_email
       FROM affiliate_coupon_links acl
       LEFT JOIN affiliates a ON a.id = acl.affiliate_id
       ORDER BY acl.created_at DESC`
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coupons.',
    });
  }
});

// ============================================
// ADMIN: Toggle Coupon Active Status
// ============================================
router.put('/admin/coupons/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const [coupons] = await pool.execute(
      'SELECT active FROM affiliate_coupon_links WHERE id = ?',
      [id]
    );

    if (coupons.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found.',
      });
    }

    const newStatus = coupons[0].active ? 0 : 1;

    await pool.execute(
      'UPDATE affiliate_coupon_links SET active = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: newStatus ? 'Coupon enabled.' : 'Coupon disabled.',
      data: { active: newStatus },
    });
  } catch (error) {
    console.error('Toggle coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle coupon.',
    });
  }
});

export default router;