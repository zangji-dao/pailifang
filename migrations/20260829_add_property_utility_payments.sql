BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS meters_base_code_unique
  ON meters (base_id, code);

CREATE TABLE IF NOT EXISTS property_utility_payments (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id varchar(36) NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  utility_type varchar(30) NOT NULL,
  billing_period varchar(30) NOT NULL,
  provider varchar(255),
  account_number varchar(100),
  charge_type varchar(30),
  quantity numeric(12, 2),
  quantity_unit varchar(20),
  unit_price numeric(12, 2),
  amount numeric(14, 2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'pending',
  paid_at timestamp,
  payment_method varchar(30),
  receipt_number varchar(100),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS property_utility_payments_period_unique
  ON property_utility_payments (meter_id, utility_type, billing_period);
CREATE INDEX IF NOT EXISTS property_utility_payments_meter_idx
  ON property_utility_payments (meter_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS property_utility_payments_status_idx
  ON property_utility_payments (status, billing_period);

WITH property_seed(code, name, area, heating_number, heating_status, sort_order) AS (
  VALUES
    ('1号楼102门', '义乌城1号楼102门', 276.44::numeric, '270602', 'full', 1),
    ('1号楼103门', '义乌城1号楼103门', 282.95::numeric, '270603', 'full', 2),
    ('1号楼104门', '义乌城1号楼104门', 274.79::numeric, '270604', 'base', 3),
    ('1号楼105门', '义乌城1号楼105门', 280.12::numeric, '270605', 'base', 4),
    ('1号楼106门', '义乌城1号楼106门', 275.64::numeric, '270606', 'full', 5),
    ('1号楼107门', '义乌城1号楼107门', 274.79::numeric, '270607', 'base', 6),
    ('1号楼108门', '义乌城1号楼108门', 276.44::numeric, '270608', 'full', 7),
    ('2号楼104门', '义乌城2号楼104门', 255.79::numeric, '270794', 'full', 8)
)
INSERT INTO meters (
  base_id,
  code,
  name,
  area,
  heating_number,
  heating_type,
  heating_status,
  network_status,
  sort_order,
  status,
  updated_at
)
SELECT
  '00e03010-ad87-468d-96f3-ca9ad3433470',
  property_seed.code,
  property_seed.name,
  property_seed.area,
  property_seed.heating_number,
  'base',
  property_seed.heating_status,
  'normal',
  property_seed.sort_order,
  'active',
  CURRENT_TIMESTAMP
FROM property_seed
WHERE EXISTS (
  SELECT 1
  FROM bases
  WHERE id = '00e03010-ad87-468d-96f3-ca9ad3433470'
)
ON CONFLICT (base_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  area = EXCLUDED.area,
  heating_number = EXCLUDED.heating_number,
  heating_type = EXCLUDED.heating_type,
  heating_status = EXCLUDED.heating_status,
  sort_order = EXCLUDED.sort_order,
  updated_at = CURRENT_TIMESTAMP;

WITH payment_seed(code, account_number, charge_type, quantity, unit_price, amount) AS (
  VALUES
    ('1号楼102门', '270602', 'full', 276.44::numeric, 38.00::numeric, 10504.72::numeric),
    ('1号楼103门', '270603', 'full', 282.95::numeric, 38.00::numeric, 10752.10::numeric),
    ('1号楼104门', '270604', 'base', 274.79::numeric, 7.60::numeric, 2088.40::numeric),
    ('1号楼105门', '270605', 'base', 280.12::numeric, 7.60::numeric, 2128.91::numeric),
    ('1号楼106门', '270606', 'full', 275.64::numeric, 38.00::numeric, 10474.32::numeric),
    ('1号楼107门', '270607', 'base', 274.79::numeric, 7.60::numeric, 2088.40::numeric),
    ('1号楼108门', '270608', 'full', 276.44::numeric, 38.00::numeric, 10504.72::numeric),
    ('2号楼104门', '270794', 'full', 255.79::numeric, 38.00::numeric, 9720.02::numeric)
)
INSERT INTO property_utility_payments (
  meter_id,
  utility_type,
  billing_period,
  provider,
  account_number,
  charge_type,
  quantity,
  quantity_unit,
  unit_price,
  amount,
  status,
  paid_at,
  payment_method,
  metadata,
  updated_at
)
SELECT
  meter.id,
  'heating',
  '2025-2026',
  '松原热力有限责任公司',
  payment_seed.account_number,
  payment_seed.charge_type,
  payment_seed.quantity,
  '㎡',
  payment_seed.unit_price,
  payment_seed.amount,
  'paid',
  '2025-11-17 00:00:00'::timestamp,
  'cash',
  jsonb_build_object(
    'source', '用户提供的热费收据',
    'recordedAt', '2026-08-29'
  ),
  CURRENT_TIMESTAMP
FROM payment_seed
JOIN meters meter
  ON meter.base_id = '00e03010-ad87-468d-96f3-ca9ad3433470'
 AND meter.code = payment_seed.code
ON CONFLICT (meter_id, utility_type, billing_period) DO UPDATE SET
  provider = EXCLUDED.provider,
  account_number = EXCLUDED.account_number,
  charge_type = EXCLUDED.charge_type,
  quantity = EXCLUDED.quantity,
  quantity_unit = EXCLUDED.quantity_unit,
  unit_price = EXCLUDED.unit_price,
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  paid_at = EXCLUDED.paid_at,
  payment_method = EXCLUDED.payment_method,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
