import pytest
from drc import DrcEngine
from models import (
    SynthesisProposal, ConductorSpec, EndpointFull, PartRef,
    ShieldSpec, DrcResult
)

class TestDrcEngine:
    """Test DRC engine rule table integration."""

    @pytest.fixture
    def drc_engine(self):
        """Create DRC engine with rule tables loaded."""
        return DrcEngine()

    def test_rule_tables_loaded(self, drc_engine):
        """Test that rule tables are loaded correctly."""
        assert "ampacity" in drc_engine.rule_tables
        assert "bend_radius" in drc_engine.rule_tables
        assert "voltage_temp" in drc_engine.rule_tables
        assert "locale_ac_colors" in drc_engine.rule_tables
        assert "label_defaults" in drc_engine.rule_tables

    def test_ampacity_table_drives_awg_decisions(self, drc_engine):
        """Test that ampacity table drives AWG current rating decisions."""
        # Test valid AWG with acceptable current
        proposal = SynthesisProposal(
            proposal_id="test-001",
            draft_id="test-001",
            cable={},  # Empty dict for simplified test
            conductors=ConductorSpec(
                awg=18,
                count=2,
                current_rating=10  # Within 18 AWG ampacity of 14A
            ),
            endpoints={},  # Empty dict for simplified test
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[],
            locale="us"
        )

        result = drc_engine.validate_proposal(proposal)
        # Should pass or have no ampacity errors
        ampacity_issues = [i for i in result.issues if "ampacity" in i.type or "current" in i.type]
        assert len(ampacity_issues) == 0

        # Test AWG with excessive current
        proposal.conductors.current_rating = 20  # Exceeds 18 AWG ampacity of 14A

        result = drc_engine.validate_proposal(proposal)
        ampacity_issues = [i for i in result.issues if "ampacity" in i.type or "current" in i.type]
        assert len(ampacity_issues) > 0
        assert "exceeds" in ampacity_issues[0].message.lower()

    def test_unsupported_awg_rejected(self, drc_engine):
        """Test that unsupported AWG sizes are rejected."""
        proposal = SynthesisProposal(
            proposal_id="test-002",
            draft_id="test-002",
            cable={},
            conductors=ConductorSpec(
                awg=99,  # Not in ampacity table
                count=2,
                current_rating=1
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[],
            locale="us"
        )

        result = drc_engine.validate_proposal(proposal)
        awg_issues = [i for i in result.issues if "awg" in i.type and "not_supported" in i.type]
        assert len(awg_issues) > 0
        assert "not found" in awg_issues[0].message.lower()

    def test_bend_radius_table_used(self, drc_engine):
        """Test that bend radius table is used for validation."""
        # Test with standard cable family
        proposal = SynthesisProposal(
            proposal_id="test-003",
            draft_id="test-003",
            cable={},
            conductors=ConductorSpec(
                awg=18,
                count=2,
                od_mm=5.0,
                family="standard"
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[],
            bend_radius_mm=40,  # Should be OK (5.0 * 8 = 40mm min)
            locale="us"
        )

        result = drc_engine.validate_proposal(proposal)
        bend_issues = [i for i in result.issues if "bend" in i.type]
        assert len(bend_issues) == 0

        # Test with too small bend radius
        proposal.bend_radius_mm = 20  # Too small

        result = drc_engine.validate_proposal(proposal)
        bend_issues = [i for i in result.issues if "bend" in i.type]
        assert len(bend_issues) > 0
        assert "too small" in bend_issues[0].message.lower()

    def test_voltage_temp_table_used(self, drc_engine):
        """Test that voltage/temp table is used for electrical ratings."""
        proposal = SynthesisProposal(
            proposal_id="test-004",
            draft_id="test-004",
            cable={},
            conductors=ConductorSpec(
                awg=18,
                count=2,
                voltage_rating=600,  # Exceeds 18 AWG limit of 300V
                temp_rating_c=90     # Exceeds 18 AWG limit of 80C
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[],
            locale="us"
        )

        result = drc_engine.validate_proposal(proposal)

        voltage_issues = [i for i in result.issues if "voltage" in i.type]
        temp_issues = [i for i in result.issues if "temperature" in i.type]

        assert len(voltage_issues) > 0
        assert len(temp_issues) > 0
        assert "exceeds" in voltage_issues[0].message.lower()
        assert "exceeds" in temp_issues[0].message.lower()

    def test_locale_ac_colors_affect_consistency(self, drc_engine):
        """Test that locale affects AC conductor color consistency checks."""
        # Test US locale with correct colors
        proposal = SynthesisProposal(
            proposal_id="test-005",
            draft_id="test-005",
            cable={},
            conductors=ConductorSpec(
                awg=18,
                count=2,
                ac_colors=["black", "white"]  # Correct for US locale
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[],
            locale="us"
        )

        result = drc_engine.validate_proposal(proposal)
        color_issues = [i for i in result.issues if "color" in i.type]
        assert len(color_issues) == 0

        # Test US locale with wrong colors
        proposal.conductors.ac_colors = ["brown", "blue"]  # Wrong for US

        result = drc_engine.validate_proposal(proposal)
        color_issues = [i for i in result.issues if "color" in i.type]
        assert len(color_issues) > 0
        assert "doesn't match" in color_issues[0].message.lower()

    def test_unsupported_locale_warning(self, drc_engine):
        """Test that unsupported locales generate warnings."""
        proposal = SynthesisProposal(
            proposal_id="test-006",
            draft_id="test-006",
            cable={},
            conductors=ConductorSpec(
                awg=18,
                count=2
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[],
            locale="unsupported_locale"
        )

        result = drc_engine.validate_proposal(proposal)
        locale_issues = [i for i in result.issues if "locale" in i.type]
        assert len(locale_issues) > 0
        assert "not found" in locale_issues[0].message.lower()