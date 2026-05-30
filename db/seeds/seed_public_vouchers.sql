-- ============================================================================
-- PUBLIC VOUCHERS - Available for all users (no membership required)
-- ============================================================================

-- Public: 3% discount for any booking (no membership required)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PUBLIC_3PCT', 'percent', 3, 300000, 'global', 'none', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1000, 0, 'active', 'Diskon 3% untuk semua pengguna', NOW(), NOW());

-- Public: Rp50k cashback (no membership required)
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('PUBLIC_CASHBACK50K', 'fixed', 50000, 1000000, 'global', 'none', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 500, 0, 'active', 'Cashback Rp50k untuk booking minimum Rp1jt', NOW(), NOW());

-- Public: Welcome discount for new bookings
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, start_date, expiry_date, usage_limit, used_count, status, description, created_at, updated_at) 
VALUES 
('WELCOME2024', 'percent',  .5, 400000, 'global', 'none', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 2000, 0, 'active', 'Diskon selamat datang 5% untuk semua pengguna baru', NOW(), NOW());
