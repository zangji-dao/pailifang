CREATE TABLE IF NOT EXISTS base_fee_types (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  base_id varchar(36) NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  code varchar(50) NOT NULL,
  name varchar(100) NOT NULL,
  billing_cycle varchar(20) NOT NULL DEFAULT 'monthly',
  is_builtin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone,
  CONSTRAINT base_fee_types_cycle_check CHECK (billing_cycle IN ('monthly', 'annual')),
  CONSTRAINT base_fee_types_base_code_unique UNIQUE (base_id, code)
);

CREATE INDEX IF NOT EXISTS base_fee_types_base_idx
  ON base_fee_types (base_id, is_active, sort_order);

CREATE TABLE IF NOT EXISTS meter_fee_configs (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  meter_id varchar(36) NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  fee_type_id varchar(36) NOT NULL REFERENCES base_fee_types(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  responsibility_type varchar(20) NOT NULL DEFAULT 'base',
  enterprise_id varchar(36),
  account_number varchar(100),
  provider varchar(255),
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone,
  CONSTRAINT meter_fee_configs_responsibility_check CHECK (responsibility_type IN ('base', 'customer')),
  CONSTRAINT meter_fee_configs_meter_type_unique UNIQUE (meter_id, fee_type_id)
);

CREATE INDEX IF NOT EXISTS meter_fee_configs_meter_idx
  ON meter_fee_configs (meter_id, enabled);

ALTER TABLE property_utility_payments
  ADD COLUMN IF NOT EXISTS fee_type_id varchar(36) REFERENCES base_fee_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS property_utility_payments_fee_type_idx
  ON property_utility_payments (fee_type_id, billing_period);

INSERT INTO base_fee_types (base_id, code, name, billing_cycle, is_builtin, sort_order)
SELECT base.id, fee.code, fee.name, fee.billing_cycle, true, fee.sort_order
FROM bases base
CROSS JOIN (VALUES
  ('electricity', '电费', 'monthly', 10),
  ('water', '水费', 'monthly', 20),
  ('heating', '取暖费', 'annual', 30),
  ('property_fee', '物业费', 'annual', 40),
  ('rent', '租金', 'monthly', 50),
  ('telephone', '电话费', 'monthly', 60),
  ('network', '宽带费', 'monthly', 70)
) AS fee(code, name, billing_cycle, sort_order)
ON CONFLICT (base_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  billing_cycle = EXCLUDED.billing_cycle,
  is_builtin = true;

INSERT INTO meter_fee_configs (
  meter_id,
  fee_type_id,
  enabled,
  responsibility_type,
  enterprise_id,
  account_number,
  provider
)
SELECT
  meter.id,
  fee.id,
  CASE fee.code
    WHEN 'electricity' THEN meter.electricity_enabled
    WHEN 'water' THEN meter.water_enabled
    WHEN 'heating' THEN meter.heating_enabled
    WHEN 'property_fee' THEN meter.property_fee_enabled
    WHEN 'network' THEN meter.network_enabled
    ELSE false
  END,
  CASE fee.code
    WHEN 'electricity' THEN COALESCE(meter.electricity_type, 'base')
    WHEN 'water' THEN COALESCE(meter.water_type, 'base')
    WHEN 'heating' THEN COALESCE(meter.heating_type, 'base')
    WHEN 'property_fee' THEN COALESCE(meter.property_fee_type, 'base')
    WHEN 'network' THEN COALESCE(meter.network_type, 'base')
    ELSE 'base'
  END,
  CASE fee.code
    WHEN 'electricity' THEN meter.electricity_enterprise_id
    WHEN 'water' THEN meter.water_enterprise_id
    WHEN 'heating' THEN meter.heating_enterprise_id
    WHEN 'property_fee' THEN meter.property_fee_enterprise_id
    WHEN 'network' THEN meter.network_enterprise_id
    ELSE NULL
  END,
  CASE fee.code
    WHEN 'electricity' THEN meter.electricity_number
    WHEN 'water' THEN meter.water_number
    WHEN 'heating' THEN meter.heating_number
    WHEN 'network' THEN meter.network_number
    ELSE NULL
  END,
  CASE fee.code
    WHEN 'electricity' THEN meter.electricity_provider
    WHEN 'water' THEN meter.water_provider
    ELSE NULL
  END
FROM meters meter
JOIN base_fee_types fee ON fee.base_id = meter.base_id
ON CONFLICT (meter_id, fee_type_id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  responsibility_type = EXCLUDED.responsibility_type,
  enterprise_id = EXCLUDED.enterprise_id,
  account_number = EXCLUDED.account_number,
  provider = EXCLUDED.provider;

UPDATE property_utility_payments payment
SET fee_type_id = fee.id
FROM meters meter
JOIN base_fee_types fee ON fee.base_id = meter.base_id
WHERE payment.meter_id = meter.id
  AND payment.utility_type = fee.code
  AND payment.fee_type_id IS NULL;

CREATE OR REPLACE FUNCTION seed_base_fee_types()
RETURNS trigger AS $$
BEGIN
  INSERT INTO base_fee_types (base_id, code, name, billing_cycle, is_builtin, sort_order)
  VALUES
    (NEW.id, 'electricity', '电费', 'monthly', true, 10),
    (NEW.id, 'water', '水费', 'monthly', true, 20),
    (NEW.id, 'heating', '取暖费', 'annual', true, 30),
    (NEW.id, 'property_fee', '物业费', 'annual', true, 40),
    (NEW.id, 'rent', '租金', 'monthly', true, 50),
    (NEW.id, 'telephone', '电话费', 'monthly', true, 60),
    (NEW.id, 'network', '宽带费', 'monthly', true, 70)
  ON CONFLICT (base_id, code) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bases_seed_fee_types_trigger ON bases;
CREATE TRIGGER bases_seed_fee_types_trigger
AFTER INSERT ON bases
FOR EACH ROW EXECUTE FUNCTION seed_base_fee_types();

COMMENT ON TABLE base_fee_types IS '基地级费用类型目录';
COMMENT ON TABLE meter_fee_configs IS '物业适用费用、责任主体与账户配置';
COMMENT ON COLUMN property_utility_payments.fee_type_id IS '账单关联的基地费用类型';
