-- Create the devices table (User and Device Relationship)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_name VARCHAR NOT NULL,
    unit VARCHAR NOT NULL
);

-- Create the energy_data table (Raw Energy Data)
CREATE TABLE IF NOT EXISTS public.energy_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    energy_kwh FLOAT NOT NULL DEFAULT 0,
    is_processed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.energy_aggregations (
    aggregation_id SERIAL PRIMARY KEY,
    device_id uuid REFERENCES devices(id),
    date DATE NOT NULL,
    week_start DATE NOT NULL,
    month_start DATE NOT NULL,
    total_energy_kwh DECIMAL(10, 4) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    peak_energy_kwh DECIMAL(10, 4),
    off_peak_energy_kwh DECIMAL(10, 4),
    peak_to_off_peak_ratio DECIMAL(10, 2),
    peak_hour INT,
    finalized BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.insights (
    insight_id SERIAL PRIMARY KEY,
    insight_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    relevancy_score INT;
);
