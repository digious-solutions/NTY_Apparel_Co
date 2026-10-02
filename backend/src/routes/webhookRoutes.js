// src/routes/webhookRoutes.js
import express from 'express';
import { pool } from '../db/index.js';
import crypto from 'crypto';

const router = express.Router();

// ✅ Verify Shopify webhook
const verifyShopifyWebhook = (req, res, next) => {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!hmac || !secret || !Buffer.isBuffer(req.body)) {
    return res.status(401).send('Unauthorized');
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('base64');

  if (hash !== hmac) {
    return res.status(401).send('Unauthorized');
  }

  next();
};

// ✅ Shopify Order Created Webhook
router.post('/shopify/order-created', verifyShopifyWebhook, async (req, res) => {
  try {
    const order = JSON.parse(req.body.toString('utf8'));
    const orderId = String(order.id);
    const orderTotal = parseFloat(order.total_price) || 0;
    const orderNumber = String(order.name || order.order_number || '');
    const customerEmail = order.email || order.contact_email || null;
    const discountCodes = order.discount_codes || [];

    console.log(`📦 Order received: ${orderId}, Total: $${orderTotal}`);
    console.log(`🎟️ Discount codes:`, discountCodes);

    const connection = await pool.getConnection();
    const processed = [];

    try {
      await connection.beginTransaction();

      // Check if any discount code is an affiliate code
      for (const dc of discountCodes) {
        const code = String(dc.code || '').toUpperCase().trim();
        if (!code) continue;

        const [coupons] = await connection.execute(
          `SELECT acl.id as coupon_id, acl.affiliate_id, acl.commission_percent
           FROM affiliate_coupon_links acl
           WHERE acl.code = ? AND acl.active = 1`,
          [code]
        );

        if (coupons.length === 0) continue;

        const coupon = coupons[0];
        const [existing] = await connection.execute(
          `SELECT id FROM affiliate_referrals
           WHERE shopify_order_id = ? AND affiliate_id = ?`,
          [orderId, coupon.affiliate_id]
        );
        if (existing.length > 0) continue;

        const commissionPercent = Number(coupon.commission_percent) || 0;
        const commissionAmount = Number((orderTotal * commissionPercent / 100).toFixed(2));

        await connection.execute(
          `INSERT INTO affiliate_referrals
           (affiliate_id, shopify_order_id, shopify_order_number, customer_email,
            coupon_code, order_amount, commission_amount, commission_percent, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
          [coupon.affiliate_id, orderId, orderNumber, customerEmail, code,
            orderTotal, commissionAmount, commissionPercent]
        );

        await connection.execute(
          `INSERT INTO referral_tracking
           (affiliate_id, referral_code, shopify_order_id, order_total, commission_amount, status)
           VALUES (?, ?, ?, ?, ?, 'pending')`,
          [coupon.affiliate_id, code, orderId, orderTotal, commissionAmount]
        );

        await connection.execute(
          'UPDATE affiliates SET earnings = earnings + ?, total_uses = total_uses + 1 WHERE id = ?',
          [commissionAmount, coupon.affiliate_id]
        );

        await connection.execute(
          'UPDATE affiliate_coupon_links SET uses_count = uses_count + 1 WHERE id = ?',
          [coupon.coupon_id]
        );

        processed.push(code);
        console.log(`✅ Referral tracked: ${code} - Commission: $${commissionAmount.toFixed(2)}`);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    if (processed.length === 0) {
      return res.status(200).json({ skipped: true, reason: 'no new affiliate referrals' });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

export default router;