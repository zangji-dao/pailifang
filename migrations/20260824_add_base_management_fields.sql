ALTER TABLE public.bases
  ADD COLUMN IF NOT EXISTS address_template text,
  ADD COLUMN IF NOT EXISTS management_company_name character varying(255),
  ADD COLUMN IF NOT EXISTS management_company_credit_code character varying(50),
  ADD COLUMN IF NOT EXISTS management_company_legal_person character varying(100),
  ADD COLUMN IF NOT EXISTS management_company_address character varying(500),
  ADD COLUMN IF NOT EXISTS management_company_phone character varying(50);
