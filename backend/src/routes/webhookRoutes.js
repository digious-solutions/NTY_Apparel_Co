// src/routes/webhookRoutes.js
import express from 'express';
import { pool } from '../db/index.js';
import crypto from 'crypto';

const router = express.Router();

// ✅ Verify Shopify webhook
const verifyShopifyWebhook = (req, res, next) => {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!hmac || !secret) {
    return res.status(401).send('Unauthorized');
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(req.body, 'utf8')
    .digest('base64');

  if (hash !== hmac) {
    return res.status(401).send('Unauthorized');
  }

  next();
};

// ✅ Shopify Order Created Webhook
router.post('/shopify/order-created', express.raw({ type: 'application/json' }), verifyShopifyWebhook, async (req, res) => {
  try {
    const order = JSON.parse(req.body.toString());
    const orderId = String(order.id);
    const orderTotal = parseFloat(order.total_price);
    const discountCodes = order.discount_codes || [];

    console.log(`📦 Order received: ${orderId}, Total: $${orderTotal}`);
    console.log(`🎟️ Discount codes:`, discountCodes);

    // Check if any discount code is an affiliate code
    for (const dc of discountCodes) {
      const code = dc.code.toUpperCase();

      // Find affiliate by code
      const [coupons] = await pool.execute(
        `SELECT acl.id as coupon_id, acl.affiliate_id, acl.commission_percent, a.id as aff_id, a.name, a.email
         FROM affiliate_coupon_links acl
         JOIN affiliates a ON a.id = acl.affiliate_id
         WHERE acl.code = ? AND acl.active = 1`,
        [code]
      );

      if (coupons.length > 0) {
        const coupon = coupons[0];
        const commissionAmount = (orderTotal * coupon.commission_percent) / 100;

        // Record referral
        await pool.execute(
          `INSERT INTO referral_tracking 
           (affiliate_id, referral_code, shopify_order_id, order_total, commission_amount, status) 
           VALUES (?, ?, ?, ?, ?, 'pending')`,
          [coupon.affiliate_id, code, orderId, orderTotal, commissionAmount]
        );

        // Update affiliate earnings
        await pool.execute(
          'UPDATE affiliates SET earnings = earnings + ?, total_uses = total_uses + 1 WHERE id = ?',
          [commissionAmount, coupon.affiliate_id]
        );

        // Update coupon usage
        await pool.execute(
          'UPDATE affiliate_coupon_links SET uses_count = uses_count + 1 WHERE id = ?',
          [coupon.coupon_id]
        );

        console.log(`✅ Referral tracked: ${code} - Commission: $${commissionAmount.toFixed(2)}`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

export default router;