-- ============================================================================
-- SEED: benefit_membership (discount + voucher)
-- ============================================================================
-- Prerequisite:
-- - Table benefit_membership already created
-- - Vouchers table already has membership vouchers seeded
-- ============================================================================

-- 1) Seed discount benefits per tier (idempotent)
INSERT INTO benefit_membership (
  name, description, membership_tier, benefit_type,
  discount_type, discount_value, min_spend,
  status, start_date, end_date, created_at, updated_at
)
SELECT
  s.name,
  s.description,
  s.membership_tier,
  'discount',
  'percent',
  s.discount_value,
  s.min_spend,
  'active',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 12 MONTH),
  NOW(),
  NOW()
FROM (
  SELECT 'Silver Member Discount' AS name, 'Diskon khusus member Silver' AS description, 'silver' AS membership_tier, 5.00 AS discount_value, 300000.00 AS min_spend
  UNION ALL
  SELECT 'Gold Member Discount', 'Diskon khusus member Gold', 'gold', 10.00, 500000.00
  UNION ALL
  SELECT 'Platinum Member Discount', 'Diskon khusus member Platinum', 'platinum', 15.00, 800000.00
) s
WHERE NOT EXISTS (
  SELECT 1
  FROM benefit_membership b
  WHERE b.benefit_type = 'discount'
    AND b.membership_tier = s.membership_tier
    AND b.name = s.name
);

-- 2) Seed voucher benefits by linking voucher rows
INSERT INTO benefit_membership (
  name, description, membership_tier, benefit_type,
  voucher_id, status, start_date, end_date, created_at, updated_at
)
SELECT
  CONCAT('Voucher Benefit - ', v.code) AS name,
  CONCAT('Benefit voucher untuk tier ', v.membership_tier) AS description,
  v.membership_tier,
  'voucher',
  v.id,
  'active',
  v.start_date,
  v.expiry_date,
  NOW(),
  NOW()
FROM vouchers v
WHERE v.membership_tier IN ('silver', 'gold', 'platinum')
  AND NOT EXISTS (
    SELECT 1
    FROM benefit_membership b
    WHERE b.benefit_type = 'voucher'
      AND b.voucher_id = v.id
  );

-- Verification
-- SELECT id, name, membership_tier, benefit_type, voucher_id, discount_type, discount_value
-- FROM benefit_membership
-- ORDER BY membership_tier, benefit_type, id;
