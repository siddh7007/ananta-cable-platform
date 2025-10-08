# DRC Quick Reference Card

## 🎯 What Was Delivered

✅ **5 JSON Rule Tables** in `services/rules/rulesets/rs-001/`
- ampacity.json - AWG current capacity (NEC)
- bend_radius.json - Minimum bend radius by cable type
- voltage_temp.json - Voltage/temp ratings per AWG
- locale_ac_colors.json - AC color codes (US/EU/JP/etc)
- label_defaults.json - Label placement & UL94-V0 specs

✅ **4 MDM Database Tables** in `db/postgres_extra/`
- mdm_cables - Ribbon & round cables (8 seed parts)
- mdm_connectors - JST/Molex/3M/TE connectors (12 seed parts)
- mdm_contacts - Crimp pins/sockets (5 seed parts)
- mdm_accessories - Backshells/strain reliefs (8 seed parts)

✅ **DRC Engine Integration**
- Loads rule tables by ruleset_id
- Queries MDM for parts availability
- 14 validation checks covering all requirements

✅ **Test Coverage: 14/14 (100%)**
- 7 rule table tests ✅
- 7 MDM DAO tests ✅

---

## 🚀 Quick Start

### Run All DRC Tests
```bash
docker-compose exec drc pytest test_drc_rule_tables.py test_mdm_dao.py -v
# Expected: 14 passed in ~0.2s
```

### Check Rule Tables Loaded
```bash
docker-compose exec drc python -c "from drc import DrcEngine; e = DrcEngine(); print(list(e.rule_tables.keys()))"
# Expected: ['ampacity', 'bend_radius', 'voltage_temp', 'locale_ac_colors', 'label_defaults']
```

### Check MDM Tables
```bash
docker-compose exec pg-extra psql -U postgres -d extradb -c "\dt"
# Expected: mdm_cables, mdm_connectors, mdm_contacts, mdm_accessories
```

---

## 📋 Rule Table Reference

| Table | Purpose | Key Data | Standard |
|-------|---------|----------|----------|
| **ampacity** | Current capacity by AWG | 8→73A, 18→16A, 30→0.86A | NEC 310.15 |
| **bend_radius** | Min bend radius multipliers | round=8×OD, ribbon=10×thickness | IPC-A-620 |
| **voltage_temp** | Voltage/temp limits | 18AWG=300V/80°C, 26AWG=150V/80°C | UL 758 |
| **locale_ac_colors** | AC wire colors | US: black/red, EU: brown/black | NEC, IEC 60446 |
| **label_defaults** | Label specs | offset=25mm, UL94-V0 required | UL 969, UL 94 |

---

## 🔍 MDM Table Quick Lookup

### Find Parts Examples

```python
from mdm_dao import MDMDAO
dao = MDMDAO()

# Find 10-way 0.050" ribbon cable
cables = dao.find_ribbon_by(ways=10, pitch_in=0.05, temp_min=80, shield="none")

# Find contacts for Molex Mega-Fit, 14 AWG
contacts = dao.find_contacts_by("Molex Mega-Fit", 14, "tin")

# Find ring lugs for #10 stud, 8 AWG wire
lugs = dao.find_lugs_by("#10", 8)

# Find accessories for 3M IDC with 0.25" cable OD
accessories = dao.find_accessories_by("3M IDC", 0.25)
```

---

## 🛠️ Common Tasks

### Rebuild DRC with New Code
```bash
docker-compose up -d --build drc
```

### Recreate MDM Database
```bash
# When seed data changes
docker-compose down pg-extra
docker volume rm ananta-cable-platform_pg_extra_data
docker-compose up -d pg-extra
```

### Add New Rule Table
1. Create `services/rules/rulesets/rs-001/my_table.json`
2. Rebuild DRC: `docker-compose up -d --build drc`
3. Access in code: `self.rule_tables.get("my_table")`

### Add MDM Seed Data
1. Edit `db/postgres_extra/init/001_seed.sql`
2. Recreate pg-extra (see above)

---

## 📊 Test Validation Examples

### Ampacity Check
```python
# 18 AWG at 20A (exceeds 16A limit)
# Result: ERROR - current_exceeds_ampacity
```

### Bend Radius Check
```python
# Standard cable: OD=5mm, bend=20mm
# Min required: 5mm × 8 = 40mm
# Result: ERROR - bend_radius_too_small
```

### Color Code Check
```python
# US locale with ["brown", "blue"]
# Expected: ["black", "white"]
# Result: WARNING - ac_color_mismatch
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Rule tables empty | Check Dockerfile copies `services/rules`, rebuild DRC |
| MDM tables missing | Recreate pg-extra volume (see commands above) |
| Tests fail | Check logs: `docker-compose logs drc` |
| Can't connect to MDM | Verify `MDM_DATABASE_URL` in docker-compose.yml |

---

## 📚 Documentation

- **Full Spec**: `docs/DRC_RULE_TABLES_AND_MDM.md` (69KB)
- **Summary**: `docs/DRC_IMPLEMENTATION_SUMMARY.md` (27KB)
- **This Card**: `docs/DRC_QUICK_REFERENCE.md` (4KB)

---

## 🔗 Key Files

```
services/
├── drc/
│   ├── drc.py              # DRC validation engine
│   ├── mdm_dao.py          # MDM database queries
│   ├── test_drc_rule_tables.py  # 7 rule table tests
│   └── test_mdm_dao.py     # 7 MDM lookup tests
└── rules/
    └── rulesets/
        └── rs-001/         # Default rule set
            ├── ampacity.json
            ├── bend_radius.json
            ├── voltage_temp.json
            ├── locale_ac_colors.json
            └── label_defaults.json

db/
└── postgres_extra/
    └── init/
        └── 001_seed.sql    # MDM tables & seed data
```

---

## ✅ Acceptance Criteria Status

| Requirement | Status | Evidence |
|-------------|--------|----------|
| JSON rule tables in rs-001/ | ✅ | 5 files created |
| DRC loads tables by ruleset_id | ✅ | `_load_rule_tables()` method |
| MDM accessory clamp ranges | ✅ | `mdm_accessories` table |
| MDM lug insulation flags | ✅ | `mdm_connectors` table |
| MDM contact plating | ✅ | `mdm_contacts` table |
| Ampacity drives AWG decision | ✅ | Test passing |
| Locale colors affect checks | ✅ | Test passing |

**Total: 7/7 criteria met** ✅

---

**Last Updated**: 2025-10-08
**Commit**: a4167cc
**Test Status**: 14/14 passing (100%) ✅
