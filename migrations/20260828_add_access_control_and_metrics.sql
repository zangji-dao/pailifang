CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE bases ADD COLUMN IF NOT EXISTS organization_id varchar(36);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS organization_id varchar(36);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS base_id varchar(36);

CREATE TABLE IF NOT EXISTS organizations (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(255) NOT NULL,
  code varchar(100) NOT NULL UNIQUE,
  type varchar(30) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone
);

CREATE TABLE IF NOT EXISTS organization_members (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id varchar(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status varchar(20) NOT NULL DEFAULT 'active',
  is_owner boolean NOT NULL DEFAULT false,
  invited_by varchar(36) REFERENCES users(id) ON DELETE SET NULL,
  joined_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone,
  CONSTRAINT organization_members_org_user_unique UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS roles (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  code varchar(80) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  organization_type varchar(30),
  description text,
  is_system boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone
);

CREATE TABLE IF NOT EXISTS permissions (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  code varchar(100) NOT NULL UNIQUE,
  resource varchar(60) NOT NULL,
  action varchar(40) NOT NULL,
  description text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id varchar(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id varchar(36) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  CONSTRAINT role_permissions_unique UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS member_roles (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id varchar(36) NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  role_id varchar(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  scope_type varchar(30) NOT NULL DEFAULT 'organization',
  scope_id varchar(36),
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT member_roles_unique UNIQUE (member_id, role_id, scope_type, scope_id)
);

CREATE TABLE IF NOT EXISTS organization_bases (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id varchar(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  base_id varchar(36) NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  relationship_type varchar(30) NOT NULL DEFAULT 'operator',
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT organization_bases_unique UNIQUE (organization_id, base_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS organization_enterprises (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id varchar(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enterprise_id varchar(36) NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  relationship_type varchar(30) NOT NULL DEFAULT 'owner',
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT organization_enterprises_unique UNIQUE (organization_id, enterprise_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS service_engagements (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_organization_id varchar(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_organization_id varchar(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status varchar(20) NOT NULL DEFAULT 'pending',
  starts_on date,
  ends_on date,
  created_by varchar(36) REFERENCES users(id) ON DELETE SET NULL,
  approved_by varchar(36) REFERENCES users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone,
  CONSTRAINT service_engagements_distinct_orgs CHECK (enterprise_organization_id <> provider_organization_id)
);

CREATE TABLE IF NOT EXISTS service_grants (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  engagement_id varchar(36) NOT NULL REFERENCES service_engagements(id) ON DELETE CASCADE,
  app_code varchar(60) NOT NULL,
  permission_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  scope_type varchar(30) NOT NULL DEFAULT 'enterprise',
  scope_id varchar(36),
  can_export boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone,
  CONSTRAINT service_grants_unique UNIQUE (engagement_id, app_code, scope_type, scope_id)
);

CREATE TABLE IF NOT EXISTS app_subscriptions (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id varchar(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  app_code varchar(60) NOT NULL,
  plan_code varchar(60) NOT NULL DEFAULT 'standard',
  status varchar(20) NOT NULL DEFAULT 'active',
  starts_on date NOT NULL DEFAULT CURRENT_DATE,
  ends_on date,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone,
  CONSTRAINT app_subscriptions_unique UNIQUE (organization_id, app_code)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  active_organization_id varchar(36) REFERENCES organizations(id) ON DELETE SET NULL,
  expires_at timestamp without time zone NOT NULL,
  last_seen_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_metric_reports (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id varchar(36) NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  base_id varchar(36) NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  reporting_period date NOT NULL,
  revenue numeric(18,2) NOT NULL DEFAULT 0,
  tax_total numeric(18,2) NOT NULL DEFAULT 0,
  tax_local numeric(18,2) NOT NULL DEFAULT 0,
  employees integer NOT NULL DEFAULT 0,
  local_employees integer NOT NULL DEFAULT 0,
  investment numeric(18,2) NOT NULL DEFAULT 0,
  source_type varchar(30) NOT NULL DEFAULT 'manual',
  status varchar(20) NOT NULL DEFAULT 'draft',
  submitted_by varchar(36) REFERENCES users(id) ON DELETE SET NULL,
  submitted_at timestamp without time zone,
  reviewed_by varchar(36) REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamp without time zone,
  review_comment text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone,
  CONSTRAINT business_metric_reports_enterprise_period_unique UNIQUE (enterprise_id, reporting_period),
  CONSTRAINT business_metric_reports_nonnegative CHECK (
    revenue >= 0 AND tax_total >= 0 AND tax_local >= 0 AND employees >= 0 AND local_employees >= 0 AND investment >= 0
  )
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id varchar(36) REFERENCES users(id) ON DELETE SET NULL,
  organization_id varchar(36) REFERENCES organizations(id) ON DELETE SET NULL,
  action varchar(100) NOT NULL,
  resource_type varchar(80) NOT NULL,
  resource_id varchar(36),
  ip_address varchar(64),
  user_agent text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS organizations_type_status_idx ON organizations(type, status);
CREATE INDEX IF NOT EXISTS organization_members_user_status_idx ON organization_members(user_id, status);
CREATE INDEX IF NOT EXISTS member_roles_member_idx ON member_roles(member_id);
CREATE INDEX IF NOT EXISTS service_engagements_provider_status_idx ON service_engagements(provider_organization_id, status);
CREATE INDEX IF NOT EXISTS service_engagements_enterprise_status_idx ON service_engagements(enterprise_organization_id, status);
CREATE INDEX IF NOT EXISTS auth_sessions_user_active_idx ON auth_sessions(user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS business_metric_reports_base_period_idx ON business_metric_reports(base_id, reporting_period);
CREATE INDEX IF NOT EXISTS business_metric_reports_status_idx ON business_metric_reports(status);
CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bases_organization_id_idx ON bases(organization_id);
CREATE INDEX IF NOT EXISTS enterprises_organization_id_idx ON enterprises(organization_id);
CREATE INDEX IF NOT EXISTS enterprises_base_id_idx ON enterprises(base_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bases_organization_id_fkey') THEN
    ALTER TABLE bases ADD CONSTRAINT bases_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enterprises_organization_id_fkey') THEN
    ALTER TABLE enterprises ADD CONSTRAINT enterprises_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enterprises_base_id_fkey') THEN
    ALTER TABLE enterprises ADD CONSTRAINT enterprises_base_id_fkey FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION sync_base_organization_before_write()
RETURNS trigger AS $$
DECLARE
  synced_organization_id varchar(36);
BEGIN
  INSERT INTO organizations (id, name, code, type, status, metadata, updated_at)
  VALUES (
    COALESCE(NEW.organization_id, gen_random_uuid()::text),
    COALESCE(NULLIF(NEW.management_company_name, ''), NEW.name),
    'park-' || NEW.id,
    'park',
    CASE WHEN NEW.status IN ('inactive', 'disabled', 'terminated') THEN 'inactive' ELSE 'active' END,
    jsonb_build_object('sourceBaseId', NEW.id),
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO synced_organization_id;

  NEW.organization_id := synced_organization_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_base_organization_after_write()
RETURNS trigger AS $$
BEGIN
  INSERT INTO organization_bases (id, organization_id, base_id, relationship_type)
  VALUES (gen_random_uuid(), NEW.organization_id, NEW.id, 'operator')
  ON CONFLICT (organization_id, base_id, relationship_type) DO NOTHING;
  INSERT INTO app_subscriptions (id, organization_id, app_code, plan_code, status)
  VALUES (gen_random_uuid(), NEW.organization_id, 'park-management', 'local', 'active')
  ON CONFLICT (organization_id, app_code) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_enterprise_organization_before_write()
RETURNS trigger AS $$
DECLARE
  synced_organization_id varchar(36);
BEGIN
  INSERT INTO organizations (id, name, code, type, status, metadata, updated_at)
  VALUES (
    COALESCE(NEW.organization_id, gen_random_uuid()::text),
    NEW.name,
    'enterprise-' || NEW.id,
    'enterprise',
    CASE WHEN NEW.status IN ('inactive', 'disabled', 'terminated') THEN 'inactive' ELSE 'active' END,
    jsonb_build_object('sourceEnterpriseId', NEW.id),
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO synced_organization_id;

  NEW.organization_id := synced_organization_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_enterprise_organization_after_write()
RETURNS trigger AS $$
BEGIN
  INSERT INTO organization_enterprises (id, organization_id, enterprise_id, relationship_type)
  VALUES (gen_random_uuid(), NEW.organization_id, NEW.id, 'owner')
  ON CONFLICT (organization_id, enterprise_id, relationship_type) DO NOTHING;
  INSERT INTO app_subscriptions (id, organization_id, app_code, plan_code, status)
  SELECT gen_random_uuid(), NEW.organization_id, app_code, 'local', 'active'
  FROM (VALUES ('accounting'), ('inventory'), ('hr')) AS apps(app_code)
  ON CONFLICT (organization_id, app_code) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bases_sync_organization_before_write ON bases;
CREATE TRIGGER bases_sync_organization_before_write
BEFORE INSERT OR UPDATE OF name, status, management_company_name ON bases
FOR EACH ROW EXECUTE FUNCTION sync_base_organization_before_write();

DROP TRIGGER IF EXISTS bases_sync_organization_after_write ON bases;
CREATE TRIGGER bases_sync_organization_after_write
AFTER INSERT OR UPDATE OF organization_id ON bases
FOR EACH ROW EXECUTE FUNCTION sync_base_organization_after_write();

DROP TRIGGER IF EXISTS enterprises_sync_organization_before_write ON enterprises;
CREATE TRIGGER enterprises_sync_organization_before_write
BEFORE INSERT OR UPDATE OF name, status ON enterprises
FOR EACH ROW EXECUTE FUNCTION sync_enterprise_organization_before_write();

DROP TRIGGER IF EXISTS enterprises_sync_organization_after_write ON enterprises;
CREATE TRIGGER enterprises_sync_organization_after_write
AFTER INSERT OR UPDATE OF organization_id ON enterprises
FOR EACH ROW EXECUTE FUNCTION sync_enterprise_organization_after_write();

INSERT INTO permissions (id, code, resource, action, description)
SELECT gen_random_uuid(), code, resource, action, description
FROM (VALUES
  ('platform.manage', 'platform', 'manage', '平台级管理'),
  ('organization.manage', 'organization', 'manage', '组织信息管理'),
  ('membership.manage', 'membership', 'manage', '组织成员与角色管理'),
  ('base.read', 'base', 'read', '查看基地信息'),
  ('base.manage', 'base', 'manage', '管理基地信息'),
  ('enterprise.read', 'enterprise', 'read', '查看企业信息'),
  ('enterprise.manage', 'enterprise', 'manage', '管理企业信息'),
  ('metrics.read', 'metrics', 'read', '查看经营数据'),
  ('metrics.submit', 'metrics', 'submit', '填报经营数据'),
  ('metrics.review', 'metrics', 'review', '审核经营数据'),
  ('metrics.manage', 'metrics', 'manage', '管理全部经营数据'),
  ('dashboard.park.read', 'dashboard.park', 'read', '查看园区经营看板'),
  ('dashboard.enterprise.read', 'dashboard.enterprise', 'read', '查看企业经营看板'),
  ('delegation.manage', 'delegation', 'manage', '管理服务委托'),
  ('ledger.read', 'ledger', 'read', '查看账务数据'),
  ('ledger.write', 'ledger', 'write', '录入账务数据'),
  ('ledger.review', 'ledger', 'review', '复核账务数据'),
  ('inventory.read', 'inventory', 'read', '查看进销存数据'),
  ('inventory.manage', 'inventory', 'manage', '管理进销存数据'),
  ('hr.read', 'hr', 'read', '查看人事数据'),
  ('hr.manage', 'hr', 'manage', '管理人事数据'),
  ('audit.read', 'audit', 'read', '查看审计日志')
) AS values_table(code, resource, action, description)
ON CONFLICT (code) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description;

INSERT INTO roles (id, code, name, organization_type, description, is_system)
SELECT gen_random_uuid(), code, name, organization_type, description, true
FROM (VALUES
  ('platform_super_admin', '平台超级管理员', 'platform', '拥有全部平台权限'),
  ('platform_admin', '平台管理员', 'platform', '负责平台日常运营与配置'),
  ('platform_accountant', '平台财务人员', 'platform', '负责平台账务和经营数据'),
  ('platform_sales', '平台招商人员', 'platform', '负责基地和企业业务管理'),
  ('platform_staff', '平台普通成员', 'platform', '拥有基础查看权限'),
  ('park_admin', '园区管理员', 'park', '管理园区、企业和经营数据'),
  ('base_manager', '基地业务负责人', 'park', '负责入驻与经营数据流程'),
  ('data_operator', '数据填报员', 'park', '负责经营数据填报'),
  ('data_reviewer', '数据审核员', 'park', '负责经营数据审核'),
  ('enterprise_owner', '企业负责人', 'enterprise', '企业组织所有者'),
  ('enterprise_admin', '企业管理员', 'enterprise', '企业成员与应用管理员'),
  ('enterprise_finance', '企业财务', 'enterprise', '负责企业财务与经营数据'),
  ('enterprise_reporter', '企业填报员', 'enterprise', '负责企业经营数据填报'),
  ('agency_admin', '服务机构管理员', 'service', '管理服务团队与企业委托'),
  ('agency_accountant', '代账会计', 'service', '处理受托企业账务和填报'),
  ('agency_reviewer', '代账复核员', 'service', '复核受托企业账务'),
  ('regulator_viewer', '监管查看员', 'regulator', '查看授权范围内的汇总数据')
) AS values_table(code, name, organization_type, description)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  organization_type = EXCLUDED.organization_type,
  description = EXCLUDED.description;

WITH role_permission_map(role_code, permission_code) AS (VALUES
  ('platform_admin', 'organization.manage'), ('platform_admin', 'membership.manage'),
  ('platform_admin', 'base.read'), ('platform_admin', 'base.manage'),
  ('platform_admin', 'enterprise.read'), ('platform_admin', 'enterprise.manage'),
  ('platform_admin', 'metrics.read'), ('platform_admin', 'metrics.submit'),
  ('platform_admin', 'metrics.review'), ('platform_admin', 'metrics.manage'),
  ('platform_admin', 'dashboard.park.read'), ('platform_admin', 'dashboard.enterprise.read'),
  ('platform_admin', 'delegation.manage'), ('platform_admin', 'audit.read'),
  ('platform_accountant', 'base.read'), ('platform_accountant', 'enterprise.read'),
  ('platform_accountant', 'metrics.read'), ('platform_accountant', 'metrics.submit'),
  ('platform_accountant', 'metrics.review'), ('platform_accountant', 'dashboard.park.read'),
  ('platform_accountant', 'ledger.read'), ('platform_accountant', 'ledger.write'),
  ('platform_accountant', 'ledger.review'),
  ('platform_sales', 'base.read'), ('platform_sales', 'base.manage'),
  ('platform_sales', 'enterprise.read'), ('platform_sales', 'enterprise.manage'),
  ('platform_sales', 'metrics.read'), ('platform_sales', 'dashboard.park.read'),
  ('platform_staff', 'base.read'), ('platform_staff', 'enterprise.read'),
  ('platform_staff', 'metrics.read'), ('platform_staff', 'dashboard.park.read'),
  ('park_admin', 'organization.manage'), ('park_admin', 'membership.manage'),
  ('park_admin', 'base.read'), ('park_admin', 'base.manage'),
  ('park_admin', 'enterprise.read'), ('park_admin', 'enterprise.manage'),
  ('park_admin', 'metrics.read'), ('park_admin', 'metrics.submit'),
  ('park_admin', 'metrics.review'), ('park_admin', 'dashboard.park.read'),
  ('park_admin', 'delegation.manage'), ('park_admin', 'audit.read'),
  ('base_manager', 'base.read'), ('base_manager', 'base.manage'),
  ('base_manager', 'enterprise.read'), ('base_manager', 'enterprise.manage'),
  ('base_manager', 'metrics.read'), ('base_manager', 'metrics.submit'),
  ('base_manager', 'metrics.review'), ('base_manager', 'dashboard.park.read'),
  ('data_operator', 'base.read'), ('data_operator', 'enterprise.read'),
  ('data_operator', 'metrics.read'), ('data_operator', 'metrics.submit'),
  ('data_operator', 'dashboard.park.read'),
  ('data_reviewer', 'base.read'), ('data_reviewer', 'enterprise.read'),
  ('data_reviewer', 'metrics.read'), ('data_reviewer', 'metrics.review'),
  ('data_reviewer', 'dashboard.park.read'),
  ('enterprise_owner', 'organization.manage'), ('enterprise_owner', 'membership.manage'),
  ('enterprise_owner', 'enterprise.read'), ('enterprise_owner', 'enterprise.manage'),
  ('enterprise_owner', 'metrics.read'), ('enterprise_owner', 'metrics.submit'),
  ('enterprise_owner', 'dashboard.enterprise.read'), ('enterprise_owner', 'delegation.manage'),
  ('enterprise_owner', 'ledger.read'), ('enterprise_owner', 'ledger.write'),
  ('enterprise_owner', 'ledger.review'), ('enterprise_owner', 'inventory.read'),
  ('enterprise_owner', 'inventory.manage'), ('enterprise_owner', 'hr.read'),
  ('enterprise_owner', 'hr.manage'),
  ('enterprise_admin', 'organization.manage'), ('enterprise_admin', 'membership.manage'),
  ('enterprise_admin', 'enterprise.read'), ('enterprise_admin', 'enterprise.manage'),
  ('enterprise_admin', 'metrics.read'), ('enterprise_admin', 'metrics.submit'),
  ('enterprise_admin', 'dashboard.enterprise.read'), ('enterprise_admin', 'delegation.manage'),
  ('enterprise_admin', 'ledger.read'), ('enterprise_admin', 'ledger.write'),
  ('enterprise_admin', 'inventory.read'), ('enterprise_admin', 'inventory.manage'),
  ('enterprise_admin', 'hr.read'), ('enterprise_admin', 'hr.manage'),
  ('enterprise_finance', 'enterprise.read'), ('enterprise_finance', 'metrics.read'),
  ('enterprise_finance', 'metrics.submit'), ('enterprise_finance', 'dashboard.enterprise.read'),
  ('enterprise_finance', 'ledger.read'), ('enterprise_finance', 'ledger.write'),
  ('enterprise_finance', 'ledger.review'),
  ('enterprise_reporter', 'enterprise.read'), ('enterprise_reporter', 'metrics.read'),
  ('enterprise_reporter', 'metrics.submit'), ('enterprise_reporter', 'dashboard.enterprise.read'),
  ('agency_admin', 'organization.manage'), ('agency_admin', 'membership.manage'),
  ('agency_admin', 'enterprise.read'), ('agency_admin', 'metrics.read'),
  ('agency_admin', 'metrics.submit'), ('agency_admin', 'delegation.manage'),
  ('agency_admin', 'ledger.read'), ('agency_admin', 'ledger.write'),
  ('agency_admin', 'ledger.review'),
  ('agency_accountant', 'enterprise.read'), ('agency_accountant', 'metrics.read'),
  ('agency_accountant', 'metrics.submit'), ('agency_accountant', 'ledger.read'),
  ('agency_accountant', 'ledger.write'),
  ('agency_reviewer', 'enterprise.read'), ('agency_reviewer', 'metrics.read'),
  ('agency_reviewer', 'ledger.read'), ('agency_reviewer', 'ledger.review'),
  ('regulator_viewer', 'base.read'), ('regulator_viewer', 'enterprise.read'),
  ('regulator_viewer', 'metrics.read'), ('regulator_viewer', 'dashboard.park.read')
), pairs AS (
  SELECT roles.id AS role_id, permissions.id AS permission_id
  FROM role_permission_map
  JOIN roles ON roles.code = role_permission_map.role_code
  JOIN permissions ON permissions.code = role_permission_map.permission_code
)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), role_id, permission_id FROM pairs
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'platform_super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO organizations (id, name, code, type, status)
VALUES (gen_random_uuid(), 'Π立方企业服务平台', 'platform', 'platform', 'active')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, status = 'active';

INSERT INTO organizations (id, name, code, type, status, metadata)
SELECT gen_random_uuid(), COALESCE(NULLIF(management_company_name, ''), name), 'park-' || id, 'park', status,
       jsonb_build_object('sourceBaseId', id)
FROM bases
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

UPDATE bases
SET organization_id = organizations.id
FROM organizations
WHERE organizations.code = 'park-' || bases.id
  AND bases.organization_id IS NULL;

INSERT INTO organization_bases (id, organization_id, base_id, relationship_type)
SELECT gen_random_uuid(), organizations.id, bases.id, 'operator'
FROM bases
JOIN organizations ON organizations.code = 'park-' || bases.id
ON CONFLICT (organization_id, base_id, relationship_type) DO NOTHING;

INSERT INTO organizations (id, name, code, type, status, metadata)
SELECT gen_random_uuid(), name, 'enterprise-' || id, 'enterprise', status,
       jsonb_build_object('sourceEnterpriseId', id)
FROM enterprises
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

UPDATE enterprises
SET organization_id = organizations.id
FROM organizations
WHERE organizations.code = 'enterprise-' || enterprises.id
  AND enterprises.organization_id IS NULL;

UPDATE enterprises
SET base_id = (SELECT id FROM bases WHERE status = 'active' ORDER BY created_at LIMIT 1)
WHERE base_id IS NULL
  AND (SELECT count(*) FROM bases WHERE status = 'active') = 1;

INSERT INTO organization_enterprises (id, organization_id, enterprise_id, relationship_type)
SELECT gen_random_uuid(), organizations.id, enterprises.id, 'owner'
FROM enterprises
JOIN organizations ON organizations.code = 'enterprise-' || enterprises.id
ON CONFLICT (organization_id, enterprise_id, relationship_type) DO NOTHING;

INSERT INTO organization_members (id, organization_id, user_id, status, is_owner)
SELECT gen_random_uuid(), organizations.id, users.id, 'active', users.role = 'admin'
FROM users
CROSS JOIN organizations
WHERE organizations.code = 'platform'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO member_roles (id, member_id, role_id, scope_type, scope_id)
SELECT gen_random_uuid(), organization_members.id, roles.id, 'organization', organization_members.organization_id
FROM organization_members
JOIN organizations ON organizations.id = organization_members.organization_id AND organizations.code = 'platform'
JOIN users ON users.id = organization_members.user_id
JOIN roles ON roles.code = CASE users.role
  WHEN 'admin' THEN 'platform_super_admin'
  WHEN 'accountant' THEN 'platform_accountant'
  WHEN 'sales' THEN 'platform_sales'
  ELSE 'platform_staff'
END
ON CONFLICT (member_id, role_id, scope_type, scope_id) DO NOTHING;

INSERT INTO app_subscriptions (id, organization_id, app_code, plan_code, status)
SELECT gen_random_uuid(), id, 'park-management', 'local', 'active'
FROM organizations
WHERE type IN ('platform', 'park')
ON CONFLICT (organization_id, app_code) DO NOTHING;

INSERT INTO app_subscriptions (id, organization_id, app_code, plan_code, status)
SELECT gen_random_uuid(), id, app_code, 'local', 'active'
FROM organizations
CROSS JOIN (VALUES ('accounting'), ('inventory'), ('hr')) AS apps(app_code)
WHERE type IN ('platform', 'enterprise', 'service')
ON CONFLICT (organization_id, app_code) DO NOTHING;
