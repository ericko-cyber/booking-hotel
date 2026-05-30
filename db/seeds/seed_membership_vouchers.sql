-- ============================================================================
-- MEMBERSHIP VOUCHERS - Exclusive Discounts for Member Tiers
-- ============================================================================
-- Insert vouchers for different membership levels
-- ============================================================================

-- ============================================================================
-- SILVER MEMBERSHIP VOUCHERS
-- ============================================================================

-- Silver: 5% discount on any hotel
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('SILVER_5PCT', 'percent', 5, 500000, 'global', 'silver', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 500, 0, 'active', 'Member Silver - Diskon 5% untuk semua hotel', NOW(), NOW());

-- Silver: Rp100k cashback for booking at partner hotels
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('SILVER_CASHBACK100K', 'fixed', 100000, 1500000, 'global', 'silver', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 300, 0, 'active', 'Member Silver - Cashback Rp100k untuk booking minimum Rp1.5jt', NOW(), NOW());

-- Silver: Early booking discount (20 days before)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('SILVER_EARLYBOOK', 'percent', 8, 800000, 'global', 'silver', NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 250, 0, 'active', 'Member Silver - Early Booking 8% (20 hari sebelum check-in)', NOW(), NOW());

-- ============================================================================
-- GOLD MEMBERSHIP VOUCHERS
-- ============================================================================

-- Gold: 10% discount on any hotel
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('GOLD_10PCT', 'percent', 10, 500000, 'global', 'gold', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 500, 0, 'active', 'Member Gold - Diskon 10% untuk semua hotel', NOW(), NOW());

-- Gold: Rp200k cashback for premium bookings
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('GOLD_CASHBACK200K', 'fixed', 200000, 2000000, 'global', 'gold', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 400, 0, 'active', 'Member Gold - Cashback Rp200k untuk booking minimum Rp2jt', NOW(), NOW());

-- Gold: Suite room exclusive 15% discount
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, room_type, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('GOLD_SUITE_15PCT', 'percent', 15, 1000000, 'room_type', 'gold', 'suite', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 200, 0, 'active', 'Member Gold - Diskon 15% khusus kamar Suite', NOW(), NOW());

-- Gold: Weekend special (Friday-Sunday)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('GOLD_WEEKEND12PCT', 'percent', 12, 700000, 'global', 'gold', NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 300, 0, 'active', 'Member Gold - Weekend Special 12% discount', NOW(), NOW());

-- Gold: Long stay discount (3+ nights)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('GOLD_LONGSTAY', 'fixed', 150000, 1800000, 'global', 'gold', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 250, 0, 'active', 'Member Gold - Diskon Rp150k untuk menginap 3+ malam', NOW(), NOW());

-- ============================================================================
-- PLATINUM MEMBERSHIP VOUCHERS
-- ============================================================================

-- Platinum: 15% discount on any hotel
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PLATINUM_15PCT', 'percent', 15, 500000, 'global', 'platinum', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 600, 0, 'active', 'Member Platinum - Diskon 15% untuk semua hotel + free breakfast', NOW(), NOW());

-- Platinum: Rp500k cashback for premium bookings
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PLATINUM_CASHBACK500K', 'fixed', 500000, 3000000, 'global', 'platinum', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 400, 0, 'active', 'Member Platinum - Cashback Rp500k untuk booking minimum Rp3jt', NOW(), NOW());

-- Platinum: Deluxe room exclusive 20% discount
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, room_type, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PLATINUM_DELUXE_20PCT', 'percent', 20, 1200000, 'room_type', 'platinum', 'deluxe', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 200, 0, 'active', 'Member Platinum - Diskon 20% khusus kamar Deluxe', NOW(), NOW());

-- Platinum: Presidential suite access with upgrade benefit
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, room_type, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PLATINUM_PRESIDENTIAL_25PCT', 'percent', 25, 2000000, 'room_type', 'platinum', 'presidential', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 150, 0, 'active', 'Member Platinum - Diskon 25% khusus Presidential Suite + upgrade room', NOW(), NOW());

-- Platinum: Any time booking discount (super flexible)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PLATINUM_ANYTIME18PCT', 'percent', 18, 600000, 'global', 'platinum', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 500, 0, 'active', 'Member Platinum - Anytime discount 18% (last-minute friendly)', NOW(), NOW());

