-- Destination schema for the existing fleet data when moving off Replit PostgreSQL.
-- Keep these tables private: only the authenticated server connects to Postgres.
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  vehicle_class text NOT NULL,
  unit_number text NOT NULL UNIQUE,
  license_plate text NOT NULL UNIQUE,
  vin text,
  capacity integer NOT NULL,
  transmission text NOT NULL DEFAULT 'Automatic',
  features text[] NOT NULL DEFAULT '{}',
  daily_rate real NOT NULL,
  weekly_rate real NOT NULL,
  status text NOT NULL DEFAULT 'available',
  image_url text NOT NULL,
  details_confirmed boolean NOT NULL DEFAULT false,
  notes text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id),
  pickup_at timestamptz NOT NULL,
  expected_return_at timestamptz NOT NULL,
  actual_return_at timestamptz,
  rate_type text NOT NULL,
  rate real NOT NULL,
  deposit real NOT NULL DEFAULT 300,
  deposit_status text NOT NULL DEFAULT 'not_collected',
  status text NOT NULL DEFAULT 'reserved',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rental_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES public.rentals(id),
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_notes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.vehicles, public.customers, public.rentals,
  public.maintenance_periods, public.rental_notes FROM anon, authenticated;