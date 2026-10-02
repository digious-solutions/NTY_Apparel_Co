CREATE TABLE `affiliate_referrals` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `affiliate_id` INT UNSIGNED NOT NULL,
  `shopify_order_id` VARCHAR(50) DEFAULT NULL,
  `shopify_order_number` VARCHAR(50) DEFAULT NULL,
  `customer_email` VARCHAR(255) DEFAULT NULL,
  `coupon_code` VARCHAR(50) DEFAULT NULL,
  `order_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `commission_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `commission_percent` DECIMAL(5,2) DEFAULT NULL,
  `status` ENUM('pending','approved','paid','cancelled') DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_order_affiliate` (`shopify_order_id`, `affiliate_id`),
  KEY `idx_affiliate_id` (`affiliate_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;