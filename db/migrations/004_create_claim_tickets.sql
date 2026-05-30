-- Migration: create voucher claim system
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `voucher_claims` (
  `id` int NOT NULL AUTO_INCREMENT,
  `voucher_id` int NOT NULL,
  `user_id` int NOT NULL,
  `claim_code` varchar(80) NOT NULL,
  `status` enum('claimed','cancelled') NOT NULL DEFAULT 'claimed',
  `claimed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_voucher_user_claim` (`voucher_id`, `user_id`),
  UNIQUE KEY `uniq_voucher_claim_code` (`claim_code`),
  KEY `idx_voucher_claims_user_id` (`user_id`),
  KEY `idx_voucher_claims_voucher_id` (`voucher_id`),
  CONSTRAINT `fk_voucher_claims_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_voucher_claims_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Optional seed example, using existing voucher records:
-- INSERT INTO `voucher_claims` (`voucher_id`, `user_id`, `claim_code`, `status`, `claimed_at`, `created_at`, `updated_at`) VALUES
-- (1, 2, 'VC-1-2-1715486400', 'claimed', NOW(), NOW(), NOW());

COMMIT;
