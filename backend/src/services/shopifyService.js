// src/services/shopifyService.js
import fetch from 'node-fetch';

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_URL || 'jvkzyq-b1.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = '2024-10';

/**
 * Create a Shopify Price Rule + Discount Code
 */
export const createShopifyDiscount = async ({ code, discountPercent, title }) => {
  if (!SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify access token not configured');
  }

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
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
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
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
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
  if (!SHOPIFY_ACCESS_TOKEN || !priceRuleId) {
    throw new Error('Missing required parameters');
  }

  const baseUrl = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}`;

  // ends_at ko 1 minute pehle set karo — Shopify ise "expired" treat karega
  const pastDate = new Date(Date.now() - 60 * 1000).toISOString();

  const response = await fetch(`${baseUrl}/price_rules/${priceRuleId}.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
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
  if (!SHOPIFY_ACCESS_TOKEN || !priceRuleId) {
    throw new Error('Missing required parameters');
  }

  const baseUrl = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}`;

  const response = await fetch(`${baseUrl}/price_rules/${priceRuleId}.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
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