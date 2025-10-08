# DRC Rule Tables and MDM Integration

## Overview

The Design Rule Check (DRC) system uses JSON-based rule tables and Master Data Management (MDM) database lookups to validate cable assembly designs against engineering standards and part availability.

## Architecture

```
services/
├── drc/
│   ├── drc.py              # DRC validation engine
│   ├── mdm_dao.py          # MDM database access layer
│   ├── models.py           # Pydantic data models
│   ├── test_drc_rule_tables.py  # Rule table tests
│   └── test_mdm_dao.py     # MDM lookup tests
└── rules/
    └── rulesets/
        └── rs-001/         # Rule set 001 (default)
            ├── ampacity.json
            ├── bend_radius.json
            ├── voltage_temp.json
            ├── locale_ac_colors.json
            └── label_defaults.json

db/
└── postgres_extra/
    └── init/
        └── 001_seed.sql    # MDM tables and seed data
```

## Rule Tables (rs-001)

### 1. ampacity.json

**Purpose**: Maps AWG wire gauge to current capacity at 30°C ambient temperature.

**Standard**: NEC Table 310.15(B)(16) - 30°C derating for chassis wiring

**Data Structure**:
```json
{
  "metadata": {
    "ruleset_id": "rs-001",
    "description": "AWG to ampacity (amps) at 30°C",
    "standard": "NEC Table 310.15(B)(16)"
  },
  "data": {
    "8": 73,
    "10": 55,
    "12": 41,
    "14": 32,
    "16": 22,
    "18": 16,
    "20": 11,
    "22": 7,
    "24": 3.5,
    "26": 2.2,
    "28": 1.4,
    "30": 0.86
  }
}
```

**DRC Checks**:
- `current_exceeds_ampacity`: Error if conductor current rating exceeds AWG ampacity
- `awg_not_supported`: Error if AWG size not in table

**Example Usage**:
```python
# Check if 18 AWG conductor at 20A is valid
# Ampacity table shows 18 AWG = 16A max
# Result: ERROR - current exceeds ampacity
```

---

### 2. bend_radius.json

**Purpose**: Minimum bend radius multipliers by cable family to prevent damage.

**Standard**: IPC/WHMA-A-620 and manufacturer specifications

**Data Structure**:
```json
{
  "data": {
    "standard": { "multiplier": 10, "description": "Standard round cable" },
    "round": { "multiplier": 8, "description": "Round shielded cables" },
    "ribbon": { "multiplier": 10, "description": "Flat ribbon cables" },
    "coax": { "multiplier": 12, "description": "Coaxial cables" },
    "flex": { "multiplier": 6, "description": "Highly flexible cables" },
    "power": { "multiplier": 10, "description": "Power cables (>10A)" }
  }
}
```

**DRC Checks**:
- `bend_radius_too_small`: Error if actual bend radius < (cable OD × multiplier)

**Example Usage**:
```python
# Standard cable: OD = 5mm, bend_radius_mm = 20mm
# Minimum = 5mm × 8 = 40mm
# Result: ERROR - bend radius too small (20mm < 40mm)
```

---

### 3. voltage_temp.json

**Purpose**: Minimal voltage and temperature ratings per AWG/cable family.

**Standard**: UL 758 for appliance wiring, NEC for voltage ratings

**Data Structure**:
```json
{
  "data": {
    "18": { "voltage_v": 300, "temp_c": 80 },
    "20": { "voltage_v": 300, "temp_c": 80 },
    "22": { "voltage_v": 300, "temp_c": 80 },
    "26": { "voltage_v": 150, "temp_c": 80 }
  },
  "cable_families": {
    "standard": { "voltage_v": 300, "temp_c": 80 },
    "plenum": { "voltage_v": 300, "temp_c": 150 },
    "high_temp": { "voltage_v": 600, "temp_c": 200 }
  }
}
```

