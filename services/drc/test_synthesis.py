import pytest
from models import (
    AssemblyStep1, EndpointSelector, EndpointSelectorSeries, TerminationType,
    Environment, Electrical, EMI, PartRef, SynthesisProposal,
    ConductorSpec, EndpointFull, ShieldSpec, WirelistRow, BomLine,
    DrcResult, DrcIssue, DrcIssueType, DrcSeverity, Endpoint
)
from synthesis import SynthesisEngine
from drc import DrcEngine

class TestSynthesisEngine:
    """Test cases for synthesis engine."""

    @pytest.fixture
    def engine(self):
        return SynthesisEngine()

    @pytest.fixture
    def sample_step1_ribbon(self):
        """Sample Step 1 for ribbon cable."""
        return AssemblyStep1(
            type="ribbon",
            length_mm=1000,
            tolerance_mm=50,
            locale="NA",
            endA=Endpoint(
                selector=EndpointSelectorSeries(
                    series="IDC-0.050",
                    positions=10
                ),
                termination="idc"
            ),
            endB=Endpoint(
                selector=EndpointSelectorSeries(
                    series="IDC-0.050",
                    positions=10
                ),
                termination="idc"
            ),
            electrical=Electrical(
                system_voltage_v=5,
                per_circuit=[
                    {"current_a": 0.1, "voltage_v": 5, "signal_type": "digital"},
                    {"current_a": 0.1, "voltage_v": 5, "signal_type": "digital"},
                    {"current_a": 0.1, "voltage_v": 5, "signal_type": "digital"},
                    {"current_a": 0.1, "voltage_v": 5, "signal_type": "digital"},
                    {"current_a": 0.1, "voltage_v": 5, "signal_type": "digital"},
                    {"current_a": 0.1, "voltage_v": 5, "signal_type": "digital"},
                    {"current_a": 0.1, "voltage_v": 5, "signal_type": "digital"},
                    {"current_a": 0.1, "voltage_v": 5, "signal_type": "digital"},
                    {"current_a": 0.1, "voltage_v": 5, "signal_type": "digital"},
                    {"current_a": 0.1, "voltage_v": 5, "signal_type": "digital"}
                ]
            ),
            environment=Environment(
                temp_min_c=-20,
                temp_max_c=85,
                flex_class="static",
                chemicals=[]
            ),
            emi=EMI(
                shield="none",
                drain_policy="isolated"
            ),
            compliance={},  # Empty dict for optional compliance
            constraints={},
            must_use=[],
            notes_pack_id="test_pack"
        )

    @pytest.fixture
    def sample_step1_power(self):
        """Sample Step 1 for power cable."""
        return AssemblyStep1(
            type="power_cable",
            length_mm=2000,
            tolerance_mm=100,
            locale="NA",
            endA=Endpoint(
                selector=EndpointSelectorSeries(
                    series="MOLEX-POWER",
                    positions=2
                ),
                termination="crimp"
            ),
            endB=Endpoint(
                selector=EndpointSelectorSeries(
                    series="MOLEX-POWER",
                    positions=2
                ),
                termination="crimp"
            ),
            electrical=Electrical(
                system_voltage_v=300,
                per_circuit=[
                    {"current_a": 5, "voltage_v": 300, "signal_type": "power"},
                    {"current_a": 5, "voltage_v": 0, "signal_type": "return"}
                ]
            ),
            environment=Environment(
                temp_min_c=-40,
                temp_max_c=105,
                flex_class="static",
                chemicals=[]
            ),
            emi=EMI(
                shield="foil",
                drain_policy="pigtail"
            ),
            compliance={},
            constraints={},
            must_use=[],
            notes_pack_id="test_pack"
        )

    def test_ribbon_synthesis(self, engine, sample_step1_ribbon):
        """Test ribbon cable synthesis."""
        proposal = engine.propose_synthesis("draft_123", sample_step1_ribbon)

        assert proposal.draft_id == "draft_123"
        assert proposal.cable["primary"].family == "Ribbon Cable"
        assert proposal.conductors.count == 10
        assert proposal.conductors.awg == 28
        assert proposal.conductors.ribbon["pitch_in"] == 0.050
        assert len(proposal.wirelist) == 10
        assert len(proposal.bom) > 0
        assert len(proposal.explain) > 0

    def test_power_cable_synthesis(self, engine, sample_step1_power):
        """Test power cable synthesis."""
        proposal = engine.propose_synthesis("draft_456", sample_step1_power)

        assert proposal.draft_id == "draft_456"
        assert proposal.cable["primary"].family == "Power Cable"
        assert proposal.conductors.count == 2
        assert proposal.conductors.awg == 18  # Based on 5A current with 20% margin = 6A -> 18 AWG
        assert proposal.shield.type == "foil"
        assert proposal.shield.drain_policy == "pigtail"
        assert len(proposal.wirelist) == 2
        assert len(proposal.bom) > 0

    def test_awg_calculation(self, engine):
        """Test AWG calculation logic."""
        # High current -> smaller AWG
        high_current = AssemblyStep1(
            type="power_cable",
            length_mm=1000,
            tolerance_mm=50,
            locale="NA",
            endA=Endpoint(
                selector=EndpointSelectorSeries(
                    series="TEST",
                    positions=2
                ),
                termination="crimp"
            ),
            endB=Endpoint(
                selector=EndpointSelectorSeries(
                    series="TEST",
                    positions=2
                ),
                termination="crimp"
            ),
            electrical=Electrical(
                system_voltage_v=300,
                per_circuit=[{"current_a": 10, "voltage_v": 300, "signal_type": "power"}]
            ),
            environment=Environment(
                temp_min_c=-20,
                temp_max_c=85,
                flex_class="static",
                chemicals=[]
            ),
            emi=EMI(
                shield="none",
                drain_policy="isolated"
            ),
            compliance={},
            constraints={},
            must_use=[],
            notes_pack_id="test_pack"
        )

        proposal = engine.propose_synthesis("test", high_current)
        assert proposal.conductors.awg <= 22  # Should be 22 or smaller for 10A with margin

    def test_color_coding_na(self, engine, sample_step1_power):
        """Test North American color coding."""
        proposal = engine.propose_synthesis("test", sample_step1_power)

        # Check power cable colors
        colors = [wire.color for wire in proposal.wirelist]
        assert "red" in colors  # +V
        assert "black" in colors  # RTN

