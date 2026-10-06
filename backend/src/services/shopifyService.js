// src/services/shopifyService.js
import fetch from 'node-fetch';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { pool } from '../db/index.js';

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_URL || 'jvkzyq-b1.myshopify.com';
const SHOPIFY_API_VERSION = '2024-10';
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
let tokenRefreshInFlight = null;
let tokenRefreshSchedulerStarted = false;

const getTokenEncryptionKey = () => {
  const key = process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY;
  if (!key || !/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error('SHOPIFY_TOKEN_ENCRYPTION_KEY must be a 64-character hex-encoded key');
  }
  return Buffer.from(key, 'hex');
};

const encryptToken = (token, key) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${ciphertext.toString('hex')}`;
};

const decryptToken = (encryptedToken, key) => {
  const [version, ivHex, authTagHex, ciphertextHex] = encryptedToken.split(':');
  if (version !== 'v1' || !ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Stored Shopify token has an invalid encrypted format');
  }

  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
};

const getShopifyAccessToken = async () => {
  const clientId = process.env.SHOPIFY_API_KEY;
  const clientSecret = process.env.SHOPIFY_API_SECRET;

  if (!clientId || !clientSecret) {
    const staticToken = process.env.SHOPIFY_ACCESS_TOKEN;
    if (staticToken) return staticToken;
    throw new Error('Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET to refresh Shopify tokens');
  }

  const encryptionKey = getTokenEncryptionKey();
  const [rows] = await pool.execute(
    'SELECT access_token, expires_at FROM shopify_access_tokens WHERE id = 1'
  );
  const storedToken = rows[0];
  if (storedToken && new Date(storedToken.expires_at).getTime() > Date.now() + TOKEN_REFRESH_SKEW_MS) {
    try {
      if (storedToken.access_token.startsWith('v1:')) {
        return decryptToken(storedToken.access_token, encryptionKey);
      }

      await pool.execute(
        'UPDATE shopify_access_tokens SET access_token = ? WHERE id = 1',
        [encryptToken(storedToken.access_token, encryptionKey)]
      );
      console.warn('Migrated the stored Shopify token from plaintext to encrypted storage');
      return storedToken.access_token;
    } catch (error) {
      console.warn('Stored Shopify token could not be decrypted; requesting a fresh token:', error.message);
    }
  }

  if (!tokenRefreshInFlight) {
    tokenRefreshInFlight = (async () => {
      const response = await fetch(`https://${SHOPIFY_STORE}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.access_token || !Number(data.expires_in)) {
        throw new Error(`Shopify token request failed: ${JSON.stringify(data)}`);
      }

      const expiresAt = new Date(Date.now() + Number(data.expires_in) * 1000);
      await pool.execute(
        `INSERT INTO shopify_access_tokens (id, access_token, expires_at)
         VALUES (1, ?, ?)
         ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), expires_at = VALUES(expires_at)`,
        [encryptToken(data.access_token, encryptionKey), expiresAt]
      );

      console.log(`Shopify access token renewed; expires at ${expiresAt.toISOString()}`);
      return data.access_token;
    })();
  }

  try {
    return await tokenRefreshInFlight;
  } finally {
    tokenRefreshInFlight = null;
  }
};

export const startShopifyTokenRefresh = () => {
  if (tokenRefreshSchedulerStarted) return;
  tokenRefreshSchedulerStarted = true;

  if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
    console.warn('Shopify auto-refresh disabled: SHOPIFY_API_KEY and SHOPIFY_API_SECRET are required');
    return;
  }

  try {
    getTokenEncryptionKey();
  } catch (error) {
    console.error(`Shopify auto-refresh disabled: ${error.message}`);
    return;
  }

  const scheduleNextRefresh = async () => {
    try {
      await getShopifyAccessToken();
      const [rows] = await pool.execute(
        'SELECT expires_at FROM shopify_access_tokens WHERE id = 1'
      );
      const delay = Math.max(
        1000,
        new Date(rows[0].expires_at).getTime() - Date.now() - TOKEN_REFRESH_SKEW_MS
      );
      const timer = setTimeout(scheduleNextRefresh, delay);
      timer.unref?.();
    } catch (error) {
      console.error('Shopify token refresh scheduling failed:', error.message);
      const timer = setTimeout(scheduleNextRefresh, 5 * 60 * 1000);
      timer.unref?.();
    }
  };

  void scheduleNextRefresh();
};