**DRC Checks**:
- `voltage_rating_exceeded`: Error if voltage > AWG limit
- `temperature_rating_exceeded`: Warning if temperature > AWG limit

**Example Usage**:
```python
# 18 AWG wire at 600V (limit is 300V)
# Result: ERROR - voltage rating exceeded
```

---

### 4. locale_ac_colors.json

**Purpose**: AC conductor color codes by geographic region/locale.

**Standards**: NEC (US), IEC 60446 (EU), JIS C 3306 (JP), etc.

**Data Structure**:
```json
{
  "data": {
    "us": {
      "1": "black",
      "2": "red",
      "3": "blue",
      "neutral": "white",
      "ground": "green"
    },
    "eu": {
      "1": "brown",
      "2": "black",
      "3": "grey",
      "neutral": "blue",
      "ground": "green-yellow"
    },
    "jp": {
      "1": "black",
      "2": "white",
      "3": "red",
      "neutral": "white",
      "ground": "green"
    }
  }
}
```

**DRC Checks**:
- `ac_color_mismatch`: Warning if conductor colors don't match locale standard
- `unsupported_locale`: Warning if locale not in table

**Example Usage**:
```python
# US locale with conductors: ["brown", "blue"] 
# Expected: ["black", "white"]
# Result: WARNING - AC conductor colors don't match US standard
```

---

### 5. label_defaults.json

**Purpose**: Default label placement offsets and material requirements.

**Standards**: UL 969 (Marking and Labeling), UL 94 (Flammability)

**Data Structure**:
```json
{
  "placement_offsets": {
    "from_connector_mm": { "default": 25, "min": 10, "max": 50 },
    "from_strain_relief_mm": { "default": 15, "min": 5, "max": 30 }
  },
  "label_materials": {
    "required_rating": "UL94-V0",
    "description": "Self-extinguishing when flame source removed"
  },
  "label_types": {
    "polyester": { "rating": "UL94-V0", "temp_range_c": [-40, 150] },
    "polyimide": { "rating": "UL94-V0", "temp_range_c": [-269, 400] }
  }
}
```

**DRC Checks**:
- Future: Label placement validation
- Future: Material compatibility with cable temperature rating

---

## MDM Database Tables

The MDM (Master Data Management) tables store actual parts from manufacturers. These are queried by the DRC engine to verify:
- Part availability
- Compatibility (AWG, connector family, cable OD)
- Plating options (tin vs gold)

### Database: `postgres_extra` (port 5442)

Connection string: `postgresql://postgres:postgres@pg-extra:5432/extradb`

---

### Table: mdm_cables

**Purpose**: Store cable specifications (ribbon, round, coax)

**Schema**:
```sql
CREATE TABLE mdm_cables (
  id SERIAL PRIMARY KEY,
  mpn VARCHAR(100) UNIQUE NOT NULL,
  family VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'ribbon', 'round_shielded', 'coax'
  conductor_count INT NOT NULL,
  conductor_awg INT,
  pitch_in NUMERIC(6,4),      -- For ribbon cables
  od_in NUMERIC(6,4),         -- Outer diameter
  voltage_rating_v INT,
  temp_rating_c INT,
  shield VARCHAR(50) DEFAULT 'none',
  flex_class VARCHAR(50) DEFAULT 'standard',
  status VARCHAR(20) DEFAULT 'active'
);
```

**Sample Data**:
```sql
-- Ribbon cables
('3M-3365-10-300', '3M IDC', 'ribbon', 10, NULL, 0.050, 0.045, 300, 80, 'none', 'flexible')
('3M-3365-40-300', '3M IDC', 'ribbon', 40, NULL, 0.025, 0.045, 300, 80, 'none', 'flexible')

-- Round shielded cables
('BELDEN-9501-002', 'Belden Power', 'round_shielded', 2, 14, NULL, 0.280, 600, 105, 'foil', 'flexible')
```

**DRC Usage**: Synthesis engine searches for cables matching conductor count, AWG, shielding requirements.

