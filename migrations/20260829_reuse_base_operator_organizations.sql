BEGIN;

CREATE OR REPLACE FUNCTION normalize_base_operator_credit_code(raw_credit_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    upper(regexp_replace(COALESCE(raw_credit_code, ''), '[^0-9A-Za-z]', '', 'g')),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION sync_base_organization_before_write()
RETURNS trigger AS $$
DECLARE
  operator_organization record;
BEGIN
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION '基地必须选择已录入的运营机构';
  END IF;

  SELECT id, name, type, status, metadata
  INTO operator_organization
  FROM organizations
  WHERE id = NEW.organization_id;

  IF NOT FOUND OR operator_organization.type <> 'park' THEN
    RAISE EXCEPTION '基地关联的组织不是有效的运营机构';
  END IF;

  NEW.management_company_name := operator_organization.name;
  NEW.management_company_credit_code := NULLIF(operator_organization.metadata ->> 'managementCompanyCreditCode', '');
  NEW.management_company_legal_person := NULLIF(operator_organization.metadata ->> 'managementCompanyLegalPerson', '');
  NEW.management_company_address := NULLIF(operator_organization.metadata ->> 'managementCompanyAddress', '');
  NEW.management_company_phone := NULLIF(operator_organization.metadata ->> 'managementCompanyPhone', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_base_organization_after_write()
RETURNS trigger AS $$
BEGIN
  DELETE FROM organization_bases
  WHERE base_id = NEW.id
    AND relationship_type = 'operator'
    AND organization_id <> NEW.organization_id;

  INSERT INTO organization_bases (id, organization_id, base_id, relationship_type)
  VALUES (gen_random_uuid(), NEW.organization_id, NEW.id, 'operator')
  ON CONFLICT (organization_id, base_id, relationship_type) DO NOTHING;

  INSERT INTO app_subscriptions (id, organization_id, app_code, plan_code, status)
  VALUES (gen_random_uuid(), NEW.organization_id, 'park-management', 'local', 'active')
  ON CONFLICT (organization_id, app_code) DO UPDATE SET
    status = 'active',
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bases_sync_organization_before_write ON bases;
CREATE TRIGGER bases_sync_organization_before_write
BEFORE INSERT OR UPDATE OF
  name,
  status,
  organization_id,
  management_company_name,
  management_company_credit_code,
  management_company_legal_person,
  management_company_address,
  management_company_phone
ON bases
FOR EACH ROW EXECUTE FUNCTION sync_base_organization_before_write();

DROP TRIGGER IF EXISTS bases_sync_organization_after_write ON bases;
CREATE TRIGGER bases_sync_organization_after_write
AFTER INSERT OR UPDATE ON bases
FOR EACH ROW EXECUTE FUNCTION sync_base_organization_after_write();

CREATE OR REPLACE FUNCTION sync_operator_organization_to_bases_after_write()
RETURNS trigger AS $$
BEGIN
  IF NEW.type = 'park' THEN
    UPDATE bases
    SET organization_id = NEW.id
    WHERE organization_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organizations_sync_operator_to_bases_after_write ON organizations;
CREATE TRIGGER organizations_sync_operator_to_bases_after_write
AFTER UPDATE OF name, metadata ON organizations
FOR EACH ROW EXECUTE FUNCTION sync_operator_organization_to_bases_after_write();

CREATE OR REPLACE FUNCTION merge_organization_records(
  source_organization_id varchar(36),
  target_organization_id varchar(36)
)
RETURNS void AS $$
DECLARE
  source_member record;
  target_member_id varchar(36);
BEGIN
  IF source_organization_id IS NULL
     OR target_organization_id IS NULL
     OR source_organization_id = target_organization_id THEN
    RETURN;
  END IF;

  FOR source_member IN
    SELECT *
    FROM organization_members
    WHERE organization_id = source_organization_id
  LOOP
    SELECT id
    INTO target_member_id
    FROM organization_members
    WHERE organization_id = target_organization_id
      AND user_id = source_member.user_id;

    IF target_member_id IS NULL THEN
      UPDATE member_roles
      SET scope_id = target_organization_id
      WHERE member_id = source_member.id
        AND scope_type = 'organization'
        AND scope_id = source_organization_id;

      UPDATE organization_members
      SET organization_id = target_organization_id,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = source_member.id;
    ELSE
      INSERT INTO member_roles (id, member_id, role_id, scope_type, scope_id, created_at)
      SELECT
        gen_random_uuid(),
        target_member_id,
        role_id,
        scope_type,
        CASE
          WHEN scope_type = 'organization' AND scope_id = source_organization_id
            THEN target_organization_id
          ELSE scope_id
        END,
        created_at
      FROM member_roles
      WHERE member_id = source_member.id
      ON CONFLICT (member_id, role_id, scope_type, scope_id) DO NOTHING;

      UPDATE organization_members
      SET status = CASE
            WHEN status = 'active' OR source_member.status = 'active' THEN 'active'
            ELSE status
          END,
          is_owner = is_owner OR source_member.is_owner,
          joined_at = LEAST(joined_at, source_member.joined_at),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = target_member_id;

      DELETE FROM organization_members WHERE id = source_member.id;
    END IF;
  END LOOP;

  DELETE FROM member_roles AS source_role
  USING member_roles AS target_role
  WHERE source_role.scope_type = 'organization'
    AND source_role.scope_id = source_organization_id
    AND target_role.member_id = source_role.member_id
    AND target_role.role_id = source_role.role_id
    AND target_role.scope_type = source_role.scope_type
    AND target_role.scope_id = target_organization_id;

  UPDATE member_roles
  SET scope_id = target_organization_id
  WHERE scope_type = 'organization'
    AND scope_id = source_organization_id;

  UPDATE account_invitations AS source_invitation
  SET status = 'revoked',
      revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP),
      updated_at = CURRENT_TIMESTAMP
  WHERE organization_id = source_organization_id
    AND status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM account_invitations AS target_invitation
      WHERE target_invitation.organization_id = target_organization_id
        AND target_invitation.status = 'pending'
        AND lower(target_invitation.email) = lower(source_invitation.email)
    );

  UPDATE account_invitations
  SET organization_id = target_organization_id,
      updated_at = CURRENT_TIMESTAMP
  WHERE organization_id = source_organization_id;

  INSERT INTO app_subscriptions AS target_subscription (
    id,
    organization_id,
    app_code,
    plan_code,
    status,
    starts_on,
    ends_on,
    settings,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    target_organization_id,
    app_code,
    plan_code,
    status,
    starts_on,
    ends_on,
    settings,
    created_at,
    updated_at
  FROM app_subscriptions
  WHERE organization_id = source_organization_id
  ON CONFLICT (organization_id, app_code) DO UPDATE SET
    status = CASE
      WHEN target_subscription.status = 'active' OR EXCLUDED.status = 'active' THEN 'active'
      ELSE target_subscription.status
    END,
    starts_on = LEAST(target_subscription.starts_on, EXCLUDED.starts_on),
    ends_on = CASE
      WHEN target_subscription.ends_on IS NULL OR EXCLUDED.ends_on IS NULL THEN NULL
      ELSE GREATEST(target_subscription.ends_on, EXCLUDED.ends_on)
    END,
    settings = target_subscription.settings || EXCLUDED.settings,
    updated_at = CURRENT_TIMESTAMP;

  DELETE FROM app_subscriptions
  WHERE organization_id = source_organization_id;

  INSERT INTO organization_bases (id, organization_id, base_id, relationship_type, created_at)
  SELECT gen_random_uuid(), target_organization_id, base_id, relationship_type, created_at
  FROM organization_bases
  WHERE organization_id = source_organization_id
  ON CONFLICT (organization_id, base_id, relationship_type) DO NOTHING;

  DELETE FROM organization_bases
  WHERE organization_id = source_organization_id;

  INSERT INTO organization_enterprises (id, organization_id, enterprise_id, relationship_type, created_at)
  SELECT gen_random_uuid(), target_organization_id, enterprise_id, relationship_type, created_at
  FROM organization_enterprises
  WHERE organization_id = source_organization_id
  ON CONFLICT (organization_id, enterprise_id, relationship_type) DO NOTHING;

  DELETE FROM organization_enterprises
  WHERE organization_id = source_organization_id;

  DELETE FROM service_engagements
  WHERE (enterprise_organization_id = source_organization_id AND provider_organization_id = target_organization_id)
     OR (enterprise_organization_id = target_organization_id AND provider_organization_id = source_organization_id);

  UPDATE service_engagements
  SET enterprise_organization_id = target_organization_id,
      updated_at = CURRENT_TIMESTAMP
  WHERE enterprise_organization_id = source_organization_id;

  UPDATE service_engagements
  SET provider_organization_id = target_organization_id,
      updated_at = CURRENT_TIMESTAMP
  WHERE provider_organization_id = source_organization_id;

  UPDATE auth_sessions
  SET active_organization_id = target_organization_id
  WHERE active_organization_id = source_organization_id;

  UPDATE audit_logs
  SET organization_id = target_organization_id
  WHERE organization_id = source_organization_id;

  UPDATE bases
  SET organization_id = target_organization_id
  WHERE organization_id = source_organization_id;

  UPDATE enterprises
  SET organization_id = target_organization_id
  WHERE organization_id = source_organization_id;

  DELETE FROM organizations
  WHERE id = source_organization_id;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  operator_group record;
  source_organization record;
  canonical_organization_id varchar(36);
  canonical_organization_code text;
BEGIN
  FOR operator_group IN
    SELECT
      normalize_base_operator_credit_code(management_company_credit_code) AS credit_code,
      (array_agg(COALESCE(NULLIF(btrim(management_company_name), ''), name) ORDER BY created_at, id))[1] AS organization_name,
      max(NULLIF(btrim(management_company_legal_person), '')) AS legal_person,
      max(NULLIF(btrim(management_company_address), '')) AS organization_address,
      max(NULLIF(btrim(management_company_phone), '')) AS organization_phone
    FROM bases
    WHERE normalize_base_operator_credit_code(management_company_credit_code) IS NOT NULL
    GROUP BY normalize_base_operator_credit_code(management_company_credit_code)
  LOOP
    canonical_organization_code := 'operator-' || operator_group.credit_code;

    SELECT id
    INTO canonical_organization_id
    FROM organizations
    WHERE code = canonical_organization_code;

    IF canonical_organization_id IS NULL THEN
      SELECT organizations.id
      INTO canonical_organization_id
      FROM bases
      INNER JOIN organizations ON organizations.id = bases.organization_id
      WHERE normalize_base_operator_credit_code(bases.management_company_credit_code) = operator_group.credit_code
        AND organizations.type = 'park'
      ORDER BY organizations.created_at, bases.created_at, organizations.id
      LIMIT 1;
    END IF;

    IF canonical_organization_id IS NULL THEN
      INSERT INTO organizations (id, name, code, type, status, metadata, updated_at)
      VALUES (
        gen_random_uuid(),
        operator_group.organization_name,
        canonical_organization_code,
        'park',
        'active',
        jsonb_strip_nulls(jsonb_build_object(
          'identitySource', 'operator-master-data',
          'managementCompanyCreditCode', operator_group.credit_code,
          'managementCompanyLegalPerson', operator_group.legal_person,
          'managementCompanyAddress', operator_group.organization_address,
          'managementCompanyPhone', operator_group.organization_phone
        )),
        CURRENT_TIMESTAMP
      )
      RETURNING id INTO canonical_organization_id;
    ELSE
      UPDATE organizations
      SET name = operator_group.organization_name,
          code = canonical_organization_code,
          type = 'park',
          metadata = metadata || jsonb_strip_nulls(jsonb_build_object(
            'identitySource', 'operator-master-data',
            'managementCompanyCreditCode', operator_group.credit_code,
            'managementCompanyLegalPerson', operator_group.legal_person,
            'managementCompanyAddress', operator_group.organization_address,
            'managementCompanyPhone', operator_group.organization_phone
          )),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = canonical_organization_id;
    END IF;

    FOR source_organization IN
      SELECT DISTINCT bases.organization_id AS id
      FROM bases
      WHERE normalize_base_operator_credit_code(bases.management_company_credit_code) = operator_group.credit_code
        AND bases.organization_id IS NOT NULL
        AND bases.organization_id <> canonical_organization_id
    LOOP
      PERFORM merge_organization_records(source_organization.id, canonical_organization_id);
    END LOOP;

    UPDATE bases
    SET organization_id = canonical_organization_id
    WHERE normalize_base_operator_credit_code(management_company_credit_code) = operator_group.credit_code;
  END LOOP;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_park_credit_code_unique
  ON organizations ((upper(metadata ->> 'managementCompanyCreditCode')))
  WHERE type = 'park'
    AND NULLIF(metadata ->> 'managementCompanyCreditCode', '') IS NOT NULL;

DROP FUNCTION merge_organization_records(varchar, varchar);

COMMIT;
