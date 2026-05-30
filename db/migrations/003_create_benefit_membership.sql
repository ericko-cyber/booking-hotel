-- ============================================================================
-- MIGRATION: Replace membership_levels with benefit_membership
-- ============================================================================
-- Purpose:
-- 1) Create benefit_membership table for member discount and voucher benefits
-- 2) Migrate discount data from membership_levels when available
-- 3) Safely remove membership_levels dependency from memberships table
-- ============================================================================

START TRANSACTION;

-- --------------------------------------------------------------------------
-- Step 1: Create new benefit_membership table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `benefit_membership` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,

  -- Target tier that can use this benefit
  `membership_tier` ENUM('silver','gold','platinum') NOT NULL,

  -- Benefit type: voucher or discount
  `benefit_type` ENUM('voucher','discount') NOT NULL,

  -- Voucher relation (used when benefit_type='voucher')
  `voucher_id` INT NULL,

  -- Discount payload (used when benefit_type='discount')
  `discount_type` ENUM('percent','fixed') NULL,
  `discount_value` DECIMAL(10,2) NULL,
  `min_spend` DECIMAL(12,2) NULL DEFAULT 0,

  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `start_date` DATETIME NULL,
  `end_date` DATETIME NULL,

  `created_by` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_benefit_tier` (`membership_tier`),
  KEY `idx_benefit_type` (`benefit_type`),
  KEY `idx_benefit_status` (`status`),
  KEY `idx_benefit_voucher` (`voucher_id`),

  CONSTRAINT `fk_benefit_voucher`
    FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_benefit_creator`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,

  CONSTRAINT `chk_benefit_payload`
    CHECK (
      (`benefit_type` = 'voucher' AND `voucher_id` IS NOT NULL)
      OR
      (`benefit_type` = 'discount' AND `discount_type` IS NOT NULL AND `discount_value` IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------------
-- Step 2: Migrate discount data from membership_levels (if table exists)
-- --------------------------------------------------------------------------
SET @has_membership_levels := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'membership_levels'
);

SET @migrate_sql := IF(
  @has_membership_levels > 0,
  "INSERT INTO benefit_membership (name, description, membership_tier, benefit_type, discount_type, discount_value, min_spend, status, created_at, updated_at)
   SELECT
     CONCAT('Tier Discount - ', name) AS name,
     CONCAT('Migrated from membership_levels: ', name) AS description,
     CASE
       WHEN LOWER(name) = 'silver' THEN 'silver'
       WHEN LOWER(name) = 'gold' THEN 'gold'
       WHEN LOWER(name) IN ('luminary', 'platinum') THEN 'platinum'
       ELSE NULL
     END AS membership_tier,
     'discount' AS benefit_type,
     'percent' AS discount_type,
     discount_percent AS discount_value,
     IFNULL(min_annual_spending, 0) AS min_spend,
     'active' AS status,
     NOW(), NOW()
   FROM membership_levels
   WHERE discount_percent IS NOT NULL
     AND discount_percent > 0
     AND LOWER(name) IN ('silver','gold','luminary','platinum')",
  "SELECT 1"
);

PREPARE migrate_stmt FROM @migrate_sql;
EXECUTE migrate_stmt;
DEALLOCATE PREPARE migrate_stmt;

-- --------------------------------------------------------------------------
-- Step 3: Remove FK dependency from memberships -> membership_levels
-- --------------------------------------------------------------------------
SET @has_fk_memberships_level := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'memberships'
    AND constraint_name = 'fk_memberships_level'
    AND constraint_type = 'FOREIGN KEY'
);

SET @drop_fk_sql := IF(
  @has_fk_memberships_level > 0,
  'ALTER TABLE memberships DROP FOREIGN KEY fk_memberships_level',
  'SELECT 1'
);

PREPARE drop_fk_stmt FROM @drop_fk_sql;
EXECUTE drop_fk_stmt;
DEALLOCATE PREPARE drop_fk_stmt;

-- --------------------------------------------------------------------------
-- Step 4: Drop old table (safe when you fully move to benefit_membership)
-- --------------------------------------------------------------------------
DROP TABLE IF EXISTS membership_levels;

COMMIT;

-- Verification
-- SELECT * FROM benefit_membership;
