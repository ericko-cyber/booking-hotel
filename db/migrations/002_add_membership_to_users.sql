-- ============================================================================
-- MIGRATION: Add Membership columns to USERS table
-- ============================================================================
-- Purpose: Enable membership tier tracking for voucher eligibility
-- Created: 2026-05-05
-- 
-- MEMBERSHIP LOGIC:
-- - membership_tier: Defines tier level (none, silver, gold, platinum)
-- - membership_status: Controls access
--   * active: Can use membership-exclusive vouchers
--   * inactive/suspended/expired: Can ONLY use public vouchers (membership_tier='none')
-- 
-- VOUCHER ACCESS RULES:
-- 1. Public voucher (membership_tier='none'): Everyone can use
-- 2. Silver/Gold/Platinum voucher:
--    - Require: membership_status='active' AND membership_tier matching tier
--    - Require: NOW() BETWEEN membership_start_date AND membership_expiry_date
-- ============================================================================

-- Add membership_tier column
ALTER TABLE users 
ADD COLUMN membership_tier ENUM('none','silver','gold','platinum') DEFAULT 'none' AFTER role;

-- Add membership_status column (controls access)
ALTER TABLE users 
ADD COLUMN membership_status ENUM('inactive','active','suspended','expired') DEFAULT 'inactive' AFTER membership_tier;

-- Add membership start date
ALTER TABLE users 
ADD COLUMN membership_start_date DATETIME NULL AFTER membership_status;

-- Add membership expiry date
ALTER TABLE users 
ADD COLUMN membership_expiry_date DATETIME NULL AFTER membership_start_date;

-- Add index for membership queries
ALTER TABLE users 
ADD INDEX idx_membership_tier (membership_tier);

ALTER TABLE users 
ADD INDEX idx_membership_status (membership_status);

-- Add CHECK constraint
ALTER TABLE users 
ADD CONSTRAINT chk_membership_dates 
  CHECK (
    membership_start_date IS NULL OR membership_expiry_date IS NULL OR 
    membership_start_date <= membership_expiry_date
  );

-- ============================================================================
-- HELPER FUNCTION: Check if user has active membership
-- ============================================================================
DELIMITER //

DROP FUNCTION IF EXISTS is_membership_active//

CREATE FUNCTION is_membership_active(p_user_id INT) 
RETURNS BOOLEAN 
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_is_active BOOLEAN DEFAULT FALSE;
  
  SELECT 
    CASE 
      WHEN u.membership_status = 'active' 
        AND u.membership_tier != 'none'
        AND NOW() BETWEEN IFNULL(u.membership_start_date, NOW()) AND IFNULL(u.membership_expiry_date, NOW())
      THEN TRUE
      ELSE FALSE
    END INTO v_is_active
  FROM users u
  WHERE u.id = p_user_id;
  
  RETURN COALESCE(v_is_active, FALSE);
END//

DELIMITER ;

-- ============================================================================
-- SEED DATA: Assign membership tiers to existing users
-- ============================================================================

-- Admin user - Platinum tier (full access)
UPDATE users 
SET membership_tier = 'platinum', 
    membership_status = 'active',
    membership_start_date = '2026-01-01',
    membership_expiry_date = '2027-01-01'
WHERE id = 1 AND role = 'admin';

-- Regular user (ihya) - Silver tier (trial active)
UPDATE users 
SET membership_tier = 'silver', 
    membership_status = 'active',
    membership_start_date = NOW(),
    membership_expiry_date = DATE_ADD(NOW(), INTERVAL 3 MONTH)
WHERE id = 2 AND role = 'user';

-- Hotel owner - Gold tier (partner incentive, ACTIVE)
UPDATE users 
SET membership_tier = 'gold', 
    membership_status = 'active',
    membership_start_date = '2026-04-30',
    membership_expiry_date = '2027-04-30'
WHERE id = 3 AND role = 'owner';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify)
-- ============================================================================

-- Show updated users with membership info
-- SELECT id, name, role, membership_tier, membership_status, membership_start_date, membership_expiry_date FROM users;

-- Show ACTIVE members (can use membership vouchers)
-- SELECT id, name, membership_tier, membership_status FROM users 
-- WHERE membership_status = 'active' AND membership_tier != 'none';

-- Show INACTIVE members (can ONLY use public vouchers)
-- SELECT id, name, membership_tier, membership_status FROM users 
-- WHERE membership_status != 'active' OR membership_tier = 'none';

-- Test is_membership_active function
-- SELECT id, name, is_membership_active(id) as has_active_membership FROM users;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
