-- ============================================================================
-- SAMPLE USERS WITH MEMBERSHIP
-- ============================================================================
-- Insert sample users untuk testing membership vouchers
-- ============================================================================

-- Member Silver
INSERT INTO users (name, email, password, phone, role, is_admin, membership_tier, membership_status, membership_start_date, membership_expiry_date, status, created_at, updated_at) 
VALUES 
('John Silver Member', 'john.silver@example.com', '$2a$10$yIZvLmeVhJl2DTvpDVJkUenYjdBgEeFHLDTQDiJvJSZNILdvgYDJ6', '08123456789', 'user', 0, 'silver', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'active', NOW(), NOW());

-- Member Gold
INSERT INTO users (name, email, password, phone, role, is_admin, membership_tier, membership_status, membership_start_date, membership_expiry_date, status, created_at, updated_at) 
VALUES 
('Jane Gold Member', 'jane.gold@example.com', '$2a$10$yIZvLmeVhJl2DTvpDVJkUenYjdBgEeFHLDTQDiJvJSZNILdvgYDJ6', '08987654321', 'user', 0, 'gold', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 'active', NOW(), NOW());

-- Member Platinum
INSERT INTO users (name, email, password, phone, role, is_admin, membership_tier, membership_status, membership_start_date, membership_expiry_date, status, created_at, updated_at) 
VALUES 
('Alex Platinum VIP', 'alex.platinum@example.com', '$2a$10$yIZvLmeVhJl2DTvpDVJkUenYjdBgEeFHLDTQDiJvJSZNILdvgYDJ6', '08111222333', 'user', 0, 'platinum', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 2 YEAR), 'active', NOW(), NOW());

-- Non-member (expired membership)
INSERT INTO users (name, email, password, phone, role, is_admin, membership_tier, membership_status, membership_start_date, membership_expiry_date, status, created_at, updated_at) 
VALUES 
('Bob Expired', 'bob.expired@example.com', '$2a$10$yIZvLmeVhJl2DTvpDVJkUenYjdBgEeFHLDTQDiJvJSZNILdvgYDJ6', '08444555666', 'user', 0, 'silver', 'expired', DATE_SUB(NOW(), INTERVAL 6 MONTH), DATE_SUB(NOW(), INTERVAL 1 MONTH), 'active', NOW(), NOW());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check users with membership
-- SELECT id, name, membership_tier, membership_status, membership_expiry_date FROM users WHERE membership_tier != 'none' ORDER BY id;

-- ============================================================================
-- END OF SAMPLE USERS
-- ============================================================================