/**
 * Create a Shopify Price Rule + Discount Code
 */
export const createShopifyDiscount = async ({ code, discountPercent, title }) => {
  const accessToken = await getShopifyAccessToken();

  const baseUrl = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}`;

  const priceRulePayload = {
    price_rule: {
      title: title || `Affiliate Discount - ${code}`,
      target_type: 'line_item',
      target_selection: 'all',
      allocation_method: 'across',
      value_type: 'percentage',
      value: `-${discountPercent}.0`,
      customer_selection: 'all',
      starts_at: new Date().toISOString(),
    },
  };

  console.log('📤 Creating Shopify price rule...');

  const priceRuleResponse = await fetch(`${baseUrl}/price_rules.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify(priceRulePayload),
  });

  if (!priceRuleResponse.ok) {
    const errorText = await priceRuleResponse.text();
    throw new Error(`Shopify price rule failed: ${priceRuleResponse.status} - ${errorText}`);
  }

  const priceRuleData = await priceRuleResponse.json();
  const priceRuleId = priceRuleData.price_rule.id;

  console.log(`✅ Price rule created: ${priceRuleId}`);

  const discountCodePayload = {
    discount_code: {
      code: code.toUpperCase(),
    },
  };

  const discountCodeResponse = await fetch(
    `${baseUrl}/price_rules/${priceRuleId}/discount_codes.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify(discountCodePayload),
    }
  );

  if (!discountCodeResponse.ok) {
    const errorText = await discountCodeResponse.text();
    throw new Error(`Shopify discount code failed: ${discountCodeResponse.status} - ${errorText}`);
  }

  const discountCodeData = await discountCodeResponse.json();
  const discountCodeId = discountCodeData.discount_code.id;

  console.log(`✅ Discount code created: ${code} (ID: ${discountCodeId})`);

  return {
    priceRuleId: String(priceRuleId),
    discountCodeId: String(discountCodeId),
    code: code.toUpperCase(),
  };
};

/**
 * Disable (expire) a Shopify Discount — NOT delete
 * Sets ends_at to a past date so it expires immediately
 * but retains the record in Shopify admin.
 */
export const disableShopifyDiscount = async (priceRuleId) => {
  if (!priceRuleId) {
    throw new Error('Missing required parameters');
  }
  const accessToken = await getShopifyAccessToken();

  const baseUrl = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}`;

  // ends_at ko 1 minute pehle set karo — Shopify ise "expired" treat karega
  const pastDate = new Date(Date.now() - 60 * 1000).toISOString();

  const response = await fetch(`${baseUrl}/price_rules/${priceRuleId}.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      price_rule: {
        id: Number(priceRuleId),
        ends_at: pastDate,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to expire price rule: ${response.status} - ${errorText}`);
  }

  console.log(`✅ Shopify price rule expired (disabled): ${priceRuleId}`);
  return true;
};

/**
 * OPTIONAL: Re-enable a Shopify Discount
 * Clears ends_at so the discount works again.
 */
export const enableShopifyDiscount = async (priceRuleId) => {
  if (!priceRuleId) {
    throw new Error('Missing required parameters');
  }
  const accessToken = await getShopifyAccessToken();

  const baseUrl = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}`;

  const response = await fetch(`${baseUrl}/price_rules/${priceRuleId}.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      price_rule: {
        id: Number(priceRuleId),
        ends_at: null, // ya future date
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to enable price rule: ${response.status} - ${errorText}`);
  }

  console.log(`✅ Shopify price rule re-enabled: ${priceRuleId}`);
  return true;
};