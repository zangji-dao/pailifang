DO $$
DECLARE
  needs_initial_backfill boolean;
BEGIN
  SELECT NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'meters'
      AND column_name = 'electricity_enabled'
  ) INTO needs_initial_backfill;

  ALTER TABLE public.meters
    ADD COLUMN IF NOT EXISTS electricity_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS water_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS heating_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS property_fee_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS network_enabled boolean NOT NULL DEFAULT false;

  IF needs_initial_backfill THEN
    UPDATE public.meters
    SET
      electricity_enabled = electricity_number IS NOT NULL AND btrim(electricity_number) <> '',
      water_enabled = water_number IS NOT NULL AND btrim(water_number) <> '',
      heating_enabled = heating_number IS NOT NULL AND btrim(heating_number) <> '',
      property_fee_enabled = true,
      network_enabled = network_number IS NOT NULL AND btrim(network_number) <> '';
  END IF;
END
$$;

COMMENT ON COLUMN public.meters.electricity_enabled IS '物业是否适用电费';
COMMENT ON COLUMN public.meters.water_enabled IS '物业是否适用水费';
COMMENT ON COLUMN public.meters.heating_enabled IS '物业是否适用取暖费';
COMMENT ON COLUMN public.meters.property_fee_enabled IS '物业是否适用物业费';
COMMENT ON COLUMN public.meters.network_enabled IS '物业是否适用网络费';
