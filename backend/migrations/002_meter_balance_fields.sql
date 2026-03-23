-- 迁移脚本：修改水电暖网字段
-- 执行方式：在 Supabase SQL Editor 中执行

-- 1. 删除旧的状态字段
ALTER TABLE meters DROP COLUMN IF EXISTS electricity_status;
ALTER TABLE meters DROP COLUMN IF EXISTS water_status;
ALTER TABLE meters DROP COLUMN IF EXISTS heating_status;
ALTER TABLE meters DROP COLUMN IF EXISTS network_status;

-- 2. 添加电表余额字段
ALTER TABLE meters ADD COLUMN IF NOT EXISTS electricity_balance DECIMAL(10, 2);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS electricity_balance_updated_at TIMESTAMP;

-- 3. 添加水表余额字段
ALTER TABLE meters ADD COLUMN IF NOT EXISTS water_balance DECIMAL(10, 2);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS water_balance_updated_at TIMESTAMP;

-- 4. 添加取暖是否欠费字段
ALTER TABLE meters ADD COLUMN IF NOT EXISTS heating_arrears BOOLEAN DEFAULT FALSE;

-- 5. 添加网络是否欠费字段
ALTER TABLE meters ADD COLUMN IF NOT EXISTS network_arrears BOOLEAN DEFAULT FALSE;

-- 6. 添加注释
COMMENT ON COLUMN meters.electricity_balance IS '电表余额（支付宝获取）';
COMMENT ON COLUMN meters.electricity_balance_updated_at IS '电表余额更新时间';
COMMENT ON COLUMN meters.water_balance IS '水表余额（支付宝获取）';
COMMENT ON COLUMN meters.water_balance_updated_at IS '水表余额更新时间';
COMMENT ON COLUMN meters.heating_arrears IS '取暖费是否欠费';
COMMENT ON COLUMN meters.network_arrears IS '网络费是否欠费';
