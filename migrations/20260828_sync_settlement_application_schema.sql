BEGIN;

ALTER TABLE public.pi_settlement_applications
  ADD COLUMN IF NOT EXISTS application_no VARCHAR(50),
  ADD COLUMN IF NOT EXISTS application_date DATE,
  ADD COLUMN IF NOT EXISTS enterprise_name_backups JSON,
  ADD COLUMN IF NOT EXISTS registered_capital NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS currency_type VARCHAR(20) DEFAULT 'CNY',
  ADD COLUMN IF NOT EXISTS tax_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS expected_annual_revenue NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS expected_annual_tax NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS original_registered_address VARCHAR(500),
  ADD COLUMN IF NOT EXISTS mailing_address VARCHAR(500),
  ADD COLUMN IF NOT EXISTS business_address VARCHAR(500),
  ADD COLUMN IF NOT EXISTS assigned_address_id VARCHAR(36),
  ADD COLUMN IF NOT EXISTS assigned_address VARCHAR(500),
  ADD COLUMN IF NOT EXISTS legal_person_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS legal_person_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS legal_person_email VARCHAR(100),
  ADD COLUMN IF NOT EXISTS legal_person_address VARCHAR(500),
  ADD COLUMN IF NOT EXISTS shareholders JSON,
  ADD COLUMN IF NOT EXISTS personnel JSON,
  ADD COLUMN IF NOT EXISTS supervisor_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS supervisor_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS finance_manager_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS finance_manager_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contact_person_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contact_person_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ewt_contact_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ewt_contact_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS intermediary_department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS intermediary_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS intermediary_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS business_scope TEXT,
  ADD COLUMN IF NOT EXISTS approval_opinion TEXT,
  ADD COLUMN IF NOT EXISTS approved_by VARCHAR(36),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS process_id VARCHAR(36),
  ADD COLUMN IF NOT EXISTS attachments JSON,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' NOT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pi_settlement_applications'
      AND column_name = 'contact_person'
  ) THEN
    EXECUTE 'UPDATE public.pi_settlement_applications
      SET contact_person_name = COALESCE(contact_person_name, contact_person)
      WHERE contact_person IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pi_settlement_applications'
      AND column_name = 'contact_phone'
  ) THEN
    EXECUTE 'UPDATE public.pi_settlement_applications
      SET contact_person_phone = COALESCE(contact_person_phone, contact_phone)
      WHERE contact_phone IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pi_settlement_applications'
      AND column_name = 'approval_date'
  ) THEN
    EXECUTE 'UPDATE public.pi_settlement_applications
      SET approved_at = COALESCE(approved_at, approval_date)
      WHERE approval_date IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pi_settlement_applications'
      AND column_name = 'address_id'
  ) THEN
    EXECUTE 'UPDATE public.pi_settlement_applications
      SET assigned_address_id = COALESCE(assigned_address_id, address_id)
      WHERE address_id IS NOT NULL';
  END IF;
END $$;

UPDATE public.pi_settlement_applications
SET application_no = 'LEGACY-'
  || TO_CHAR(COALESCE(created_at, CURRENT_TIMESTAMP), 'YYYYMMDD')
  || '-'
  || UPPER(SUBSTRING(REPLACE(id, '-', '') FROM 1 FOR 8))
WHERE application_no IS NULL OR BTRIM(application_no) = '';

UPDATE public.pi_settlement_applications
SET application_date = COALESCE(application_date, created_at::date),
    status = CASE
      WHEN approval_status = 'approved' THEN 'processing'
      WHEN approval_status = 'pending' THEN 'submitted'
      ELSE COALESCE(NULLIF(status, ''), 'draft')
    END;

ALTER TABLE public.pi_settlement_applications
  ALTER COLUMN application_no SET NOT NULL,
  ALTER COLUMN settlement_type DROP NOT NULL,
  ALTER COLUMN approval_status SET DEFAULT 'draft',
  ALTER COLUMN status SET DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_ssa_application_no ON public.pi_settlement_applications(application_no);
CREATE INDEX IF NOT EXISTS idx_ssa_enterprise_name ON public.pi_settlement_applications(enterprise_name);
CREATE INDEX IF NOT EXISTS idx_ssa_approval_status ON public.pi_settlement_applications(approval_status);
CREATE INDEX IF NOT EXISTS idx_ssa_application_type ON public.pi_settlement_applications(application_type);
CREATE INDEX IF NOT EXISTS idx_ssa_status ON public.pi_settlement_applications(status);
CREATE INDEX IF NOT EXISTS idx_ssa_enterprise_id ON public.pi_settlement_applications(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_ssa_assigned_address_id ON public.pi_settlement_applications(assigned_address_id);

ALTER TABLE public.pi_settlement_processes
  ADD COLUMN IF NOT EXISTS enterprise_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS current_stage_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overall_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  ADD COLUMN IF NOT EXISTS stages JSON;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pi_settlement_processes'
      AND column_name = 'stage_progress'
  ) THEN
    EXECUTE 'UPDATE public.pi_settlement_processes
      SET stages = COALESCE(stages, stage_progress::json)
      WHERE stage_progress IS NOT NULL';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ssp_application_id ON public.pi_settlement_processes(application_id);
CREATE INDEX IF NOT EXISTS idx_ssp_enterprise_id ON public.pi_settlement_processes(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_ssp_current_stage ON public.pi_settlement_processes(current_stage);
CREATE INDEX IF NOT EXISTS idx_ssp_overall_status ON public.pi_settlement_processes(overall_status);
CREATE INDEX IF NOT EXISTS idx_ssp_process_type ON public.pi_settlement_processes(process_type);

COMMIT;
