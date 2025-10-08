import pytest

from .drc_engine import DRCEngine
from .models import AssemblySchema


def ribbon_assembly() -> AssemblySchema:
    return AssemblySchema(
        assembly_id="assy-ribbon-12way",
        schema_hash="hash-ribbon",
        cable={
            "type": "ribbon",
            "length_mm": 600,
            "od_mm": 1.6,
            "bend_radius_mm": 15.0,
            "min_bend_radius_mm": 15.0,
            "environment": {
                "temp_min_c": -20,
                "temp_max_c": 80,
                "flex_class": "static",
                "chemicals": [],
            },
            "electrical": {
                "system_voltage_v": 48,
                "per_circuit": [
                    {"circuit": "SIG1", "current_a": 0.15, "voltage_v": 48},
                    {"circuit": "SIG2", "current_a": 0.15, "voltage_v": 48},
                ],
            },
            "ratings": {"voltage_v": 300, "temp_c": 105},
            "emi": {"shield": "none", "drain_policy": "isolated"},
            "locale": "NA",
            "compliance": {"ipc_class": "2", "ul94_v0_labels": True, "rohs_reach": True},
        },
        conductors={
            "count": 12,
            "awg": 28,
            "ribbon": {"ways": 12, "pitch_in": 0.05, "red_stripe": True},
        },
        endpoints={
            "endA": {
                "connector": {"mpn": "IDC-12A", "positions": 12, "pin1_indicator": True},
                "termination": "idc",
                "contacts": {"primary": {"mpn": "IDC-12A-CONTACT", "plating": "gold-flash"}},
                "accessories": [],
            },
            "endB": {
                "connector": {"mpn": "IDC-12B", "positions": 12, "pin1_indicator": True},
                "termination": "idc",
                "contacts": {"primary": {"mpn": "IDC-12B-CONTACT", "plating": "gold-flash"}},
                "accessories": [],
            },
        },
        shield={"type": "none", "drain_policy": "isolated"},
        wirelist=[
            {"circuit": "SIG1", "conductor": 1, "color": "RED"},
            {"circuit": "SIG2", "conductor": 2, "color": "BLACK"},
        ],
        bom=[
            {"ref": {"mpn": "IDC-12A"}, "qty": 1, "role": "primary"},
            {"ref": {"mpn": "IDC-12B"}, "qty": 1, "role": "primary"},
        ],
        labels={
            "title_block": {"pn": "CAB-100", "rev": "A", "mfr": "ACME", "date": "01/25"},
            "text": "PN CAB-100 REV A MFR ACME 01/25",
            "offset_mm": 30,
        },
    )


def ring_lug_power_assembly() -> AssemblySchema:
    return AssemblySchema(
        assembly_id="assy-power-lug",
        schema_hash="hash-power",
        cable={
            "type": "power_cable",
            "length_mm": 300,
            "od_mm": 6.0,
            "bend_radius_mm": 55.0,
            "min_bend_radius_mm": 48.0,
            "environment": {
                "temp_min_c": -40,
                "temp_max_c": 90,
                "flex_class": "static",
                "chemicals": [],
            },
            "electrical": {
                "system_voltage_v": 300,
                "per_circuit": [
                    {"circuit": "L1", "current_a": 10.0, "voltage_v": 300},
                    {"circuit": "N", "current_a": 10.0, "voltage_v": 300},
                ],
            },
            "ratings": {"voltage_v": 600, "temp_c": 125},
            "emi": {"shield": "foil", "drain_policy": "fold_back"},
            "locale": "NA",
            "compliance": {"ipc_class": "3", "ul94_v0_labels": True, "rohs_reach": True},
        },
        conductors={"count": 2, "awg": 14},
        endpoints={
            "endA": {
                "connector": {"mpn": "RING-A", "positions": 2, "pin1_indicator": True},
                "termination": "ring_lug",
                "contacts": {"primary": {"mpn": "LUG-14AWG", "plating": "tin"}},
                "lugs": [{"stud": "M6"}],
                "requires_heat_shrink": False,
                "accessories": [],
            },
            "endB": {
                "connector": {"mpn": "RING-B", "positions": 2, "pin1_indicator": True},
                "termination": "ring_lug",
                "contacts": {"primary": {"mpn": "LUG-14AWG", "plating": "tin"}},
                "lugs": [{}],  # stud missing on purpose
                "requires_heat_shrink": False,
                "accessories": [],
            },
        },
        shield={"type": "foil", "drain_policy": "fold_back"},
        wirelist=[
            {"circuit": "L1", "conductor": 1, "color": "RED"},
            {"circuit": "N", "conductor": 2, "color": "BLACK"},
        ],
        bom=[{"ref": {"mpn": "RING-A"}, "qty": 1, "role": "primary"}],
        labels={
            "title_block": {"pn": "POW-200", "rev": "B", "mfr": "ACME", "date": "02/25"},
            "text": "PN POW-200 REV B MFR ACME 02/25",
            "offset_mm": 30,
        },
    )


