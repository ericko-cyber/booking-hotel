-- ============================================================================
-- Booking Hotel Platform - Complete Database Schema
-- ============================================================================
-- Created: 2026
-- Database: booking_hotel
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ============================================================================
-- TABLE: USERS (Semua pengguna: user, owner, admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(15),
  `role` enum('user','owner','admin') NOT NULL DEFAULT 'user',
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `profile_image` varchar(255),
  `bio` text,
  `address` varchar(255),
  `city` varchar(100),
  `province` varchar(100),
  `postal_code` varchar(10),
  `country` varchar(100) DEFAULT 'Indonesia',
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `last_login` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: HOTELS (Data hotel dari berbagai owner)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `hotels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `owner_id` int NOT NULL,
  `location` varchar(150),
  `address` varchar(255),
  `city` varchar(100),
  `province` varchar(100),
  `country` varchar(100) DEFAULT 'Indonesia',
  `latitude` decimal(10,8),
  `longitude` decimal(11,8),
  `description` text,
  `phone` varchar(15),
  `email` varchar(100),
  `website` varchar(255),
  
  `rating` decimal(2,1) DEFAULT 0,
  `review_count` int DEFAULT 0,
  
  `status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `total_rooms` int DEFAULT 0,
  `amenities` json,
  `category` varchar(50),
  
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner_id`),
  KEY `idx_status` (`status`),
  KEY `idx_location` (`location`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `fk_hotels_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: ROOMS (Kamar-kamar di setiap hotel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hotel_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `capacity` int DEFAULT 2,
  
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'IDR',
  `stock` int DEFAULT 1,
  `booked_count` int DEFAULT 0,
  
  `facilities` json,
  `room_type` enum('single','double','suite','deluxe','presidential') DEFAULT 'double',
  
  `status` enum('available','maintenance','discontinued') NOT NULL DEFAULT 'available',
  
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_hotel` (`hotel_id`),
  KEY `idx_price` (`price`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_rooms_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: ROOM_IMAGES (Gambar ruangan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `room_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `caption` varchar(255),
  `is_featured` tinyint(1) DEFAULT 0,
  `display_order` int DEFAULT 0,
  
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_room` (`room_id`),
  CONSTRAINT `fk_room_images` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: BOOKINGS (Pemesanan kamar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_code` varchar(20) NOT NULL,
  `user_id` int NOT NULL,
  `room_id` int NOT NULL,
  `hotel_id` int NOT NULL,
  
  `check_in` date NOT NULL,
  `check_out` date NOT NULL,
  `nights` int DEFAULT 1,
  `guests_count` int DEFAULT 1,
  
  `room_rate` decimal(10,2),
  `subtotal` decimal(10,2),
  `tax_rate` decimal(3,1) DEFAULT 10.00,
  `tax_amount` decimal(10,2) DEFAULT 0,
  `discount_amount` decimal(10,2) DEFAULT 0,
  `service_fee` decimal(10,2) DEFAULT 0,
  `total_price` decimal(10,2) NOT NULL,
  
  `voucher_code` varchar(50),
  `voucher_discount` decimal(10,2) DEFAULT 0,
  `membership_discount` decimal(10,2) DEFAULT 0,
  
  `status` enum('pending','confirmed','checked-in','checked-out','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  
  `guest_name` varchar(100),
  `guest_email` varchar(100),
  `guest_phone` varchar(15),
  `special_notes` text,
  
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_booking_code` (`booking_code`),
  KEY `idx_user` (`user_id`),
  KEY `idx_hotel` (`hotel_id`),
  KEY `idx_room` (`room_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_check_in` (`check_in`),
  KEY `idx_check_out` (`check_out`),
  
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: PAYMENTS (Pembayaran untuk booking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50),
  `payment_gateway` varchar(50),
  
  `transaction_id` varchar(100) UNIQUE,
  `reference_number` varchar(100) UNIQUE,
  
  `status` enum('pending','processing','success','failed','refunded') NOT NULL DEFAULT 'pending',
  
  `proof_image` varchar(255),
  `notes` text,
  
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_booking` (`booking_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: VOUCHERS (Kode diskon/promo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL UNIQUE,
  
  `type` enum('percent','fixed') DEFAULT 'percent',
  `value` decimal(10,2) NOT NULL,
  `min_booking_amount` decimal(10,2) DEFAULT 0,
  
  `scope` enum('global','hotel','room_type') DEFAULT 'global',
  `hotel_id` int,
  `room_type` varchar(50),
  
  `start_date` date,
  `expiry_date` date NOT NULL,
  `usage_limit` int,
  `used_count` int DEFAULT 0,
  
  `status` enum('active','inactive','expired','exhausted') NOT NULL DEFAULT 'active',
  `description` text,
  
  `created_by` int,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_expiry` (`expiry_date`),
  KEY `idx_status` (`status`),
  KEY `idx_hotel` (`hotel_id`),
  CONSTRAINT `fk_vouchers_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vouchers_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: MEMBERSHIP_LEVELS (Static data untuk tier membership)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `membership_levels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `discount_percent` decimal(3,1) DEFAULT 0,
  `min_annual_spending` decimal(10,2) DEFAULT 0,
  `color` varchar(7),
  `benefits` json,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: MEMBERSHIPS (Membership user individual)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `memberships` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  
  `level_id` int NOT NULL DEFAULT 1,
  `level_name` enum('Basic','Silver','Gold','Luminary') DEFAULT 'Basic',
  
  `annual_spending` decimal(10,2) DEFAULT 0,
  
  `status` enum('active','inactive','expired') NOT NULL DEFAULT 'active',
  `joined_date` date,
  `renewal_date` date,
  
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_level` (`level_name`),
  CONSTRAINT `fk_memberships_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_memberships_level` FOREIGN KEY (`level_id`) REFERENCES `membership_levels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: REVIEWS (Ulasan dan rating dari guest)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `user_id` int NOT NULL,
  `hotel_id` int NOT NULL,
  
  `rating` int NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `cleanliness_rating` int,
  `service_rating` int,
  `comfort_rating` int,
  `value_rating` int,
  
  `title` varchar(255),
  `comment` text,
  `helpful_count` int DEFAULT 0,
  
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_booking` (`booking_id`),
  KEY `idx_hotel` (`hotel_id`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `fk_reviews_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: WISHLIST (Daftar favorit user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `hotel_id` int NOT NULL,
  
  `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_wish` (`user_id`,`hotel_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TABLE: ANALYTICS_METRICS (Metrik harian platform)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `analytics_metrics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `metric_date` date NOT NULL,
  
  `total_users` int DEFAULT 0,
  `new_users` int DEFAULT 0,
  `active_bookings` int DEFAULT 0,
  `completed_bookings` int DEFAULT 0,
  `cancelled_bookings` int DEFAULT 0,
  
  `total_revenue` decimal(15,2) DEFAULT 0,
  `platform_commission` decimal(15,2) DEFAULT 0,
  `platform_commission_rate` decimal(3,1) DEFAULT 10.00,
  
  `total_hotels` int DEFAULT 0,
  `approved_hotels` int DEFAULT 0,
  `pending_hotels` int DEFAULT 0,
  
  `avg_booking_value` decimal(10,2) DEFAULT 0,
  
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_date` (`metric_date`),
  KEY `idx_date` (`metric_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- SAMPLE DATA: MEMBERSHIP LEVELS
-- ============================================================================
INSERT INTO `membership_levels` (`name`, `discount_percent`, `min_annual_spending`, `color`, `benefits`) VALUES
('Basic', 0.0, 0, '#888888', '[\"Access to all listings\", \"Standard booking support\"]'),
('Silver', 5.0, 3000000, '#9aa0a6', '[\"5% booking discount\", \"Priority customer support\", \"Early access to new properties\"]'),
('Gold', 10.0, 8000000, '#c49a3c', '[\"10% booking discount\", \"Dedicated concierge\", \"Free room upgrades\", \"Exclusive member vouchers\"]'),
('Luminary', 15.0, 20000000, '#1b4d5c', '[\"15% booking discount\", \"White-glove concierge 24/7\", \"Annual curated retreat invite\", \"Airport lounge access\", \"Complimentary transfers\"]');

-- ============================================================================
-- SAMPLE DATA: ADMIN USER
-- ============================================================================
INSERT INTO `users` (`name`, `email`, `password`, `phone`, `role`, `is_admin`, `status`) VALUES
('Administrator', 'admin@stayease.test', '$2y$10$yf5VOniMsxBgAe3YmzFokO6ScrAlgIX9oIkDcyn2mE1uUjiUwJ2IG', '62812345678', 'admin', 1, 'active');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
