BEGIN;

COMMENT ON TABLE meters IS '物业：基地内按独立水表、电表划分的计量和管理单元';
COMMENT ON TABLE spaces IS '物理空间：物业内由管理方规划的房间或办公空间';
COMMENT ON TABLE registration_numbers IS '工位：设置在物理空间内、可分配给入驻企业的最小物理单元';

ALTER TABLE meters
  ADD COLUMN IF NOT EXISTS property_owner varchar(200),
  ADD COLUMN IF NOT EXISTS management_company varchar(200),
  ADD COLUMN IF NOT EXISTS electricity_enterprise_id varchar(36),
  ADD COLUMN IF NOT EXISTS water_enterprise_id varchar(36),
  ADD COLUMN IF NOT EXISTS heating_enterprise_id varchar(36),
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS enterprise_base_relations (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id varchar(36) NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  base_id varchar(36) NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  relation_type varchar(20) NOT NULL CHECK (relation_type IN ('tenant', 'service')),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'ended')),
  source varchar(30) NOT NULL DEFAULT 'manual',
  started_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS enterprise_base_relations_active_unique
  ON enterprise_base_relations (enterprise_id, base_id, relation_type)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS enterprise_base_relations_base_idx
  ON enterprise_base_relations (base_id, relation_type, status);
CREATE INDEX IF NOT EXISTS enterprise_base_relations_enterprise_idx
  ON enterprise_base_relations (enterprise_id, status);

