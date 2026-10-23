\set ON_ERROR_STOP on

-- Required psql variables: target_email and target_household_id.
-- Every INSERT is guarded so this seed is safe to run again for the same household.
WITH target AS (
  SELECT p.id AS actor_id, h.id AS household_id
  FROM profiles p
  JOIN auth_users u ON u.id = p.auth_user_id
  JOIN household_members m ON m.profile_id = p.id AND m.status = 'active'
  JOIN households h ON h.id = m.household_id AND h.deleted_at IS NULL
  WHERE lower(u.email) = lower(:'target_email')
    AND h.id = :'target_household_id'::uuid
    AND p.status = 'active'
)
INSERT INTO financial_accounts(
  id, household_id, name, kind, opening_balance_minor, opening_date, created_by, updated_by
)
SELECT gen_random_uuid(), target.household_id, demo.name, demo.kind,
  demo.opening_balance_minor, demo.opening_date, target.actor_id, target.actor_id
FROM target
CROSS JOIN (VALUES
  ('Rekening Mandiri', 'bank', 8000000::bigint, DATE '2026-01-01'),
  ('DANA Keluarga', 'ewallet', 500000::bigint, DATE '2026-01-01'),
  ('Tunai Rumah', 'cash', 300000::bigint, DATE '2026-01-01')
) AS demo(name, kind, opening_balance_minor, opening_date)
WHERE NOT EXISTS (
  SELECT 1 FROM financial_accounts a
  WHERE a.household_id = target.household_id AND a.name = demo.name
);

WITH target AS (
  SELECT p.id AS actor_id, h.id AS household_id
  FROM profiles p
  JOIN auth_users u ON u.id = p.auth_user_id
  JOIN household_members m ON m.profile_id = p.id AND m.status = 'active'
  JOIN households h ON h.id = m.household_id AND h.deleted_at IS NULL
  WHERE lower(u.email) = lower(:'target_email')
    AND h.id = :'target_household_id'::uuid
    AND p.status = 'active'
)
INSERT INTO transactions(
  id, household_id, type, account_id, destination_account_id, category_id,
  amount_minor, fee_minor, fee_category_id, occurred_on, note, created_by, updated_by
)
SELECT gen_random_uuid(), target.household_id, demo.type, source.id, destination.id,
  category.id, demo.amount_minor, demo.fee_minor, fee_category.id, demo.occurred_on,
  demo.note, target.actor_id, target.actor_id
FROM target
CROSS JOIN (VALUES
  ('income',  'Rekening Mandiri', NULL::text, 'Gaji',            12000000::bigint, 0::bigint, NULL::text,            DATE '2026-10-01', 'Demo • Gaji Oktober'),
  ('expense', 'Rekening Mandiri', NULL::text, 'Tagihan',           850000::bigint, 0::bigint, NULL::text,            DATE '2026-10-03', 'Demo • Listrik, air, dan internet'),
  ('expense', 'Rekening Mandiri', NULL::text, 'Belanja rumah',    1250000::bigint, 0::bigint, NULL::text,            DATE '2026-10-06', 'Demo • Belanja kebutuhan mingguan'),
  ('transfer','Rekening Mandiri', 'DANA Keluarga', NULL::text,     500000::bigint, 2500::bigint, 'Biaya transfer',    DATE '2026-10-08', 'Demo • Isi saldo DANA'),
  ('expense', 'DANA Keluarga', NULL::text, 'Makan & minum',        180000::bigint, 0::bigint, NULL::text,            DATE '2026-10-10', 'Demo • Makan akhir pekan'),
  ('expense', 'Rekening Mandiri', NULL::text, 'Transportasi',      320000::bigint, 0::bigint, NULL::text,            DATE '2026-10-12', 'Demo • Bensin dan parkir'),
  ('expense', 'Tunai Rumah', NULL::text, 'Makan & minum',           95000::bigint, 0::bigint, NULL::text,            DATE '2026-10-15', 'Demo • Belanja sarapan'),
  ('expense', 'Rekening Mandiri', NULL::text, 'Kesehatan',         225000::bigint, 0::bigint, NULL::text,            DATE '2026-10-17', 'Demo • Vitamin keluarga'),
  ('expense', 'DANA Keluarga', NULL::text, 'Hiburan',              175000::bigint, 0::bigint, NULL::text,            DATE '2026-10-18', 'Demo • Langganan hiburan'),
  ('income',  'Rekening Mandiri', NULL::text, 'Pemasukan lain',    350000::bigint, 0::bigint, NULL::text,            DATE '2026-10-19', 'Demo • Pengembalian dana'),
  ('expense', 'Rekening Mandiri', NULL::text, 'Belanja rumah',     420000::bigint, 0::bigint, NULL::text,            DATE '2026-09-27', 'Demo • Belanja akhir September')
) AS demo(type, source_name, destination_name, category_name, amount_minor, fee_minor, fee_category_name, occurred_on, note)
JOIN financial_accounts source ON source.household_id = target.household_id AND source.name = demo.source_name
LEFT JOIN financial_accounts destination ON destination.household_id = target.household_id AND destination.name = demo.destination_name
LEFT JOIN categories category ON category.household_id = target.household_id AND category.name = demo.category_name
LEFT JOIN categories fee_category ON fee_category.household_id = target.household_id AND fee_category.name = demo.fee_category_name
WHERE NOT EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.household_id = target.household_id AND t.note = demo.note AND t.deleted_at IS NULL
);