def clamp_sensor_assembly() -> AssemblySchema:
    return AssemblySchema(
        assembly_id="assy-clamp",
        schema_hash="hash-clamp",
        cable={
            "type": "sensor_lead",
            "length_mm": 250,
            "od_mm": 6.0,
            "bend_radius_mm": 50.0,
            "min_bend_radius_mm": 48.0,
            "environment": {
                "temp_min_c": -20,
                "temp_max_c": 80,
                "flex_class": "flex",
                "chemicals": [],
            },
            "electrical": {
                "system_voltage_v": 48,
                "per_circuit": [
                    {"circuit": "SIG", "current_a": 0.5, "voltage_v": 48},
                    {"circuit": "RET", "current_a": 0.5, "voltage_v": 48},
                ],
            },
            "ratings": {"voltage_v": 300, "temp_c": 105},
            "emi": {"shield": "braid", "drain_policy": "fold_back"},
            "locale": "NA",
            "compliance": {"ipc_class": "2", "ul94_v0_labels": True, "rohs_reach": True},
        },
        conductors={"count": 3, "awg": 18},
        endpoints={
            "endA": {
                "connector": {"mpn": "DTM-3P", "positions": 3, "pin1_indicator": True},
                "termination": "crimp",
                "contacts": {"primary": {"mpn": "DTM-3P-CON", "plating": "gold-flash"}},
                "accessories": [
                    {
                        "mpn": "CLAMP-6MM",
                        "clamp": {"min_od_mm": 5.5, "max_od_mm": 5.85},
                    }
                ],
            },
            "endB": {
                "connector": {"mpn": "DTM-3S", "positions": 3, "pin1_indicator": True},
                "termination": "crimp",
                "contacts": {"primary": {"mpn": "DTM-3S-CON", "plating": "gold-flash"}},
                "accessories": [],
            },
        },
        shield={"type": "braid", "drain_policy": "fold_back"},
        wirelist=[
            {"circuit": "SIG", "conductor": 1, "color": "WHITE"},
            {"circuit": "RET", "conductor": 2, "color": "BLACK"},
            {"circuit": "SPARE", "conductor": 3, "color": "GREEN"},
        ],
        bom=[{"ref": {"mpn": "DTM-3P"}, "qty": 1, "role": "primary"}],
        labels={
            "title_block": {"pn": "SNS-300", "rev": "C", "mfr": "ACME", "date": "03/25"},
            "text": "PN SNS-300 REV C MFR ACME 03/25",
            "offset_mm": 30,
        },
    )


@pytest.fixture
def engine():
    return DRCEngine()


def test_ribbon_passes_mechanical_and_electrical_rules(engine: DRCEngine):
    assembly = ribbon_assembly()
    report = engine.run_drc(assembly)

    assert report.passed is True
    assert report.errors == 0
    assert report.warnings == 0


def test_ring_lug_missing_stud_is_error(engine: DRCEngine):
    assembly = ring_lug_power_assembly()
    report = engine.run_drc(assembly)

    stud_error = next((f for f in report.findings if f.code == "CONSISTENCY/STUD_SIZE_MISSING"), None)
    assert stud_error is not None
    assert stud_error.severity == "error"
    assert stud_error.where == "endB.lugs[*].stud"
    assert report.errors == 1


def test_clamp_mismatch_warns_and_suggests_fix(engine: DRCEngine):
    assembly = clamp_sensor_assembly()
    report = engine.run_drc(assembly)

    clamp_warning = [
        f for f in report.findings if f.code == "MECHANICAL/CLAMP_RANGE_MISMATCH" and f.severity == "warning"
    ]
    assert clamp_warning, "Expected clamp range warning when OD mismatch within tolerance"

    clamp_fix = next((fix for fix in report.fixes if fix.id.startswith("FIX_CLAMP_ADJUST_")), None)
    assert clamp_fix is not None
    assert clamp_fix.effect == "substitution"


def test_missing_label_offset_gets_fix(engine: DRCEngine):
    assembly = ribbon_assembly().model_copy(deep=True)
    labels = assembly.labels or {}
    labels.pop("offset_mm", None)
    assembly.labels = labels

    report = engine.run_drc(assembly)

    warning = next((f for f in report.findings if f.code == "LABEL_OFFSET_MISSING"), None)
    assert warning is not None
    assert warning.severity == "warning"

    fix = next((fix for fix in report.fixes if fix.id == "FIX_LABEL_OFFSET_DEFAULT"), None)
    assert fix is not None
    assert fix.effect == "non_destructive"

    new_hash, fixed_report = engine.apply_fixes(assembly, ["FIX_LABEL_OFFSET_DEFAULT"])
    assert isinstance(new_hash, str) and new_hash
    assert all(f.code != "LABEL_OFFSET_MISSING" for f in fixed_report.findings)