-- Platinum: Long stay premium (3+ nights, higher benefit)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PLATINUM_LONGSTAY_PREMIUM', 'fixed', 400000, 2500000, 'global', 'platinum', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 300, 0, 'active', 'Member Platinum - Diskon Rp400k untuk menginap 3+ malam + free airport transfer', NOW(), NOW());

-- Platinum: Birthday month special (whole month)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PLATINUM_BIRTHDAY_MONTH', 'fixed', 600000, 2000000, 'global', 'platinum', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 200, 0, 'active', 'Member Platinum - Birthday Month Special Rp600k cashback', NOW(), NOW());

-- ============================================================================
-- SPECIAL LIMITED TIME PROMOTIONS (All Members)
-- ============================================================================

-- Flash Sale - All members (limited 7 days)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('FLASH_MEMBER_20', 'percent', 20, 700000, 'global', 'none', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 100, 0, 'active', 'Flash Sale Member - Diskon 20% terbatas 7 hari (NO TIER REQUIRED)', NOW(), NOW());

-- ============================================================================
-- HOTEL SPECIFIC MEMBERSHIP VOUCHERS (If specific partnerships)
-- ============================================================================

-- Silver tier at Hotel ID 1 (Partner Hotel) - 7% additional
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, hotel_id, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('SILVER_HOTEL1_7PCT', 'percent', 7, 600000, 'hotel', 'silver', 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 250, 0, 'active', 'Member Silver - Extra 7% di Hotel Partner (Hotel ID: 1)', NOW(), NOW());

-- Gold tier at Hotel ID 2 (Premium Partner) - 12% additional
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, hotel_id, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('GOLD_HOTEL2_12PCT', 'percent', 12, 800000, 'hotel', 'gold', 2, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 200, 0, 'active', 'Member Gold - Extra 12% di Premium Hotel Partner (Hotel ID: 2)', NOW(), NOW());

-- Platinum tier at Hotel ID 1 & 2 (All Partner Hotels) - 15% additional + amenities
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, hotel_id, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PLATINUM_PARTNER_15PCT', 'percent', 15, 1000000, 'hotel', 'platinum', 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 300, 0, 'active', 'Member Platinum - Extra 15% di semua Partner Hotels + complimentary benefits', NOW(), NOW());

-- ============================================================================
-- COMBO VOUCHERS (Stacking benefits for members)
-- ============================================================================

-- Group booking member silver (5+ rooms = 8% discount)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('SILVER_GROUP_BOOKING', 'percent', 8, 2000000, 'global', 'silver', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 100, 0, 'active', 'Member Silver - Group Booking (5+ rooms) Diskon 8%', NOW(), NOW());

-- Group booking member gold (5+ rooms = 12% discount)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('GOLD_GROUP_BOOKING', 'percent', 12, 2500000, 'global', 'gold', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 150, 0, 'active', 'Member Gold - Group Booking (5+ rooms) Diskon 12%', NOW(), NOW());

-- Group booking member platinum (5+ rooms = 18% discount)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PLATINUM_GROUP_BOOKING', 'percent', 18, 3000000, 'global', 'platinum', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 200, 0, 'active', 'Member Platinum - Group Booking (5+ rooms) Diskon 18% + free coordinator', NOW(), NOW());

-- ============================================================================
-- REFERRAL MEMBER VOUCHERS
-- ============================================================================

-- Referral reward for silver member (give to new member they refer)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('REFER_SILVER_WELCOME', 'fixed', 75000, 500000, 'global', 'silver', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 500, 0, 'active', 'Referral Reward - Welcome voucher Rp75k untuk member baru yang direferensikan', NOW(), NOW());

-- Referral reward for gold member (higher benefit)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('REFER_GOLD_WELCOME', 'fixed', 150000, 800000, 'global', 'gold', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 400, 0, 'active', 'Referral Reward - Welcome voucher Rp150k untuk member baru yang direferensikan', NOW(), NOW());

-- Referral reward for platinum member (premium benefit)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('REFER_PLATINUM_WELCOME', 'fixed', 300000, 1000000, 'global', 'platinum', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 300, 0, 'active', 'Referral Reward - Welcome voucher Rp300k untuk member baru yang direferensikan', NOW(), NOW());

-- ============================================================================
-- END OF MEMBERSHIP VOUCHERS SEED
-- ============================================================================