CREATE TABLE IF NOT EXISTS workstation_assignments (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  workstation_id varchar NOT NULL REFERENCES registration_numbers(id) ON DELETE RESTRICT,
  enterprise_id varchar(36) NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  enterprise_base_relation_id varchar(36) REFERENCES enterprise_base_relations(id) ON DELETE SET NULL,
  application_id varchar(36),
  contract_id varchar(36),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released')),
  source varchar(30) NOT NULL DEFAULT 'system',
  assigned_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_at timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS workstation_assignments_active_unique
  ON workstation_assignments (workstation_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS workstation_assignments_enterprise_idx
  ON workstation_assignments (enterprise_id, status);
CREATE INDEX IF NOT EXISTS workstation_assignments_relation_idx
  ON workstation_assignments (enterprise_base_relation_id, status);

INSERT INTO registration_numbers (
  id,
  code,
  space_id,
  enterprise_id,
  available,
  created_at,
  updated_at
)
SELECT
  legacy.id,
  legacy.code,
  legacy.space_id,
  legacy.enterprise_id,
  legacy.enterprise_id IS NULL AND legacy.status = 'available',
  legacy.created_at,
  legacy.updated_at
FROM reg_numbers legacy
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION ensure_enterprise_base_relation(
  target_enterprise_id varchar,
  target_base_id varchar,
  target_relation_type varchar,
  target_source varchar DEFAULT 'system'
) RETURNS varchar
LANGUAGE plpgsql
AS $$
DECLARE
  relation_id varchar(36);
BEGIN
  IF target_enterprise_id IS NULL OR target_base_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id
    INTO relation_id
    FROM enterprise_base_relations
   WHERE enterprise_id = target_enterprise_id
     AND base_id = target_base_id
     AND relation_type = target_relation_type
     AND status = 'active'
   ORDER BY created_at DESC
   LIMIT 1;

  IF relation_id IS NULL THEN
    BEGIN
      INSERT INTO enterprise_base_relations (
        enterprise_id,
        base_id,
        relation_type,
        status,
        source
      ) VALUES (
        target_enterprise_id,
        target_base_id,
        target_relation_type,
        'active',
        COALESCE(target_source, 'system')
      )
      RETURNING id INTO relation_id;
    EXCEPTION WHEN unique_violation THEN
      SELECT id
        INTO relation_id
        FROM enterprise_base_relations
       WHERE enterprise_id = target_enterprise_id
         AND base_id = target_base_id
         AND relation_type = target_relation_type
         AND status = 'active'
       LIMIT 1;
    END;
  END IF;

  RETURN relation_id;
END;
$$;

SELECT ensure_enterprise_base_relation(
  enterprise.id,
  enterprise.base_id,
  CASE WHEN enterprise.type IN ('service', 'non_tenant') THEN 'service' ELSE 'tenant' END,
  'legacy_enterprise'
)
FROM enterprises enterprise
WHERE enterprise.base_id IS NOT NULL
  AND enterprise.status NOT IN ('inactive', 'disabled', 'terminated')
  AND enterprise.process_status <> 'terminated';

SELECT ensure_enterprise_base_relation(
  workstation.enterprise_id,
  property.base_id,
  'tenant',
  'legacy_workstation'
)
FROM registration_numbers workstation
JOIN spaces space ON space.id = workstation.space_id
JOIN meters property ON property.id = space.meter_id
WHERE workstation.enterprise_id IS NOT NULL;

INSERT INTO workstation_assignments (
  workstation_id,
  enterprise_id,
  enterprise_base_relation_id,
  status,
  source,
  assigned_at
)
SELECT
  workstation.id,
  workstation.enterprise_id,
  relation.id,
  'active',
  'legacy_workstation',
  COALESCE(workstation.updated_at::timestamp, workstation.created_at::timestamp, CURRENT_TIMESTAMP)
FROM registration_numbers workstation
JOIN spaces space ON space.id = workstation.space_id
JOIN meters property ON property.id = space.meter_id
JOIN enterprise_base_relations relation
  ON relation.enterprise_id = workstation.enterprise_id
 AND relation.base_id = property.base_id
 AND relation.relation_type = 'tenant'
 AND relation.status = 'active'
WHERE workstation.enterprise_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
      FROM workstation_assignments assignment
     WHERE assignment.workstation_id = workstation.id
       AND assignment.status = 'active'
  );

CREATE OR REPLACE FUNCTION sync_enterprise_base_relation_after_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  old_relation_type varchar(20);
  new_relation_type varchar(20);
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_relation_type := CASE WHEN OLD.type IN ('service', 'non_tenant') THEN 'service' ELSE 'tenant' END;
    IF OLD.base_id IS NOT NULL AND (
      OLD.base_id IS DISTINCT FROM NEW.base_id
      OR OLD.type IS DISTINCT FROM NEW.type
      OR NEW.status IN ('inactive', 'disabled', 'terminated')
      OR NEW.process_status = 'terminated'
    ) THEN
      UPDATE enterprise_base_relations
         SET status = 'ended',
             ended_at = COALESCE(ended_at, CURRENT_TIMESTAMP),
             updated_at = CURRENT_TIMESTAMP
       WHERE enterprise_id = OLD.id
         AND base_id = OLD.base_id
         AND relation_type = old_relation_type
         AND status = 'active';
    END IF;

    IF OLD.type NOT IN ('service', 'non_tenant')
       AND NEW.type IN ('service', 'non_tenant') THEN
      UPDATE registration_numbers
         SET enterprise_id = NULL,
             updated_at = CURRENT_TIMESTAMP
       WHERE enterprise_id = NEW.id;
    END IF;

    IF NEW.status IN ('inactive', 'disabled', 'terminated')
       OR NEW.process_status = 'terminated' THEN
      UPDATE registration_numbers
         SET enterprise_id = NULL,
             updated_at = CURRENT_TIMESTAMP
       WHERE enterprise_id = NEW.id;
    END IF;
  END IF;

  IF NEW.base_id IS NOT NULL
     AND NEW.status NOT IN ('inactive', 'disabled', 'terminated')
     AND NEW.process_status <> 'terminated' THEN
    new_relation_type := CASE WHEN NEW.type IN ('service', 'non_tenant') THEN 'service' ELSE 'tenant' END;
    PERFORM ensure_enterprise_base_relation(NEW.id, NEW.base_id, new_relation_type, 'enterprise');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enterprises_sync_base_relation ON enterprises;
CREATE TRIGGER enterprises_sync_base_relation
AFTER INSERT OR UPDATE OF base_id, type, status, process_status
ON enterprises
FOR EACH ROW
EXECUTE FUNCTION sync_enterprise_base_relation_after_write();

CREATE OR REPLACE FUNCTION normalize_workstation_availability_before_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.available := NEW.enterprise_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS registration_numbers_normalize_availability ON registration_numbers;
CREATE TRIGGER registration_numbers_normalize_availability
BEFORE INSERT OR UPDATE OF enterprise_id
ON registration_numbers
FOR EACH ROW
EXECUTE FUNCTION normalize_workstation_availability_before_write();

CREATE OR REPLACE FUNCTION sync_workstation_assignment_after_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_base_id varchar(36);
  relation_id varchar(36);
BEGIN
  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND (
       OLD.enterprise_id IS DISTINCT FROM NEW.enterprise_id
       OR OLD.space_id IS DISTINCT FROM NEW.space_id
     )) THEN
    UPDATE workstation_assignments
       SET status = 'released',
           released_at = COALESCE(released_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
     WHERE workstation_id = OLD.id
       AND status = 'active';
  END IF;

  IF TG_OP <> 'DELETE' AND NEW.enterprise_id IS NOT NULL THEN
    SELECT property.base_id
      INTO target_base_id
      FROM spaces space
      JOIN meters property ON property.id = space.meter_id
     WHERE space.id = NEW.space_id;

    relation_id := ensure_enterprise_base_relation(NEW.enterprise_id, target_base_id, 'tenant', 'workstation');

    IF NOT EXISTS (
      SELECT 1
        FROM workstation_assignments assignment
       WHERE assignment.workstation_id = NEW.id
         AND assignment.status = 'active'
    ) THEN
      INSERT INTO workstation_assignments (
        workstation_id,
        enterprise_id,
        enterprise_base_relation_id,
        status,
        source
      ) VALUES (
        NEW.id,
        NEW.enterprise_id,
        relation_id,
        'active',
        'workstation'
      );
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS registration_numbers_sync_assignment ON registration_numbers;
CREATE TRIGGER registration_numbers_sync_assignment
AFTER INSERT OR UPDATE OF enterprise_id, space_id OR DELETE
ON registration_numbers
FOR EACH ROW
EXECUTE FUNCTION sync_workstation_assignment_after_write();

COMMIT;