---

### Table: mdm_connectors

**Purpose**: Store connector housings (JST, Molex, TE, 3M IDC, ring lugs)

**Schema**:
```sql
CREATE TABLE mdm_connectors (
  id SERIAL PRIMARY KEY,
  mpn VARCHAR(100) UNIQUE NOT NULL,
  family VARCHAR(100) NOT NULL,
  positions INT NOT NULL,
  pitch_mm NUMERIC(5,2),
  termination VARCHAR(50),    -- 'crimp', 'idc', 'solder', 'ring_lug'
  stud_size VARCHAR(20),      -- For ring lugs: '#10', 'M3', etc.
  compatible_contacts_awg INT[],
  orientation VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active'
);
```

**Sample Data**:
```sql
-- JST PH series (2mm pitch)
('JST-PHR-2', 'JST PH', 2, 2.0, 'crimp', NULL, ARRAY[24,26,28,30], 'straight')

-- Molex Mega-Fit (5.70mm pitch, power)
('MOLEX-76829-0004', 'Molex Mega-Fit', 4, 5.70, 'crimp', NULL, ARRAY[12,14,16,18], 'straight')

-- TE Ring Lugs
('TE-320582', 'TE Ring Lugs', 1, NULL, 'ring_lug', '#10', ARRAY[8,10,12,14,16,18], 'straight')
```

**DRC Usage**:
- Check connector position count matches conductor count
- Verify compatible AWG range for ring lugs

---

### Table: mdm_contacts

**Purpose**: Store crimp contacts/pins for connectors

**Schema**:
```sql
CREATE TABLE mdm_contacts (
  id SERIAL PRIMARY KEY,
  mpn VARCHAR(100) UNIQUE NOT NULL,
  connector_family VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'pin', 'socket', 'hermaphroditic'
  awg_range INT[] NOT NULL,
  plating VARCHAR(50) DEFAULT 'tin',  -- 'tin', 'gold', 'silver'
  insulation_support BOOLEAN DEFAULT false,
  retention_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active'
);
```

**Sample Data**:
```sql
-- JST PH contacts
('JST-SPH-002T-P0.5S', 'JST PH', 'socket', ARRAY[24,26,28,30], 'tin', false)

-- Molex Mega-Fit contacts
('MOLEX-76650-0001', 'Molex Mega-Fit', 'socket', ARRAY[12,14,16,18], 'tin', true)
('MOLEX-76650-0003', 'Molex Mega-Fit', 'socket', ARRAY[12,14,16,18], 'gold', true)
```

**DRC Checks**:
- `no_compatible_contacts`: Error if no contacts found for connector family + AWG
- Warning: Recommend gold plating for signal applications

---

### Table: mdm_accessories

**Purpose**: Store backshells, strain reliefs, boots, hoods

**Schema**:
```sql
CREATE TABLE mdm_accessories (
  id SERIAL PRIMARY KEY,
  mpn VARCHAR(100) UNIQUE NOT NULL,
  connector_family VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'backshell', 'strain_relief', 'boot', 'hood'
  cable_od_range_in NUMERIC(6,4)[2] NOT NULL,  -- [min, max]
  material VARCHAR(50),       -- 'metal', 'plastic', 'rubber'
  shielding BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active'
);
```

**Sample Data**:
```sql
-- 3M IDC strain reliefs
('3M-3420-0001', '3M IDC', 'strain_relief', ARRAY[0.15, 0.30], 'plastic', false)

-- Molex Mega-Fit backshells (metal, shielded)
('MOLEX-76991-0001', 'Molex Mega-Fit', 'backshell', ARRAY[0.20, 0.35], 'metal', true)
```

**DRC Checks**:
- `no_compatible_accessories`: Warning if no accessories match connector family + cable OD

---

## DRC Engine Integration

### Loading Rule Tables

