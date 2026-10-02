-- ============================================
-- AFFILIATE APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    first_name VARCHAR(60),
    last_name VARCHAR(60),
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    social_handles VARCHAR(200),
    instagram_handle VARCHAR(100),
    instagram_followers INT,
    tiktok_handle VARCHAR(100),
    tiktok_followers INT,
    total_followers_range VARCHAR(50),
    platform_info TEXT,
    how_did_you_find VARCHAR(100),
    additional_notes TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- ============================================
-- AFFILIATES TABLE (Approved)
-- ============================================
CREATE TABLE IF NOT EXISTS affiliates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    application_id INT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    instagram_handle VARCHAR(100),
    instagram_followers INT,
    tiktok_handle VARCHAR(100),
    tiktok_followers INT,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    earnings DECIMAL(10, 2) DEFAULT 0,
    total_uses INT DEFAULT 0,
    status ENUM('approved', 'suspended', 'inactive') DEFAULT 'approved',
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_code (referral_code),
    FOREIGN KEY (application_id) REFERENCES affiliate_applications(id) ON DELETE SET NULL
);

-- ============================================
-- AFFILIATE COUPON LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_coupon_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    affiliate_id INT NOT NULL,
    code VARCHAR(50) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 10,
    commission_percent DECIMAL(5, 2) DEFAULT 15,
    shopify_price_rule_id VARCHAR(100),
    shopify_discount_code_id VARCHAR(100),
    active TINYINT DEFAULT 1,
    uses_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_affiliate (affiliate_id),
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
);

-- ============================================
-- REFERRAL TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS referral_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    affiliate_id INT NOT NULL,
    referral_code VARCHAR(50) NOT NULL,
    order_id VARCHAR(100),
    shopify_order_id VARCHAR(100),
    order_total DECIMAL(10, 2),
    commission_amount DECIMAL(10, 2),
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_code (referral_code),
    INDEX idx_order (shopify_order_id),
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
);

-- ============================================
-- AFFILIATE PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    affiliate_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    INDEX idx_affiliate (affiliate_id),
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
);