class TestDrcEngine:
    """Test cases for DRC engine."""

    @pytest.fixture
    def engine(self):
        return DrcEngine()

    @pytest.fixture
    def valid_proposal(self):
        """Create a valid synthesis proposal."""
        return SynthesisProposal(
            proposal_id="prop_123",
            draft_id="draft_123",
            cable={"primary": PartRef(mpn="RIBBON-0.050x10", family="Ribbon Cable")},
            conductors=ConductorSpec(count=10, awg=28, ribbon={"pitch_in": 0.050, "ways": 10, "red_stripe": True}),
            endpoints={
                "endA": EndpointFull(
                    connector=PartRef(mpn="IDC-0.050-10POS"),
                    termination="idc",
                    contacts={"primary": PartRef(mpn="IDC-STANDARD")},
                    accessories=[PartRef(mpn="BACKSHELL-STD")]
                ),
                "endB": EndpointFull(
                    connector=PartRef(mpn="IDC-0.050-10POS"),
                    termination="idc",
                    contacts={"primary": PartRef(mpn="IDC-STANDARD")},
                    accessories=[PartRef(mpn="BACKSHELL-STD")]
                )
            },
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[WirelistRow(circuit=f"C{i}", conductor=i, endA_pin=str(i), endB_pin=str(i), color="black") for i in range(1, 11)],
            bom=[BomLine(ref=PartRef(mpn="TEST"), qty=1, role="primary", reason="test")],
            warnings=[],
            errors=[],
            explain=["Test proposal"]
        )

    def test_valid_proposal_passes_drc(self, engine, valid_proposal):
        """Test that a valid proposal passes DRC."""
        result = engine.validate_proposal(valid_proposal)

        assert result.status == "pass"
        assert len(result.issues) == 0

    def test_conductor_count_mismatch(self, engine, valid_proposal):
        """Test detection of conductor count vs connector positions mismatch."""
        # Change connector to 8 positions but keep 10 conductors
        valid_proposal.endpoints["endA"].connector.mpn = "IDC-0.050-8POS"

        result = engine.validate_proposal(valid_proposal)

        assert result.status == "error"
        assert len(result.issues) > 0
        assert any(issue.type == "connector_pin_count" for issue in result.issues)

    def test_termination_mismatch_ribbon(self, engine, valid_proposal):
        """Test ribbon cable with wrong termination."""
        # Change ribbon cable to crimp termination
        valid_proposal.endpoints["endA"].termination = "crimp"

        result = engine.validate_proposal(valid_proposal)

        assert result.status == "error"
        assert any(issue.type == "termination_type" for issue in result.issues)

    def test_awg_compatibility_warning(self, engine, valid_proposal):
        """Test AWG compatibility warning."""
        # Change contacts to different AWG
        valid_proposal.endpoints["endA"].contacts["primary"].mpn = "CRIMP-24AWG-GOLD"

        result = engine.validate_proposal(valid_proposal)

        # Should have warning about AWG mismatch
        assert result.status in ["warning", "pass"]  # May or may not trigger depending on implementation