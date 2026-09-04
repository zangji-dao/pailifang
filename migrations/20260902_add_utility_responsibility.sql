ALTER TABLE meters
  ADD COLUMN IF NOT EXISTS property_fee_type varchar(20) DEFAULT 'base',
  ADD COLUMN IF NOT EXISTS property_fee_enterprise_id varchar(36),
  ADD COLUMN IF NOT EXISTS network_enterprise_id varchar(36);

UPDATE meters
SET property_fee_type = 'base'
WHERE property_fee_type IS NULL;

COMMENT ON COLUMN meters.property_fee_type IS '物业费承担方式：base=管理方承担，customer=使用方承担';
COMMENT ON COLUMN meters.property_fee_enterprise_id IS '承担物业费的基地入驻企业';
COMMENT ON COLUMN meters.network_enterprise_id IS '承担通讯费的基地入驻企业';
