// src/services/shopifyService.js
import fetch from 'node-fetch';

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_URL || 'ntygear.myshopify.com';
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

  // ✅ Step 1: Create Price Rule
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
      // Optional: Set end date
      // ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
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

  // ✅ Step 2: Create Discount Code
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
 * Disable/Delete a Shopify Discount
 */
export const disableShopifyDiscount = async (priceRuleId) => {
  if (!SHOPIFY_ACCESS_TOKEN || !priceRuleId) {
    throw new Error('Missing required parameters');
  }

  const baseUrl = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}`;

  const response = await fetch(`${baseUrl}/price_rules/${priceRuleId}.json`, {
    method: 'DELETE',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete price rule: ${response.status}`);
  }

  console.log(`✅ Shopify price rule deleted: ${priceRuleId}`);
  return true;
};