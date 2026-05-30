-- Seed data: users, hotels, rooms, bookings, payments
-- Usage: mysql -u <user> -p booking_hotel < db/seeds/seed_bookings_payments.sql

SET FOREIGN_KEY_CHECKS = 0;

-- User (id = 2)
INSERT IGNORE INTO users (
  id, name, email, password, phone, role, is_admin,
  profile_image, bio, address, city, province, postal_code, country,
  status, created_at, updated_at
) VALUES (
  2,
  'ihya',
  'e41253394@student.polije.ac.id',
  '$2a$10$bQ.i07BJTxQo/avg77Sdv.yFxzd0rfD8aU.PKXbss4x...',
  NULL,
  'user',
  0,
  NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  'active',
  '2026-04-29 19:08:51',
  '2026-04-29 19:08:51'
);

-- Ensure a hotel exists (id = 5)
INSERT IGNORE INTO hotels (id, name, owner_id, location, status, created_at, updated_at)
VALUES (5, 'Sample Hotel', 2, 'Sample City', 'approved', NOW(), NOW());

-- Ensure rooms exist for hotel 5
INSERT IGNORE INTO rooms (id, hotel_id, name, price, stock, status, created_at, updated_at)
VALUES
(21, 5, 'Kamar Standar', 800000.00, 5, 'available', NOW(), NOW()),
(22, 5, 'Kamar Deluxe', 600000.00, 3, 'available', NOW(), NOW());

-- Bookings using user_id = 2
INSERT IGNORE INTO bookings (
  id, booking_code, user_id, room_id, hotel_id,
  check_in, check_out, nights, guests_count,
  room_rate, subtotal, tax_rate, tax_amount,
  discount_amount, service_fee, total_price,
  voucher_code, voucher_discount, membership_discount,
  status, payment_status, guest_name, guest_email, guest_phone, special_notes, created_at, updated_at
) VALUES
(1004, 'BK-20260504-004', 2, 21, 5, '2026-05-20', '2026-05-22', 2, 2, 800000.00, 1600000.00, 10.0, 160000.00, 0.00, 40000.00, 1800000.00, NULL, 0.00, 0.00, 'confirmed', 'paid', 'ihya', 'e41253394@student.polije.ac.id', NULL, 'Request early check-in', '2026-05-04 12:00:00', '2026-05-04 12:00:00'),
(1005, 'BK-20260504-005', 2, 22, 5, '2026-06-10', '2026-06-13', 3, 1, 600000.00, 1800000.00, 10.0, 180000.00, 0.00, 30000.00, 1653000.00, NULL, 0.00, 0.00, 'pending', 'unpaid', 'ihya', 'e41253394@student.polije.ac.id', NULL, 'Butuh penyesuaian tempat tidur', '2026-05-04 12:05:00', '2026-05-04 12:05:00');

-- Payments referencing the bookings above
INSERT IGNORE INTO payments (
  id, booking_id, amount, payment_method, payment_gateway,
  transaction_id, reference_number, status, proof_image, notes, created_at, updated_at
) VALUES
(2004, 1004, 1800000.00, 'Credit Card', 'Midtrans', 'TXN20260520001', 'REF20260520-004', 'success', NULL, 'Pembayaran penuh via kartu', '2026-05-20 09:30:00', '2026-05-20 09:30:00'),
(2005, 1005, 500000.00, 'Bank Transfer', 'BCA', 'TXN20260610001', 'REF20260610-005', 'pending', NULL, 'Deposit 30% via transfer', '2026-06-01 15:10:00', '2026-06-01 15:10:00');

SET FOREIGN_KEY_CHECKS = 1;

-- End of seed
