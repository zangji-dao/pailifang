BEGIN;

ALTER TABLE meters
  ADD COLUMN IF NOT EXISTS electricity_provider varchar(255),
  ADD COLUMN IF NOT EXISTS electricity_charge_inst varchar(100),
  ADD COLUMN IF NOT EXISTS water_provider varchar(255),
  ADD COLUMN IF NOT EXISTS water_charge_inst varchar(100);

COMMENT ON COLUMN meters.electricity_provider IS '电费收费机构名称';
COMMENT ON COLUMN meters.electricity_charge_inst IS '支付宝生活缴费电费机构编码';
COMMENT ON COLUMN meters.water_provider IS '水费收费机构名称';
COMMENT ON COLUMN meters.water_charge_inst IS '支付宝生活缴费水费机构编码';

COMMIT;