```python
class DrcEngine:
    def __init__(self, ruleset_id: str = "rs-001"):
        self.ruleset_id = ruleset_id
        self.rule_tables = self._load_rule_tables()
        self.mdm_dao = MDMDAO()

    def _load_rule_tables(self) -> Dict[str, Any]:
        """Load JSON rule tables from services/rules/rulesets/{ruleset_id}/"""
        rules_dir = Path(__file__).parent.parent / "rules" / "rulesets" / self.ruleset_id
        rule_tables = {}
        
        for json_file in rules_dir.glob("*.json"):
            with open(json_file, 'r') as f:
                rule_tables[json_file.stem] = json.load(f)
        
        return rule_tables
```

### Example DRC Checks

#### 1. Ampacity Check (uses ampacity.json)

```python
def _check_awg_compatibility(self, proposal: SynthesisProposal) -> List[DrcIssue]:
    awg = proposal.conductors.awg
    ampacity_table = self.rule_tables.get("ampacity", {}).get("data", {})
    
    if str(awg) not in ampacity_table:
        return [DrcIssue(
            type="awg_not_supported",
            severity="error",
            message=f"AWG {awg} not found in ampacity table"
        )]
    
    ampacity = ampacity_table[str(awg)]
    current_rating = proposal.conductors.current_rating
    
    if current_rating > ampacity:
        return [DrcIssue(
            type="current_exceeds_ampacity",
            severity="error",
            message=f"Current {current_rating}A exceeds AWG {awg} ampacity of {ampacity}A"
        )]
```

#### 2. Locale Color Check (uses locale_ac_colors.json)

```python
def _check_locale_ac_colors(self, proposal: SynthesisProposal) -> List[DrcIssue]:
    locale_colors_table = self.rule_tables.get("locale_ac_colors", {}).get("data", {})
    locale = proposal.locale or "us"
    
    if locale not in locale_colors_table:
        return [DrcIssue(
            type="unsupported_locale",
            severity="warning",
            message=f"Locale '{locale}' not found in color standards"
        )]
    
    locale_colors = locale_colors_table[locale]
    issues = []
    
    for i, color in enumerate(proposal.conductors.ac_colors):
        expected = locale_colors.get(str(i + 1))
        if expected and color.lower() != expected.lower():
            issues.append(DrcIssue(
                type="ac_color_mismatch",
                severity="warning",
                message=f"Conductor {i+1} color '{color}' doesn't match locale '{locale}' standard '{expected}'"
            ))
    
    return issues
```

#### 3. MDM Accessory Check (queries mdm_accessories table)

```python
def _check_mdm_requirements(self, proposal: SynthesisProposal) -> List[DrcIssue]:
    issues = []
    
    for endpoint_name, endpoint in proposal.endpoints.items():
        cable_od_in = proposal.conductors.od_mm / 25.4
        accessories = self.mdm_dao.find_accessories_by(
            endpoint.connector.family,
            cable_od_in
        )
        
        if not accessories:
            issues.append(DrcIssue(
                type="no_compatible_accessories",
                severity="warning",
                message=f"No accessories found for {endpoint.connector.family} with cable OD {cable_od_in:.3f}\""
            ))
    
    return issues
```

---

## Test Coverage

### Rule Table Tests (test_drc_rule_tables.py)

All 7 tests passing:

1. ✅ `test_rule_tables_loaded` - Verifies all 5 JSON tables load correctly
2. ✅ `test_ampacity_table_drives_awg_decisions` - Tests current/ampacity validation
3. ✅ `test_unsupported_awg_rejected` - Tests AWG not in table → error
4. ✅ `test_bend_radius_table_used` - Tests bend radius multiplier calculations
5. ✅ `test_voltage_temp_table_used` - Tests voltage/temp limits
6. ✅ `test_locale_ac_colors_affect_consistency` - Tests US vs EU color codes
7. ✅ `test_unsupported_locale_warning` - Tests unknown locale handling

### MDM DAO Tests (test_mdm_dao.py)

