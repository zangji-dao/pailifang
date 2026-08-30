ALTER TABLE bases
  ADD COLUMN IF NOT EXISTS property_fee_mode character varying(20) NOT NULL DEFAULT 'charged',
  ADD COLUMN IF NOT EXISTS property_fee_billing_cycle character varying(20) NOT NULL DEFAULT 'annual';

COMMENT ON COLUMN bases.property_fee_mode IS '物业费政策: charged=收费, free=免收';
COMMENT ON COLUMN bases.property_fee_billing_cycle IS '物业费计费周期: annual=年度';

UPDATE bases
SET
  property_fee_mode = 'free',
  property_fee_billing_cycle = 'annual',
  updated_at = CURRENT_TIMESTAMP
WHERE id = '00e03010-ad87-468d-96f3-ca9ad3433470';
