-- Initialize postgres_extra database with MDM tables for DRC
create table if not exists extra(id serial primary key, note text); 
insert into extra(note) values ('extra pg ready');

-- MDM Tables for Master Data Management
-- These tables store cable components and their specifications

-- Cables: Round, ribbon, coax, etc.
CREATE TABLE IF NOT EXISTS mdm_cables (
  id SERIAL PRIMARY KEY,
  mpn VARCHAR(100) UNIQUE NOT NULL,
  family VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'ribbon', 'round_shielded', 'coax', etc.
  conductor_count INT NOT NULL,
  conductor_awg INT,
  pitch_in NUMERIC(6,4), -- For ribbon cables
  od_in NUMERIC(6,4), -- Outer diameter
  voltage_rating_v INT,
  temp_rating_c INT,
  shield VARCHAR(50) DEFAULT 'none', -- 'none', 'foil', 'braid', 'foil+braid'
  flex_class VARCHAR(50) DEFAULT 'standard', -- 'flexible', 'standard', 'semi-rigid'
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connectors: JST, Molex, TE, 3M IDC, etc.
CREATE TABLE IF NOT EXISTS mdm_connectors (
  id SERIAL PRIMARY KEY,
  mpn VARCHAR(100) UNIQUE NOT NULL,
  family VARCHAR(100) NOT NULL,
  positions INT NOT NULL,
  pitch_mm NUMERIC(5,2),
  termination VARCHAR(50), -- 'crimp', 'idc', 'solder', 'ring_lug'
  stud_size VARCHAR(20), -- For ring lugs: '#10', 'M3', 'M4', etc.
  compatible_contacts_awg INT[], -- Array of compatible AWG sizes
  orientation VARCHAR(50), -- 'straight', 'right_angle', 'vertical'
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts: Crimp pins/sockets for connectors
CREATE TABLE IF NOT EXISTS mdm_contacts (
  id SERIAL PRIMARY KEY,
  mpn VARCHAR(100) UNIQUE NOT NULL,
  connector_family VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'pin', 'socket', 'hermaphroditic'
  awg_range INT[] NOT NULL, -- Array of compatible AWG sizes
  plating VARCHAR(50) DEFAULT 'tin', -- 'tin', 'gold', 'silver'
  insulation_support BOOLEAN DEFAULT false,
  retention_type VARCHAR(50), -- 'friction', 'locking', 'twist'
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accessories: Backshells, strain reliefs, boots
CREATE TABLE IF NOT EXISTS mdm_accessories (
  id SERIAL PRIMARY KEY,
  mpn VARCHAR(100) UNIQUE NOT NULL,
  connector_family VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'backshell', 'strain_relief', 'boot', 'hood'
  cable_od_range_in NUMERIC(6,4)[2] NOT NULL, -- [min, max] cable OD range
  material VARCHAR(50), -- 'metal', 'plastic', 'rubber'
  shielding BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for testing and DRC validation

-- Ribbon Cables
INSERT INTO mdm_cables (mpn, family, type, conductor_count, pitch_in, od_in, voltage_rating_v, temp_rating_c, shield, flex_class) VALUES
  ('3M-3365-10-300', '3M IDC', 'ribbon', 10, 0.050, 0.045, 300, 80, 'none', 'flexible'),
  ('3M-3365-40-300', '3M IDC', 'ribbon', 40, 0.025, 0.045, 300, 80, 'none', 'flexible'),
  ('3M-3302-10-300', '3M IDC', 'ribbon', 10, 0.050, 0.050, 300, 105, 'none', 'standard'),
  ('AMPHENOL-RIB-20-050', 'Amphenol Spectra-Strip', 'ribbon', 20, 0.050, 0.048, 300, 80, 'none', 'flexible')
ON CONFLICT (mpn) DO NOTHING;

-- Round Shielded Cables
INSERT INTO mdm_cables (mpn, family, type, conductor_count, conductor_awg, od_in, voltage_rating_v, temp_rating_c, shield, flex_class) VALUES
  ('BELDEN-8723-002', 'Belden DataTwist', 'round_shielded', 2, 22, 0.175, 300, 80, 'foil', 'flexible'),
  ('BELDEN-9501-002', 'Belden Power', 'round_shielded', 2, 14, 0.280, 600, 105, 'foil', 'flexible'),
  ('ALPHA-5858-004', 'Alpha Power', 'round_shielded', 4, 18, 0.240, 300, 80, 'foil', 'flexible'),
  ('BELDEN-8775-006', 'Belden Multi', 'round_shielded', 6, 18, 0.290, 300, 80, 'foil+braid', 'flexible')
ON CONFLICT (mpn) DO NOTHING;

-- Connectors - JST PH Series (2mm pitch)
INSERT INTO mdm_connectors (mpn, family, positions, pitch_mm, termination, compatible_contacts_awg, orientation) VALUES
  ('JST-PHR-2', 'JST PH', 2, 2.0, 'crimp', ARRAY[24,26,28,30], 'straight'),
  ('JST-PHR-3', 'JST PH', 3, 2.0, 'crimp', ARRAY[24,26,28,30], 'straight'),
  ('JST-PHR-4', 'JST PH', 4, 2.0, 'crimp', ARRAY[24,26,28,30], 'straight')
ON CONFLICT (mpn) DO NOTHING;

-- Connectors - Molex Mega-Fit (5.70mm pitch, power)
INSERT INTO mdm_connectors (mpn, family, positions, pitch_mm, termination, compatible_contacts_awg, orientation) VALUES
  ('MOLEX-76829-0002', 'Molex Mega-Fit', 2, 5.70, 'crimp', ARRAY[12,14,16,18], 'straight'),
  ('MOLEX-76829-0004', 'Molex Mega-Fit', 4, 5.70, 'crimp', ARRAY[12,14,16,18], 'straight'),
  ('MOLEX-76829-0006', 'Molex Mega-Fit', 6, 5.70, 'crimp', ARRAY[12,14,16,18], 'straight')
ON CONFLICT (mpn) DO NOTHING;

-- Connectors - 3M IDC (ribbon cable)
INSERT INTO mdm_connectors (mpn, family, positions, pitch_mm, termination, compatible_contacts_awg, orientation) VALUES
  ('3M-3510-5010', '3M IDC', 10, 1.27, 'idc', ARRAY[26,28], 'straight'),
  ('3M-3510-5020', '3M IDC', 20, 1.27, 'idc', ARRAY[26,28], 'straight'),
  ('3M-3510-5040', '3M IDC', 40, 1.27, 'idc', ARRAY[26,28], 'straight')
ON CONFLICT (mpn) DO NOTHING;

-- Connectors - TE Ring Lugs
INSERT INTO mdm_connectors (mpn, family, positions, pitch_mm, termination, stud_size, compatible_contacts_awg, orientation) VALUES
  ('TE-320582', 'TE Ring Lugs', 1, NULL, 'ring_lug', '#10', ARRAY[8,10,12,14,16,18], 'straight'),
  ('TE-321460', 'TE Ring Lugs', 1, NULL, 'ring_lug', 'M3', ARRAY[12,14,16,18,20], 'straight'),
  ('TE-321461', 'TE Ring Lugs', 1, NULL, 'ring_lug', 'M4', ARRAY[10,12,14,16,18], 'straight')
ON CONFLICT (mpn) DO NOTHING;

-- Contacts - JST PH Series
INSERT INTO mdm_contacts (mpn, connector_family, type, awg_range, plating, insulation_support) VALUES
  ('JST-SPH-002T-P0.5S', 'JST PH', 'socket', ARRAY[24,26,28,30], 'tin', false),
  ('JST-SPH-002T-P0.5L', 'JST PH', 'socket', ARRAY[24,26,28,30], 'gold', false)
ON CONFLICT (mpn) DO NOTHING;

-- Contacts - Molex Mega-Fit
INSERT INTO mdm_contacts (mpn, connector_family, type, awg_range, plating, insulation_support) VALUES
  ('MOLEX-76650-0001', 'Molex Mega-Fit', 'socket', ARRAY[12,14,16,18], 'tin', true),
  ('MOLEX-76650-0002', 'Molex Mega-Fit', 'pin', ARRAY[12,14,16,18], 'tin', true),
  ('MOLEX-76650-0003', 'Molex Mega-Fit', 'socket', ARRAY[12,14,16,18], 'gold', true)
ON CONFLICT (mpn) DO NOTHING;

-- Accessories - 3M IDC Strain Reliefs
INSERT INTO mdm_accessories (mpn, connector_family, type, cable_od_range_in, material, shielding) VALUES
  ('3M-3420-0001', '3M IDC', 'strain_relief', ARRAY[0.15, 0.30], 'plastic', false),
  ('3M-3420-0002', '3M IDC', 'strain_relief', ARRAY[0.25, 0.45], 'plastic', false),
  ('3M-3420-0003', '3M IDC', 'hood', ARRAY[0.15, 0.35], 'plastic', false)
ON CONFLICT (mpn) DO NOTHING;

-- Accessories - Molex Mega-Fit Backshells
INSERT INTO mdm_accessories (mpn, connector_family, type, cable_od_range_in, material, shielding) VALUES
  ('MOLEX-76991-0001', 'Molex Mega-Fit', 'backshell', ARRAY[0.20, 0.35], 'metal', true),
  ('MOLEX-76991-0002', 'Molex Mega-Fit', 'backshell', ARRAY[0.30, 0.50], 'metal', true),
  ('MOLEX-76991-0003', 'Molex Mega-Fit', 'strain_relief', ARRAY[0.20, 0.40], 'plastic', false)
ON CONFLICT (mpn) DO NOTHING;

-- Accessories - JST PH Boots
INSERT INTO mdm_accessories (mpn, connector_family, type, cable_od_range_in, material, shielding) VALUES
  ('JST-PHDR-TB', 'JST PH', 'boot', ARRAY[0.05, 0.15], 'rubber', false),
  ('JST-PHDR-SR', 'JST PH', 'strain_relief', ARRAY[0.08, 0.18], 'plastic', false)
ON CONFLICT (mpn) DO NOTHING;
