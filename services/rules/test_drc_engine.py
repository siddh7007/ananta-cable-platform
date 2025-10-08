import pytest
from models import AssemblySchema, DRCFinding, DRCFix
from drc_engine import DRCEngine

class TestDRCEngine:
    """Test cases for DRC engine."""

    @pytest.fixture
    def engine(self):
        return DRCEngine()

    def test_pass_case_ribbon_idc_12way(self, engine):
        """Test that a valid ribbon IDC 12-way assembly passes DRC."""
        assembly = AssemblySchema(
            assembly_id="test-ribbon-12way",
            schema_hash="hash123",
            cable={
                "type": "ribbon",
                "length_mm": 500,
                "environment": {"temp_min_c": -20, "temp_max_c": 80, "flex_class": "static"},
                "electrical": {"system_voltage_v": 300},
                "emi": {"shield": "none", "drain_policy": "isolated"},
                "locale": "NA",
                "compliance": {"ipc_class": "2", "ul94_v0_labels": True, "rohs_reach": True}
            },
            conductors={
                "count": 12,
                "awg": 28,
                "color_map": ["BROWN", "RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "VIOLET", "GRAY", "WHITE", "BLACK", "BROWN/RED", "RED/BLUE"],
                "ribbon": {"ways": 12, "red_stripe": True}
            },
            endpoints={
                "endA": {
                    "connector": {"mpn": "3M-89112-0101HA", "family": "IDC", "positions": 12},
                    "termination": "idc",
                    "contacts": {"primary": {"mpn": "CONTACT-28AWG"}, "alternates": []},
                    "accessories": []
                },
                "endB": {
                    "connector": {"mpn": "3M-89112-0101HA", "family": "IDC", "positions": 12},
                    "termination": "idc",
                    "contacts": {"primary": {"mpn": "CONTACT-28AWG"}, "alternates": []},
                    "accessories": []
                }
            },
            shield={"type": "none", "drain_policy": "isolated"},
            wirelist=[
                {"circuit": "1", "conductor": 1, "endA_pin": "1", "endB_pin": "1", "color": "BROWN"},
                {"circuit": "2", "conductor": 2, "endA_pin": "2", "endB_pin": "2", "color": "RED"},
                # ... more wires would be here
            ],
            bom=[
                {"ref": {"mpn": "3M-89112-0101HA"}, "qty": 2, "role": "primary"},
                {"ref": {"mpn": "CONTACT-28AWG"}, "qty": 24, "role": "primary"}
            ],
            labels={
                "title_block": {"pn": "ASSY-001", "rev": "A", "mfr": "TEST", "date": "2025-01"},
                "text": "PN: ASSY-001 REV: A MFR: TEST 2025-01",
                "offset_mm": 30
            }
        )

        report = engine.run_drc(assembly)

        assert report.passed is True
        assert report.errors == 0
        assert len(report.findings) == 0 or all(f.severity in ["info", "warning"] for f in report.findings)

    def test_power_cable_ring_lug_missing_stud_size(self, engine):
        """Test power cable with ring lugs but missing stud size."""
        assembly = AssemblySchema(
            assembly_id="test-power-ring-lug",
            schema_hash="hash456",
            cable={
                "type": "power_cable",
                "length_mm": 300,
                "environment": {"temp_min_c": -40, "temp_max_c": 105, "flex_class": "flex"},
                "electrical": {
                    "system_voltage_v": 600,
                    "per_circuit": [
                        {"circuit": "L1", "current_a": 15, "voltage_v": 230},
                        {"circuit": "N", "current_a": 15, "voltage_v": 230}
                    ]
                },
                "emi": {"shield": "braid", "drain_policy": "isolated"},
                "locale": "NA",
                "compliance": {"ipc_class": "3", "ul94_v0_labels": True, "rohs_reach": True}
            },
            conductors={"count": 2, "awg": 14},
            endpoints={
                "endA": {
                    "connector": {"mpn": "RING-LUG-1/4", "positions": 2},
                    "termination": "ring_lug",
                    "contacts": {"primary": {"mpn": "CU-LUG-14AWG"}, "alternates": []},
                    "accessories": []
                },
                "endB": {
                    "connector": {"mpn": "RING-LUG-1/4", "positions": 2},
                    "termination": "ring_lug",
                    "contacts": {"primary": {"mpn": "CU-LUG-14AWG"}, "alternates": []},
                    "accessories": []
                }
            },
            shield={"type": "braid", "drain_policy": "isolated"},
            wirelist=[
                {"circuit": "L1", "conductor": 1, "color": "BLACK"},
                {"circuit": "N", "conductor": 2, "color": "WHITE"}
            ],
            bom=[{"ref": {"mpn": "CU-LUG-14AWG"}, "qty": 2, "role": "primary"}],
            labels={"offset_mm": 25}
        )

        report = engine.run_drc(assembly)

        # Should have error about missing stud size
        stud_size_errors = [f for f in report.findings
                          if f.code == "STUD_SIZE_MISSING" and f.severity == "error"]
        assert len(stud_size_errors) >= 1
        assert any("Ring lug termination requires stud size" in f.message for f in stud_size_errors)

    def test_clamp_out_of_range_with_fix(self, engine):
        """Test accessory clamp out by 0.15 mm with fix suggestion."""
        assembly = AssemblySchema(
            assembly_id="test-clamp-range",
            schema_hash="hash789",
            cable={
                "type": "power_cable",
                "length_mm": 200,
                "environment": {"temp_min_c": -20, "temp_max_c": 80, "flex_class": "static"},
                "electrical": {"system_voltage_v": 300},
                "emi": {"shield": "foil", "drain_policy": "fold_back"},
                "locale": "NA",
                "compliance": {"ipc_class": "2", "ul94_v0_labels": True, "rohs_reach": True}
            },
            conductors={"count": 3, "awg": 18},
            endpoints={
                "endA": {
                    "connector": {"mpn": "DEUTSCH-DTM04-3P", "positions": 3},
                    "termination": "crimp",
                    "contacts": {"primary": {"mpn": "CONTACT-18AWG"}, "alternates": []},
                    "accessories": [
                        {"mpn": "CLAMP-8MM", "family": "strain_relief"}
                    ]
                },
                "endB": {
                    "connector": {"mpn": "DEUTSCH-DTM06-3S", "positions": 3},
                    "termination": "crimp",
                    "contacts": {"primary": {"mpn": "CONTACT-18AWG"}, "alternates": []},
                    "accessories": []
                }
            },
            shield={"type": "foil", "drain_policy": "fold_back"},
            wirelist=[
                {"circuit": "PWR", "conductor": 1, "color": "RED"},
                {"circuit": "GND", "conductor": 2, "color": "BLACK"},
                {"circuit": "SIG", "conductor": 3, "color": "WHITE"}
            ],
            bom=[
                {"ref": {"mpn": "DEUTSCH-DTM04-3P"}, "qty": 1, "role": "primary"},
                {"ref": {"mpn": "CLAMP-8MM"}, "qty": 1, "role": "primary"}
            ],
            labels={"offset_mm": 30}
        )

        report = engine.run_drc(assembly)

        # Should have warning about clamp range
        clamp_warnings = [f for f in report.findings
                         if "clamp" in f.message.lower() and f.severity == "warning"]
        assert len(clamp_warnings) >= 1

        # Should have fix suggestion for clamp size
        clamp_fixes = [f for f in report.fixes
                      if "clamp" in f.label.lower() and f.effect == "substitution"]
        assert len(clamp_fixes) >= 1
        assert "larger size" in clamp_fixes[0].description

    def test_label_offset_missing_with_fix(self, engine):
        """Test missing label offset with auto-fix."""
        assembly = AssemblySchema(
            assembly_id="test-label-offset",
            schema_hash="hash999",
            cable={
                "type": "sensor_lead",
                "length_mm": 150,
                "environment": {"temp_min_c": -40, "temp_max_c": 125, "flex_class": "high_flex"},
                "electrical": {"system_voltage_v": 24},
                "emi": {"shield": "none", "drain_policy": "isolated"},
                "locale": "NA",
                "compliance": {"ipc_class": "2", "ul94_v0_labels": True, "rohs_reach": True}
            },
            conductors={"count": 4, "awg": 24},
            endpoints={
                "endA": {
                    "connector": {"mpn": "MOLEX-5045-04A", "positions": 4},
                    "termination": "crimp",
                    "contacts": {"primary": {"mpn": "CONTACT-24AWG"}, "alternates": []},
                    "accessories": []
                },
                "endB": {
                    "connector": {"mpn": "MOLEX-5046-04A", "positions": 4},
                    "termination": "crimp",
                    "contacts": {"primary": {"mpn": "CONTACT-24AWG"}, "alternates": []},
                    "accessories": []
                }
            },
            shield={"type": "none", "drain_policy": "isolated"},
            wirelist=[
                {"circuit": "VCC", "conductor": 1, "color": "RED"},
                {"circuit": "GND", "conductor": 2, "color": "BLACK"},
                {"circuit": "DATA+", "conductor": 3, "color": "WHITE"},
                {"circuit": "DATA-", "conductor": 4, "color": "GREEN"}
            ],
            bom=[{"ref": {"mpn": "MOLEX-5045-04A"}, "qty": 1, "role": "primary"}],
            labels={
                "title_block": {"pn": "CABLE-001", "rev": "B", "mfr": "TEST", "date": "2025-01"},
                "text": "PN: CABLE-001 REV: B MFR: TEST 2025-01"
                # offset_mm is missing
            }
        )

        report = engine.run_drc(assembly)

        # Should have warning about missing label offset
        offset_warnings = [f for f in report.findings
                          if f.code == "LABEL_OFFSET_MISSING" and f.severity == "warning"]
        assert len(offset_warnings) == 1
        assert "will use default 30mm" in offset_warnings[0].message

        # Should have auto-fix for label offset
        offset_fixes = [f for f in report.fixes if f.id == "FIX_LABEL_OFFSET_DEFAULT"]
        assert len(offset_fixes) == 1
        assert offset_fixes[0].effect == "non_destructive"
        assert "30mm" in offset_fixes[0].description