All 7 tests passing:

1. ✅ `test_find_ribbon_by_10_way_050_pitch` - Queries ribbon cables
2. ✅ `test_find_ribbon_by_40_way_025_pitch` - Queries fine pitch ribbons
3. ✅ `test_find_round_cable_by_2_conductor_14_awg` - Queries round power cables
4. ✅ `test_find_contacts_by_molex_megafit_14_awg` - Queries crimp contacts
5. ✅ `test_find_lugs_by_10_stud_8_awg` - Queries ring lugs by stud size
6. ✅ `test_find_accessories_by_3m_idc_cable_od` - Queries strain reliefs by cable OD
7. ✅ `test_find_connector_by_family_termination` - Queries connectors

**Total: 14/14 tests passing** ✅

---

## Running Tests

```bash
# Inside DRC container
docker-compose exec drc pytest test_drc_rule_tables.py test_mdm_dao.py -v

# Expected output:
# ================================================================= test session starts =================================================================
# test_mdm_dao.py::TestMDMDAO::test_find_ribbon_by_10_way_050_pitch PASSED         [  7%]
# test_mdm_dao.py::TestMDMDAO::test_find_ribbon_by_40_way_025_pitch PASSED         [ 14%]
# test_mdm_dao.py::TestMDMDAO::test_find_round_cable_by_2_conductor_14_awg PASSED  [ 21%]
# test_mdm_dao.py::TestMDMDAO::test_find_contacts_by_molex_megafit_14_awg PASSED   [ 28%]
# test_mdm_dao.py::TestMDMDAO::test_find_lugs_by_10_stud_8_awg PASSED              [ 35%]
# test_mdm_dao.py::TestMDMDAO::test_find_accessories_by_3m_idc_cable_od PASSED     [ 42%]
# test_mdm_dao.py::TestMDMDAO::test_find_connector_by_family_termination PASSED    [ 50%]
# test_drc_rule_tables.py::TestDrcEngine::test_rule_tables_loaded PASSED           [ 57%]
# test_drc_rule_tables.py::TestDrcEngine::test_ampacity_table_drives_awg_decisions PASSED [ 64%]
# test_drc_rule_tables.py::TestDrcEngine::test_unsupported_awg_rejected PASSED     [ 71%]
# test_drc_rule_tables.py::TestDrcEngine::test_bend_radius_table_used PASSED       [ 78%]
# test_drc_rule_tables.py::TestDrcEngine::test_voltage_temp_table_used PASSED      [ 85%]
# test_drc_rule_tables.py::TestDrcEngine::test_locale_ac_colors_affect_consistency PASSED [ 92%]
# test_drc_rule_tables.py::TestDrcEngine::test_unsupported_locale_warning PASSED   [100%]
# ================================================================== 14 passed in 0.22s ==================================================================
```

---

## Configuration

### Environment Variables

**DRC Service** (docker-compose.yml):
```yaml
drc:
  environment:
    MDM_DATABASE_URL: "postgresql://postgres:postgres@pg-extra:5432/extradb"
    BFF_DATABASE_URL: "postgresql://postgres:postgres@supabase-db:5432/appdb"
```

**MDMDAO** (mdm_dao.py):
```python
self.db_url = os.getenv(
    'MDM_DATABASE_URL',
    os.getenv('BFF_DATABASE_URL', 'postgresql://postgres:postgres@pg-extra:5432/extradb')
)
```

### Dockerfile

