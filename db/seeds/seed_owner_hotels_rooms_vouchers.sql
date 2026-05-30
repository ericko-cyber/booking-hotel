-- ============================================================================
-- SEED: Owners, Hotels, Rooms, Vouchers, Users (except admin)
-- ============================================================================
-- Usage: mysql -u <user> -p <database> < db/seeds/seed_owner_hotels_rooms_vouchers.sql
-- NOTE: Re-runnable inserts assume no unique collisions on emails/codes; adjust as needed.
-- ============================================================================

-- Password hash used for all sample users (bcrypt for "password123")
SET @sample_pw = '$2a$10$yIZvLmeVhJl2DTvpDVJkUenYjdBgEeFHLDTQDiJvJSZNILdvgYDJ6';

-- -----------------------------
-- Insert Owner Users
-- -----------------------------
INSERT INTO users (name, email, password, phone, role, is_admin, status, created_at, updated_at)
VALUES
('Owner Sinta', 'owner.sinta@example.com', @sample_pw, '08110001111', 'owner', 0, 'active', NOW(), NOW()),
('Owner Budi', 'owner.budi@example.com', @sample_pw, '08110002222', 'owner', 0, 'active', NOW(), NOW());

-- Capture owner ids
SET @owner_sinta = (SELECT id FROM users WHERE email = 'owner.sinta@example.com' LIMIT 1);
SET @owner_budi  = (SELECT id FROM users WHERE email = 'owner.budi@example.com' LIMIT 1);

-- -----------------------------
-- Insert Regular Users (customers)
-- -----------------------------
INSERT INTO users (name, email, password, phone, role, is_admin, status, created_at, updated_at)
VALUES
('Customer Rina', 'rina.customer@example.com', @sample_pw, '08119998877', 'user', 0, 'active', NOW(), NOW()),
('Customer Agus', 'agus.customer@example.com', @sample_pw, '08116667755', 'user', 0, 'active', NOW(), NOW());

SET @user_rina = (SELECT id FROM users WHERE email = 'rina.customer@example.com' LIMIT 1);
SET @user_agus = (SELECT id FROM users WHERE email = 'agus.customer@example.com' LIMIT 1);

-- -----------------------------
-- Insert Hotels for owners
-- -----------------------------
INSERT INTO hotels (name, owner_id, location, address, city, province, country, image, suasana, rating, review_count, status, total_rooms, amenities, category, created_at, updated_at)
VALUES
('Ulumuddini Residence', @owner_sinta, 'Mataram City Center', 'Jl. Pejanggik No. 10', 'Mataram', 'Nusa Tenggara Barat', 'Indonesia', '/uploads/hotels/ulumuddini.jpg', 'Perkotaan', 4.6, 12, 'approved', 3, JSON_ARRAY('wifi','ac','tv'), 'business', NOW(), NOW()),
('Sea Breeze Hotel', @owner_budi, 'Pantai Senggigi', 'Jl. Pantai No. 5', 'Lombok', 'Nusa Tenggara Barat', 'Indonesia', '/uploads/hotels/seabreeze.jpg', 'Pesisir', 4.2, 8, 'approved', 5, JSON_ARRAY('pool','parking','wifi'), 'resort', NOW(), NOW());

-- Get hotel ids
SET @hotel_ulumu = (SELECT id FROM hotels WHERE name = 'Ulumuddini Residence' AND owner_id = @owner_sinta LIMIT 1);
SET @hotel_seab  = (SELECT id FROM hotels WHERE name = 'Sea Breeze Hotel' AND owner_id = @owner_budi LIMIT 1);

-- -----------------------------
-- Insert Rooms for each hotel
-- -----------------------------
INSERT INTO rooms (hotel_id, name, description, capacity, price, currency, stock, booked_count, facilities, room_type, status, created_at, updated_at)
VALUES
(@hotel_ulumu, 'Standard Room', 'Kamar standar nyaman untuk 2 orang', 2, 350000, 'IDR', 2, 0, JSON_OBJECT(), 'double', 'available', NOW(), NOW()),
(@hotel_ulumu, 'Deluxe Room', 'Kamar deluxe dengan pemandangan kota', 3, 450000, 'IDR', 1, 0, JSON_OBJECT(), 'deluxe', 'available', NOW(), NOW()),
(@hotel_seab,  'Seaview Suite', 'Suite dengan pemandangan laut', 4, 750000, 'IDR', 2, 0, JSON_OBJECT(), 'suite', 'available', NOW(), NOW()),
(@hotel_seab,  'Budget Room', 'Kamar ekonomis', 2, 250000, 'IDR', 3, 0, JSON_OBJECT(), 'single', 'available', NOW(), NOW());

-- -----------------------------
-- Insert Vouchers (global and hotel-specific)
-- -----------------------------
INSERT INTO vouchers (code, type, value, min_booking_amount, scope, membership_tier, hotel_id, room_type, start_date, expiry_date, usage_limit, used_count, status, description, created_by, created_at, updated_at)
VALUES
('WELCOME10', 'percent', 10, 0, 'global', 'none', NULL, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 1000, 0, 'active', '10% welcome voucher for all users', @owner_sinta, NOW(), NOW()),
('ULUMU50K', 'fixed', 50000, 200000, 'hotel', 'none', @hotel_ulumu, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 3 MONTH), 200, 0, 'active', 'Rp50.000 off for Ulumuddini Residence', @owner_sinta, NOW(), NOW()),
('SEAB20', 'percent', 20, 500000, 'hotel', 'none', @hotel_seab, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 2 MONTH), 100, 0, 'active', '20% off Seaview Suite bookings', @owner_budi, NOW(), NOW());

-- -----------------------------
-- Verify sample inserts (queries commented)
-- -----------------------------
-- SELECT id, name, email, role FROM users WHERE email LIKE 'owner.%' OR email LIKE '%.customer@example.com';
-- SELECT id, name, owner_id FROM hotels WHERE owner_id IN (@owner_sinta, @owner_budi);
-- SELECT id, name, hotel_id, price, stock FROM rooms WHERE hotel_id IN (@hotel_ulumu, @hotel_seab);
-- SELECT id, code, scope, hotel_id, created_by FROM vouchers WHERE code IN ('WELCOME10','ULUMU50K','SEAB20');

-- ============================================================================
-- End of seed
-- ============================================================================
