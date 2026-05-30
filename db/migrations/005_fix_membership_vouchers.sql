-- ============================================================================
-- FIX: Add Membership-Tier Vouchers
-- ============================================================================
-- Update existing vouchers to have proper membership tiers
-- This allows showing membership-specific vouchers with tier restrictions

-- Update GOLD_SUITE_15PCT to require GOLD membership
UPDATE vouchers SET membership_tier = 'gold' WHERE code = 'GOLD_SUITE_15PCT';

-- Update PLATINUM_PRESIDENTIAL_25PCT to require PLATINUM membership  
UPDATE vouchers SET membership_tier = 'platinum' WHERE code = 'PLATINUM_PRESIDENTIAL_25PCT';

-- Keep FLASH_MEMBER_20 and TEST010 as public (membership_tier = 'none')

-- Add more membership tier specific vouchers
INSERT IGNORE INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('SILVER_5PCT', 'percent', 5, 500000, 'global', 'silver', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 500, 0, 'active', 'Member Silver - Diskon 5% untuk semua hotel', NOW(), NOW()),
('GOLD_10PCT', 'percent', 10, 500000, 'global', 'gold', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 500, 0, 'active', 'Member Gold - Diskon 10% untuk semua hotel', NOW(), NOW()),
('PLATINUM_15PCT', 'percent', 15, 500000, 'global', 'platinum', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 600, 0, 'active', 'Member Platinum - Diskon 15% untuk semua hotel + free breakfast', NOW(), NOW());
