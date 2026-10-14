-- Applications table
CREATE TABLE bench_club_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    instagram_handle VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    lift_type VARCHAR(50) NOT NULL,
    weight_tier INT NOT NULL,
    video_url TEXT NOT NULL,
    video_public_id VARCHAR(255) DEFAULT NULL,
    additional_notes TEXT DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    age_group VARCHAR(10) DEFAULT NULL,
    parent_guardian_email VARCHAR(255) DEFAULT NULL,
    media_permission BOOLEAN NOT NULL DEFAULT FALSE,
    footage_approved_for_promo BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMP NULL DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- Members table
CREATE TABLE bench_club_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    weight_tier INT NOT NULL,
    member_number INT UNIQUE NOT NULL,
    application_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES bench_club_applications(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_member_number (member_number)
);