**Dockerfile.drc**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY services/drc/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/drc .
COPY services/rules ../rules  # ← Rule tables copied here
EXPOSE 8000
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]
```

---

## Adding New Rules

### 1. Add to Existing Rule Table

Edit `services/rules/rulesets/rs-001/<table>.json`:

```json
// ampacity.json - add AWG 6
{
  "data": {
    "6": 101,  // ← New entry
    "8": 73,
    // ... existing entries
  }
}
```

### 2. Create New Rule Table

Create `services/rules/rulesets/rs-001/my_new_rules.json`:

```json
{
  "metadata": {
    "ruleset_id": "rs-001",
    "table_name": "my_new_rules",
    "description": "My custom validation rules",
    "version": "1.0"
  },
  "data": {
    "rule1": { "threshold": 100, "unit": "mm" },
    "rule2": { "threshold": 50, "unit": "%" }
  }
}
```

Update `drc.py` to use the new table:

```python
def _check_my_new_rules(self, proposal: SynthesisProposal) -> List[DrcIssue]:
    new_rules = self.rule_tables.get("my_new_rules", {}).get("data", {})
    # ... validation logic
```

### 3. Add New MDM Table

Edit `db/postgres_extra/init/001_seed.sql`:

```sql
CREATE TABLE IF NOT EXISTS mdm_new_parts (
  id SERIAL PRIMARY KEY,
  mpn VARCHAR(100) UNIQUE NOT NULL,
  -- ... your columns
);

INSERT INTO mdm_new_parts (mpn, ...) VALUES
  ('PART-001', ...),
  ('PART-002', ...);
```

Rebuild pg-extra:
```bash
docker-compose down pg-extra
docker volume rm ananta-cable-platform_pg_extra_data
docker-compose up -d pg-extra
```

---

## Troubleshooting

### Issue: Rule tables not loading

**Symptom**: `rule_tables` dict is empty

**Solution**: 
1. Check Dockerfile copies rules: `COPY services/rules ../rules`
2. Verify path in `drc.py`: `Path(__file__).parent.parent / "rules" / "rulesets" / self.ruleset_id`
3. Rebuild DRC container: `docker-compose up -d --build drc`

### Issue: MDM tables don't exist

**Symptom**: `psycopg2.errors.UndefinedTable: relation "mdm_cables" does not exist`

**Solution**:
1. Check seed file: `db/postgres_extra/init/001_seed.sql`
2. Delete volume to force re-init:
   ```bash
   docker-compose down pg-extra
   docker volume rm ananta-cable-platform_pg_extra_data
   docker-compose up -d pg-extra
   ```
3. Verify tables: `docker-compose exec pg-extra psql -U postgres -d extradb -c "\dt"`

### Issue: DRC can't connect to MDM database

**Symptom**: Tests fail with connection errors

**Solution**:
1. Check `MDM_DATABASE_URL` in docker-compose.yml
2. Verify pg-extra is running: `docker-compose ps pg-extra`
3. Check DRC depends on pg-extra: `depends_on: [supabase-db, pg-extra]`
4. Restart DRC: `docker-compose restart drc`

---

## Future Enhancements

1. **Label Validation**
   - Check label placement offsets
   - Validate material temperature compatibility
   - Verify UL94-V0 rating for enclosed equipment

2. **Advanced MDM Queries**
   - Cost optimization (prefer lower cost parts)
   - Lead time considerations
   - Preferred vendor lists
   - Lifecycle status (active, NRND, obsolete)

3. **Additional Rule Tables**
   - EMI/RFI requirements
   - Chemical resistance matrices
   - IP rating validation
   - Regulatory compliance (UL, CE, RoHS)

4. **Rule Set Versioning**
   - Support multiple rule sets (rs-001, rs-002, custom)
   - Rule set inheritance
   - Customer-specific rule overrides

---

## References

- **NEC**: National Electrical Code (NFPA 70)
- **IEC 60446**: Identification of conductors by colours
- **UL 758**: Appliance Wiring Material
- **UL 969**: Marking and Labeling Systems
- **UL 94**: Tests for Flammability of Plastic Materials
- **IPC/WHMA-A-620**: Requirements and Acceptance for Cable and Wire Harness Assemblies
- **JIS C 3306**: Japanese Industrial Standard for conductor identification

---

**Last Updated**: 2025-10-08
**Version**: 1.0
**Test Status**: 14/14 passing ✅
