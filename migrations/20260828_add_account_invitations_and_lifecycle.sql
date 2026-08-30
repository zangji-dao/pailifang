ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS admin_email varchar(255);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS admin_name varchar(128);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS admin_phone varchar(20);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS process_status varchar(30) NOT NULL DEFAULT 'new';
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS enterprise_code varchar(80);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS business_scope text;
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS space_id varchar(36);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS registration_number varchar(100);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS registered_capital varchar(100);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS establish_date date;

CREATE UNIQUE INDEX IF NOT EXISTS enterprises_enterprise_code_unique
  ON enterprises(enterprise_code)
  WHERE enterprise_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS account_invitations (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id varchar(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  name varchar(128) NOT NULL,
  phone varchar(20),
  role_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  token_hash varchar(64) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  expires_at timestamp without time zone NOT NULL,
  invited_by varchar(36) REFERENCES users(id) ON DELETE SET NULL,
  accepted_user_id varchar(36) REFERENCES users(id) ON DELETE SET NULL,
  accepted_at timestamp without time zone,
  revoked_at timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone,
  CONSTRAINT account_invitations_status_check CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS account_invitations_token_hash_key
  ON account_invitations(token_hash);
CREATE INDEX IF NOT EXISTS account_invitations_org_status_idx
  ON account_invitations(organization_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS account_invitations_pending_org_email_unique
  ON account_invitations(organization_id, lower(email))
  WHERE status = 'pending';

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
    CASE
      WHEN NEW.status IN ('inactive', 'disabled', 'terminated') OR NEW.process_status = 'terminated' THEN 'inactive'
      ELSE 'active'
    END,
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

DROP TRIGGER IF EXISTS enterprises_sync_organization_before_write ON enterprises;
CREATE TRIGGER enterprises_sync_organization_before_write
BEFORE INSERT OR UPDATE OF name, status, process_status ON enterprises
FOR EACH ROW EXECUTE FUNCTION sync_enterprise_organization_before_write();

CREATE OR REPLACE FUNCTION recycle_enterprise_accounts_after_status_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.organization_id IS NOT NULL
     AND (NEW.status IN ('inactive', 'disabled', 'terminated') OR NEW.process_status = 'terminated') THEN
    UPDATE organization_members
    SET status = 'disabled', updated_at = CURRENT_TIMESTAMP
    WHERE organization_id = NEW.organization_id AND status <> 'disabled';

    UPDATE auth_sessions
    SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
    WHERE active_organization_id = NEW.organization_id AND revoked_at IS NULL;

    UPDATE account_invitations
    SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE organization_id = NEW.organization_id AND status = 'pending';

    UPDATE users AS user_record
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE EXISTS (
      SELECT 1
      FROM organization_members AS disabled_member
      WHERE disabled_member.user_id = user_record.id
        AND disabled_member.organization_id = NEW.organization_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM organization_members AS active_member
      INNER JOIN organizations AS active_organization
        ON active_organization.id = active_member.organization_id
      WHERE active_member.user_id = user_record.id
        AND active_member.status = 'active'
        AND active_organization.status = 'active'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enterprises_recycle_accounts_after_status_change ON enterprises;
CREATE TRIGGER enterprises_recycle_accounts_after_status_change
AFTER UPDATE OF status, process_status ON enterprises
FOR EACH ROW EXECUTE FUNCTION recycle_enterprise_accounts_after_status_change();
