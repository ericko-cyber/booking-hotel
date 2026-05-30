-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 23, 2026 at 04:18 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `booking_hotel`
--

-- --------------------------------------------------------

--
-- Table structure for table `benefit_membership`
--

CREATE TABLE `benefit_membership` (
  `id` int NOT NULL,
  `type` enum('discount','voucher') NOT NULL DEFAULT 'discount',
  `title` varchar(150) NOT NULL,
  `description` text,
  `discount_percent` decimal(5,2) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT NULL,
  `voucher_id` int DEFAULT NULL,
  `membership_tier` enum('none','silver','gold','platinum') DEFAULT 'none',
  `scope` enum('global','hotel','room_type') DEFAULT 'global',
  `hotel_id` int DEFAULT NULL,
  `room_type` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `usage_limit` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `status` enum('active','inactive','expired') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `benefit_membership`
--

INSERT INTO `benefit_membership` (`id`, `type`, `title`, `description`, `discount_percent`, `discount_amount`, `voucher_id`, `membership_tier`, `scope`, `hotel_id`, `room_type`, `start_date`, `expiry_date`, `usage_limit`, `created_by`, `status`, `created_at`, `updated_at`) VALUES
(5, 'discount', 'Silver Member Discount', '5% discount for Silver tier', '5.00', NULL, NULL, 'silver', 'global', NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-05-09 02:47:56', '2026-05-11 03:33:38'),
(6, 'discount', 'tetsgold', 'testgold', '10.00', NULL, NULL, 'gold', 'global', NULL, NULL, NULL, '2026-05-14', NULL, NULL, 'active', '2026-05-11 03:37:08', '2026-05-11 03:37:08');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int NOT NULL,
  `booking_code` varchar(20) NOT NULL,
  `user_id` int NOT NULL,
  `room_id` int NOT NULL,
  `hotel_id` int NOT NULL,
  `check_in` date NOT NULL,
  `check_out` date NOT NULL,
  `nights` int DEFAULT '1',
  `guests_count` int DEFAULT '1',
  `room_rate` decimal(10,2) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `tax_rate` decimal(3,1) DEFAULT '10.0',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `service_fee` decimal(10,2) DEFAULT '0.00',
  `total_price` decimal(10,2) NOT NULL,
  `voucher_code` varchar(50) DEFAULT NULL,
  `voucher_discount` decimal(10,2) DEFAULT '0.00',
  `membership_discount` decimal(10,2) DEFAULT '0.00',
  `status` enum('pending','confirmed','checked-in','checked-out','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  `guest_name` varchar(100) DEFAULT NULL,
  `guest_email` varchar(100) DEFAULT NULL,
  `guest_phone` varchar(15) DEFAULT NULL,
  `special_notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `booking_code`, `user_id`, `room_id`, `hotel_id`, `check_in`, `check_out`, `nights`, `guests_count`, `room_rate`, `subtotal`, `tax_rate`, `tax_amount`, `discount_amount`, `service_fee`, `total_price`, `voucher_code`, `voucher_discount`, `membership_discount`, `status`, `payment_status`, `guest_name`, `guest_email`, `guest_phone`, `special_notes`, `created_at`, `updated_at`) VALUES
(1014, 'BK20260523094750', 2, 1, 1, '2026-05-24', '2026-05-27', 3, 2, '450000.00', '1350000.00', '10.0', '135000.00', '0.00', '0.00', '1485000.00', NULL, '0.00', '0.00', 'confirmed', 'paid', NULL, NULL, NULL, NULL, '2026-05-23 02:47:50', '2026-05-23 02:47:55'),
(1015, 'BK20260523094923', 2, 1, 1, '2026-05-24', '2026-05-27', 3, 2, '450000.00', '1350000.00', '10.0', '135000.00', '0.00', '0.00', '1485000.00', NULL, '0.00', '0.00', 'confirmed', 'paid', NULL, NULL, NULL, NULL, '2026-05-23 02:49:24', '2026-05-23 02:50:00');

-- --------------------------------------------------------

--
-- Table structure for table `hotels`
--

CREATE TABLE `hotels` (
  `id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `owner_id` int NOT NULL,
  `location` varchar(150) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Indonesia',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `description` text,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT '0.0',
  `review_count` int DEFAULT '0',
  `status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `total_rooms` int DEFAULT '0',
  `amenities` json DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image` text NOT NULL,
  `suasana` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hotels`
--

INSERT INTO `hotels` (`id`, `name`, `owner_id`, `location`, `address`, `city`, `province`, `country`, `latitude`, `longitude`, `description`, `phone`, `email`, `website`, `rating`, `review_count`, `status`, `total_rooms`, `amenities`, `category`, `created_at`, `updated_at`, `image`, `suasana`) VALUES
(1, 'Ulumuddini Residence', 3, 'Mataram City Center', 'Jl. Pejanggik No. 10', 'Mataram', 'Nusa Tenggara Barat', 'Indonesia', NULL, NULL, 'Hotel ini menawarkan kenyamanan maksimal dengan lokasi strategis yang berada dekat dengan pusat kota. Cocok untuk perjalanan bisnis maupun liburan, Anda dapat dengan mudah mengakses berbagai tempat penting seperti pusat perbelanjaan, kuliner, dan destinasi wisata.', '081234567890', 'ulumuddini585@gmail.com', 'https://ulumuddini-hotel.com', '0.0', 0, 'approved', 3, '[\"wifi\", \"ac\", \"parking\", \"restaurant\"]', 'business', '2026-04-30 04:21:35', '2026-05-11 08:40:08', '[\"/uploads/hotel-1777690160091548000.jpg\",\"/uploads/hotel-1777690160098909100.jpg\",\"/uploads/hotel-1777690160116196900.jpg\"]', ''),
(3, 'test', 3, 'test', 'test', 'test', 'test', 'test', NULL, NULL, 'test', NULL, NULL, NULL, '0.0', 0, 'approved', 1, '[]', NULL, '2026-05-11 08:23:52', '2026-05-11 08:44:34', '[\"http://localhost:8080/uploads/hotel-1778487832234666400.jpg\",\"http://localhost:8080/uploads/hotel-1778487832242128600.jpg\",\"http://localhost:8080/uploads/hotel-1778487832249742500.jpg\"]', 'Alam');

-- --------------------------------------------------------

--
-- Table structure for table `memberships`
--

CREATE TABLE `memberships` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `level_id` int NOT NULL DEFAULT '1',
  `level_name` enum('Silver','Gold','Platinum') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `annual_spending` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive','expired') NOT NULL DEFAULT 'active',
  `joined_date` date DEFAULT NULL,
  `renewal_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `memberships`
--

INSERT INTO `memberships` (`id`, `user_id`, `level_id`, `level_name`, `annual_spending`, `status`, `joined_date`, `renewal_date`, `created_at`, `updated_at`) VALUES
(2, 2, 2, 'Gold', '699.00', 'active', '2026-05-23', '2027-05-23', '2026-05-21 07:43:05', '2026-05-23 02:21:43');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `booking_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_gateway` varchar(50) DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `status` enum('pending','processing','success','failed','refunded') NOT NULL DEFAULT 'pending',
  `proof_image` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `booking_id`, `amount`, `payment_method`, `payment_gateway`, `transaction_id`, `reference_number`, `status`, `proof_image`, `notes`, `created_at`, `updated_at`) VALUES
(1, NULL, '699000.00', NULL, 'sandbox', 'TXN1779502902', NULL, 'success', NULL, 'membership:gold;user:2', '2026-05-23 02:20:13', '2026-05-23 02:21:43'),
(2, 1014, '1485000.00', 'credit-card', 'sandbox', 'TXN1779504474', 'BOOKING-BK20260523094750', 'success', NULL, 'booking:BK20260523094750;status:confirmed;source:simulation', '2026-05-23 02:47:55', '2026-05-23 02:47:55'),
(3, 1015, '1485000.00', 'credit-card', 'sandbox', 'TXN1779504599', 'BOOKING-BK20260523094923', 'success', NULL, 'booking:BK20260523094923;status:confirmed;source:simulation', '2026-05-23 02:50:00', '2026-05-23 02:50:00');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int NOT NULL,
  `booking_id` int NOT NULL,
  `user_id` int NOT NULL,
  `hotel_id` int NOT NULL,
  `rating` int NOT NULL,
  `cleanliness_rating` int DEFAULT NULL,
  `service_rating` int DEFAULT NULL,
  `comfort_rating` int DEFAULT NULL,
  `value_rating` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `comment` text,
  `helpful_count` int DEFAULT '0',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int NOT NULL,
  `hotel_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `capacity` int DEFAULT '2',
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'IDR',
  `stock` int DEFAULT '1',
  `booked_count` int DEFAULT '0',
  `facilities` json DEFAULT NULL,
  `room_type` enum('single','double','suite','deluxe','presidential') DEFAULT 'double',
  `status` enum('available','maintenance','discontinued') NOT NULL DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `hotel_id`, `name`, `description`, `capacity`, `price`, `currency`, `stock`, `booked_count`, `facilities`, `room_type`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Deluxe King', 'Kamar luas dengan kasur king size', 2, '450000.00', 'IDR', 2, 0, '[]', 'deluxe', 'available', '2026-04-30 04:21:35', '2026-05-23 02:49:54'),
(2, 1, 'Family Suite', 'Cocok untuk keluarga kecil', 4, '750000.00', 'IDR', 4, 0, '[]', 'suite', 'available', '2026-04-30 04:21:35', '2026-05-01 09:11:20'),
(3, 1, 'Single Budget', 'Pilihan hemat untuk solo traveler', 1, '250000.00', 'IDR', 11, 0, '[\"wifi\", \"ac\", \"tv\", \"safe\", \"balcony\"]', 'single', 'available', '2026-04-30 04:21:35', '2026-05-12 02:30:04'),
(5, 3, 'test', 'test', 2, '200000.00', 'IDR', 5, 0, '[\"wifi\", \"ac\"]', 'deluxe', 'available', '2026-05-11 08:44:34', '2026-05-11 08:44:34');

-- --------------------------------------------------------

--
-- Table structure for table `room_images`
--

CREATE TABLE `room_images` (
  `id` int NOT NULL,
  `room_id` int NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `role` enum('user','owner','admin') NOT NULL DEFAULT 'user',
  `membership_tier` enum('none','silver','gold','platinum') DEFAULT 'none',
  `membership_status` enum('inactive','active','suspended','expired') DEFAULT 'inactive',
  `membership_start_date` datetime DEFAULT NULL,
  `membership_expiry_date` datetime DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `profile_image` varchar(255) DEFAULT NULL,
  `bio` text,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Indonesia',
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `membership_tier`, `membership_status`, `membership_start_date`, `membership_expiry_date`, `is_admin`, `profile_image`, `bio`, `address`, `city`, `province`, `postal_code`, `country`, `status`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'Administrator', 'admin@stayease.test', '$2y$10$yf5VOniMsxBgAe3YmzFokO6ScrAlgIX9oIkDcyn2mE1uUjiUwJ2IG', '62812345678', 'admin', 'none', 'active', '2026-01-01 00:00:00', '2027-01-01 00:00:00', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'Indonesia', 'active', NULL, '2026-04-29 03:48:19', '2026-05-05 04:02:01'),
(2, 'ihya', 'e41253394@student.polije.ac.id', '$2a$10$bQ.i07BJTxQo/avg77Sdv.yFxzd0rfD8aU.PKXbss4xEF/M5Ri5ky', NULL, 'user', 'gold', 'active', '2026-05-23 09:21:43', '2027-05-23 09:21:43', 0, NULL, NULL, NULL, NULL, NULL, NULL, '', 'active', NULL, '2026-04-29 12:08:51', '2026-05-23 02:21:43'),
(3, 'testing', 'ulumuddini585@gmail.com', '$2a$10$yvN6ZXvzlXB5Nmp3XidkneQfXaOrJKFJxymb72j53DzyleC8jA1X2', NULL, 'owner', 'none', 'active', '2026-04-30 00:00:00', '2027-04-30 00:00:00', 0, NULL, NULL, NULL, 'jember', NULL, NULL, '', 'active', NULL, '2026-04-30 04:06:39', '2026-05-21 02:57:12');

-- --------------------------------------------------------

--
-- Table structure for table `vouchers`
--

CREATE TABLE `vouchers` (
  `id` int NOT NULL,
  `code` varchar(50) NOT NULL,
  `type` enum('percent','fixed') DEFAULT 'percent',
  `value` decimal(10,2) NOT NULL,
  `min_booking_amount` decimal(10,2) DEFAULT '0.00',
  `scope` enum('global','hotel','room_type') DEFAULT 'global',
  `membership_tier` enum('none','silver','gold','platinum') DEFAULT 'none',
  `hotel_id` int DEFAULT NULL,
  `room_type` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `expiry_date` date NOT NULL,
  `usage_limit` int DEFAULT NULL,
  `used_count` int DEFAULT '0',
  `status` enum('active','inactive','expired','exhausted') NOT NULL DEFAULT 'active',
  `description` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `vouchers`
--

INSERT INTO `vouchers` (`id`, `code`, `type`, `value`, `min_booking_amount`, `scope`, `membership_tier`, `hotel_id`, `room_type`, `start_date`, `expiry_date`, `usage_limit`, `used_count`, `status`, `description`, `created_by`, `created_at`, `updated_at`) VALUES
(37, 'GOLD_SUITE_15PCT', 'percent', '15.00', '1000000.00', 'global', 'gold', NULL, NULL, '2026-05-05', '2027-05-05', 200, 0, 'active', 'Member Gold - Diskon 15% khusus kamar Suite', NULL, '2026-05-05 04:10:42', '2026-05-12 07:42:32'),
(47, 'FLASH_MEMBER_20', 'percent', '50.00', '0.00', 'hotel', 'none', 1, NULL, '2026-05-05', '2026-05-15', 100, 1, 'active', 'Flash Sale Member - Diskon 20% terbatas 7 hari (NO TIER REQUIRED)', NULL, '2026-05-05 04:10:43', '2026-05-13 03:44:39'),
(59, 'TEST010', 'percent', '5.00', '0.00', 'global', 'none', NULL, NULL, NULL, '2026-05-08', 10, 0, 'active', NULL, 1, '2026-05-07 03:59:35', '2026-05-07 03:59:35'),
(61, 'TESTTEST', 'percent', '10.00', '0.00', 'global', 'silver', NULL, NULL, NULL, '2026-05-12', 10, 0, 'active', 'test', 1, '2026-05-11 03:07:11', '2026-05-11 03:28:32'),
(62, 'TESTFIXED', 'fixed', '100000.00', '0.00', 'global', 'none', NULL, NULL, NULL, '2026-05-16', 100, 1, 'active', NULL, 1, '2026-05-11 03:12:46', '2026-05-12 08:29:52'),
(63, 'SILVER_5PCT', 'percent', '5.00', '500000.00', 'global', 'silver', NULL, NULL, '2026-05-12', '2027-05-12', 500, 1, 'active', 'Member Silver - Diskon 5% untuk semua hotel', NULL, '2026-05-12 07:42:32', '2026-05-13 03:44:20'),
(64, 'GOLD_10PCT', 'percent', '10.00', '500000.00', 'global', 'gold', NULL, NULL, '2026-05-12', '2027-05-12', 500, 0, 'active', 'Member Gold - Diskon 10% untuk semua hotel', NULL, '2026-05-12 07:42:32', '2026-05-12 07:42:32'),
(65, 'PLATINUM_15PCT', 'percent', '15.00', '500000.00', 'global', 'platinum', NULL, NULL, '2026-05-12', '2027-05-12', 600, 0, 'active', 'Member Platinum - Diskon 15% untuk semua hotel + free breakfast', NULL, '2026-05-12 07:42:32', '2026-05-12 07:42:32');

-- --------------------------------------------------------

--
-- Table structure for table `voucher_claims`
--

CREATE TABLE `voucher_claims` (
  `id` int NOT NULL,
  `voucher_id` int NOT NULL,
  `user_id` int NOT NULL,
  `claim_code` varchar(80) NOT NULL,
  `status` enum('claimed','used','cancelled') NOT NULL DEFAULT 'claimed',
  `claimed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `voucher_claims`
--

INSERT INTO `voucher_claims` (`id`, `voucher_id`, `user_id`, `claim_code`, `status`, `claimed_at`, `used_at`, `created_at`, `updated_at`) VALUES
(1, 62, 2, 'VC-62-2-1778574591682054600', 'claimed', '2026-05-12 08:29:52', NULL, '2026-05-12 08:29:52', '2026-05-12 08:29:52'),
(2, 63, 2, 'VC-63-2-1778643859584125000', 'used', '2026-05-13 03:44:20', '2026-05-18 08:02:02', '2026-05-13 03:44:20', '2026-05-18 08:02:02'),
(3, 47, 2, 'VC-47-2-1778643879354434500', 'claimed', '2026-05-13 03:44:39', NULL, '2026-05-13 03:44:39', '2026-05-13 03:44:39');

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `hotel_id` int NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `benefit_membership`
--
ALTER TABLE `benefit_membership`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_membership_tier` (`membership_tier`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_hotel` (`hotel_id`),
  ADD KEY `idx_voucher` (`voucher_id`),
  ADD KEY `idx_expiry_date` (`expiry_date`),
  ADD KEY `fk_benefit_membership_creator` (`created_by`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_booking_code` (`booking_code`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_hotel` (`hotel_id`),
  ADD KEY `idx_room` (`room_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `idx_check_in` (`check_in`),
  ADD KEY `idx_check_out` (`check_out`);

--
-- Indexes for table `hotels`
--
ALTER TABLE `hotels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_owner` (`owner_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_location` (`location`),
  ADD KEY `idx_rating` (`rating`);

--
-- Indexes for table `memberships`
--
ALTER TABLE `memberships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_level` (`level_name`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD UNIQUE KEY `reference_number` (`reference_number`),
  ADD KEY `idx_booking` (`booking_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_booking` (`booking_id`),
  ADD KEY `idx_hotel` (`hotel_id`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `fk_reviews_user` (`user_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hotel` (`hotel_id`),
  ADD KEY `idx_price` (`price`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `room_images`
--
ALTER TABLE `room_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_room` (`room_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_membership_tier` (`membership_tier`),
  ADD KEY `idx_membership_status` (`membership_status`);

--
-- Indexes for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_expiry` (`expiry_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_hotel` (`hotel_id`),
  ADD KEY `fk_vouchers_creator` (`created_by`),
  ADD KEY `idx_membership_tier` (`membership_tier`);

--
-- Indexes for table `voucher_claims`
--
ALTER TABLE `voucher_claims`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_voucher_user_claim` (`voucher_id`,`user_id`),
  ADD UNIQUE KEY `uniq_voucher_claim_code` (`claim_code`),
  ADD KEY `idx_voucher_claims_user_id` (`user_id`),
  ADD KEY `idx_voucher_claims_voucher_id` (`voucher_id`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_wish` (`user_id`,`hotel_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `fk_wishlist_hotel` (`hotel_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `benefit_membership`
--
ALTER TABLE `benefit_membership`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1016;

--
-- AUTO_INCREMENT for table `hotels`
--
ALTER TABLE `hotels`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `memberships`
--
ALTER TABLE `memberships`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2008;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `room_images`
--
ALTER TABLE `room_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `vouchers`
--
ALTER TABLE `vouchers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `voucher_claims`
--
ALTER TABLE `voucher_claims`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `benefit_membership`
--
ALTER TABLE `benefit_membership`
  ADD CONSTRAINT `fk_benefit_membership_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_benefit_membership_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_benefit_membership_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_bookings_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hotels`
--
ALTER TABLE `hotels`
  ADD CONSTRAINT `fk_hotels_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `memberships`
--
ALTER TABLE `memberships`
  ADD CONSTRAINT `fk_memberships_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `fk_rooms_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_images`
--
ALTER TABLE `room_images`
  ADD CONSTRAINT `fk_room_images` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD CONSTRAINT `fk_vouchers_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_vouchers_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `voucher_claims`
--
ALTER TABLE `voucher_claims`
  ADD CONSTRAINT `fk_voucher_claims_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_voucher_claims_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `fk_wishlist_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