WITH target AS (
  SELECT p.id AS actor_id, h.id AS household_id
  FROM profiles p
  JOIN auth_users u ON u.id = p.auth_user_id
  JOIN household_members m ON m.profile_id = p.id AND m.status = 'active'
  JOIN households h ON h.id = m.household_id AND h.deleted_at IS NULL
  WHERE lower(u.email) = lower(:'target_email')
    AND h.id = :'target_household_id'::uuid
    AND p.status = 'active'
)
INSERT INTO budgets(id, household_id, category_id, month_start, limit_minor, created_by, updated_by)
SELECT gen_random_uuid(), target.household_id, category.id, DATE '2026-10-01', demo.limit_minor,
  target.actor_id, target.actor_id
FROM target
CROSS JOIN (VALUES
  ('Belanja rumah', 3000000::bigint),
  ('Makan & minum', 2000000::bigint),
  ('Transportasi', 800000::bigint),
  ('Tagihan', 1200000::bigint)
) AS demo(category_name, limit_minor)
JOIN categories category ON category.household_id = target.household_id
  AND category.name = demo.category_name AND category.kind = 'expense'
WHERE NOT EXISTS (
  SELECT 1 FROM budgets b
  WHERE b.household_id = target.household_id
    AND b.category_id = category.id
    AND b.month_start = DATE '2026-10-01'
);

WITH target AS (
  SELECT p.id AS actor_id, h.id AS household_id
  FROM profiles p
  JOIN auth_users u ON u.id = p.auth_user_id
  JOIN household_members m ON m.profile_id = p.id AND m.status = 'active'
  JOIN households h ON h.id = m.household_id AND h.deleted_at IS NULL
  WHERE lower(u.email) = lower(:'target_email')
    AND h.id = :'target_household_id'::uuid
    AND p.status = 'active'
), added AS (
  INSERT INTO audit_events(id, household_id, actor_profile_id, entity_type, entity_id, action, visibility, changes)
  SELECT gen_random_uuid(), target.household_id, target.actor_id, 'household', target.household_id,
    'seeded', 'admin', '{"source":"demo"}'::jsonb
  FROM target
  WHERE NOT EXISTS (
    SELECT 1 FROM audit_events e
    WHERE e.household_id = target.household_id AND e.action = 'seeded'
  )
  RETURNING household_id
)
UPDATE households h
SET revision = revision + 1
WHERE h.id IN (SELECT household_id FROM added);

SELECT h.name AS household, count(DISTINCT a.id) AS accounts,
  count(DISTINCT t.id) FILTER (WHERE t.deleted_at IS NULL) AS transactions,
  count(DISTINCT b.id) AS budgets
FROM households h
LEFT JOIN financial_accounts a ON a.household_id = h.id
LEFT JOIN transactions t ON t.household_id = h.id
LEFT JOIN budgets b ON b.household_id = h.id
WHERE h.id = :'target_household_id'::uuid
GROUP BY h.name;
