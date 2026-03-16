-- 创建测试用户
-- 注意：这只是一个示例，生产环境应该使用 bcrypt 加密密码

INSERT INTO users (id, email, password, name, role, phone, is_active, created_at, updated_at)
VALUES
  ('admin-test-001', 'admin@test.com', 'admin123', '管理员', 'admin', '13800138000', true, NOW(), NOW()),
  ('accountant-test-001', 'accountant@test.com', 'acc123', '张会计', 'accountant', '13800138001', true, NOW(), NOW()),
  ('sales-test-001', 'sales@test.com', 'sales123', '李销售', 'sales', '13800138002', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
