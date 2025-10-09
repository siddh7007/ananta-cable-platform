import pytest
from drc import DrcEngine
from models import RulesManifest

class TestDRCApi:
    """Test DRC service API endpoints."""

    @pytest.fixture
    def drc_engine(self):
        """Create DRC engine instance."""
        return DrcEngine()

    def test_rules_manifest_method(self, drc_engine):
        """Test rules manifest method returns correct structure."""
        manifest = drc_engine.get_rules_manifest()

        # Validate response structure
        assert isinstance(manifest, RulesManifest)
        assert manifest.version is not None
        assert manifest.ruleset_id is not None
        assert manifest.ruleset_name is not None
        assert manifest.engine_version is not None
        assert manifest.pack_version is not None
        assert isinstance(manifest.rules, list)
        assert isinstance(manifest.metadata, dict)

        # Validate metadata structure
        metadata = manifest.metadata
        assert "standard" in metadata
        assert "version" in metadata
        assert "description" in metadata
        assert "ruleset_id" in metadata
        assert "last_updated" in metadata
        assert "compliance_class" in metadata

        # Validate IPC620 metadata content
        assert metadata["standard"] == "IPC-620"
        assert metadata["compliance_class"] == "Class 2"

    def test_rules_manifest_with_fallback_data(self, drc_engine):
        """Test rules manifest works even when manifest file is missing."""
        # This should work with fallback data if manifest file doesn't exist
        manifest = drc_engine.get_rules_manifest()

        assert manifest.ruleset_name == "ipc620-baseline"
        assert manifest.engine_version == "0.1.0"
        assert manifest.pack_version == "1.0.0"
        assert isinstance(manifest.rules, list)

    def test_rules_manifest_metadata_content(self, drc_engine):
        """Test that rules manifest metadata contains expected IPC620 information."""
        manifest = drc_engine.get_rules_manifest()

        metadata = manifest.metadata
        assert metadata["standard"] == "IPC-620"
        assert metadata["version"] == "1.0"
        assert "Requirements and Acceptance" in metadata["description"]
        assert metadata["ruleset_id"] == drc_engine.ruleset_id
        assert metadata["compliance_class"] == "Class 2"

    def test_length_limits_rule_deterministic_results(self, drc_engine):
        """Test length limits rule produces deterministic results."""
        from models import SynthesisProposal, ConductorSpec, ShieldSpec

        # Test case 1: Length within limits (should pass)
        proposal_pass = SynthesisProposal(
            proposal_id="test-001",
            draft_id="test-001",
            cable={},
            conductors=ConductorSpec(
                family="sensor_lead",
                length_mm=500,
                awg=16,
                temp_rating_c=80,
                voltage_rating=300
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[]
        )
        issues = drc_engine._check_length_limits(proposal_pass)
        assert len(issues) == 0

        # Test case 2: Length exceeds max limit (should fail with error)
        proposal_fail = SynthesisProposal(
            proposal_id="test-002",
            draft_id="test-002",
            cable={},
            conductors=ConductorSpec(
                family="sensor_lead",
                length_mm=1500,  # Exceeds 1000mm limit
                awg=16,
                temp_rating_c=80,
                voltage_rating=300
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[]
        )
        issues = drc_engine._check_length_limits(proposal_fail)
        assert len(issues) == 1
        assert issues[0].type == "bend_radius_too_small"  # Using existing type for length issue
        assert issues[0].severity == "error"

        # Test case 3: Length approaches limit (should warn)
        proposal_warn = SynthesisProposal(
            proposal_id="test-003",
            draft_id="test-003",
            cable={},
            conductors=ConductorSpec(
                family="sensor_lead",
                length_mm=900,  # Above 500mm warning threshold
                awg=16,
                temp_rating_c=80,
                voltage_rating=300
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[]
        )
        issues = drc_engine._check_length_limits(proposal_warn)
        assert len(issues) == 1
        assert issues[0].type == "bend_radius_too_small"  # Using existing type for length issue
        assert issues[0].severity == "warning"

    def test_temperature_ranges_rule_deterministic_results(self, drc_engine):
        """Test temperature ranges rule produces deterministic results."""
        from models import SynthesisProposal, ConductorSpec, ShieldSpec

        # Test case 1: Temperature within range (should pass)
        proposal_pass = SynthesisProposal(
            proposal_id="test-004",
            draft_id="test-004",
            cable={},
            conductors=ConductorSpec(
                family="standard",
                length_mm=500,
                awg=16,
                temp_rating_c=80,
                voltage_rating=300
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[],
            environment="indoor"
        )
        issues = drc_engine._check_temperature_ranges(proposal_pass)
        assert len(issues) == 0

        # Test case 2: Temperature too low (should fail)
        proposal_fail_low = SynthesisProposal(
            proposal_id="test-005",
            draft_id="test-005",
            cable={},
            conductors=ConductorSpec(
                family="standard",
                length_mm=500,
                awg=16,
                temp_rating_c=-60,  # Below -40C limit
                voltage_rating=300
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[],
            environment="indoor"
        )
        issues = drc_engine._check_temperature_ranges(proposal_fail_low)
        assert len(issues) == 1
        assert issues[0].type == "temperature_rating_exceeded"
        assert issues[0].severity == "error"

        # Test case 3: Temperature too high (should fail)
        proposal_fail_high = SynthesisProposal(
            proposal_id="test-006",
            draft_id="test-006",
            cable={},
            conductors=ConductorSpec(
                family="standard",
                length_mm=500,
                awg=16,
                temp_rating_c=150,  # Above 125C limit
                voltage_rating=300
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[],
            environment="indoor"
        )
        issues = drc_engine._check_temperature_ranges(proposal_fail_high)
        assert len(issues) == 1
        assert issues[0].type == "temperature_rating_exceeded"
        assert issues[0].severity == "error"

    def test_voltage_ratings_rule_deterministic_results(self, drc_engine):
        """Test voltage ratings rule produces deterministic results."""
        from models import SynthesisProposal, ConductorSpec, ShieldSpec

        # Test case 1: Voltage within limits (should pass)
        proposal_pass = SynthesisProposal(
            proposal_id="test-007",
            draft_id="test-007",
            cable={},
            conductors=ConductorSpec(
                family="standard",
                length_mm=500,
                awg=16,
                temp_rating_c=80,
                voltage_rating=300  # Within 600V - 50V = 550V limit
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[]
        )
        issues = drc_engine._check_voltage_ratings(proposal_pass)
        assert len(issues) == 0

        # Test case 2: Voltage exceeds AWG limit (should fail)
        proposal_fail = SynthesisProposal(
            proposal_id="test-008",
            draft_id="test-008",
            cable={},
            conductors=ConductorSpec(
                family="standard",
                length_mm=500,
                awg=16,
                temp_rating_c=80,
                voltage_rating=650  # Exceeds 600V limit
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[]
        )
        issues = drc_engine._check_voltage_ratings(proposal_fail)
        assert len(issues) == 1
        assert issues[0].type == "voltage_rating_exceeded"
        assert issues[0].severity == "error"

        # Test case 3: Voltage approaches limit (should warn)
        proposal_warn = SynthesisProposal(
            proposal_id="test-009",
            draft_id="test-009",
            cable={},
            conductors=ConductorSpec(
                family="standard",
                length_mm=500,
                awg=16,
                temp_rating_c=80,
                voltage_rating=575  # Above 550V safety margin
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[]
        )
        issues = drc_engine._check_voltage_ratings(proposal_warn)
        assert len(issues) == 1
        assert issues[0].type == "voltage_rating_exceeded"
        assert issues[0].severity == "warning"

    def test_severity_summary_math(self, drc_engine):
        """Test that severity summary correctly counts errors, warnings, and info."""
        from models import DrcIssue

        # Test case 1: Empty findings (no issues)
        empty_issues = []
        summary = drc_engine._generate_summary(empty_issues)
        assert summary == "All design rules passed"

        # Test case 2: Only errors
        error_issues = [
            DrcIssue(type="voltage_rating_exceeded", severity="error", message="Error 1", location="test", suggestion="Fix"),
            DrcIssue(type="temperature_rating_exceeded", severity="error", message="Error 2", location="test", suggestion="Fix")
        ]
        summary = drc_engine._generate_summary(error_issues)
        assert "2 errors, 0 warnings" in summary
        assert "DRC failed" in summary

        # Test case 3: Only warnings
        warning_issues = [
            DrcIssue(type="bend_radius_too_small", severity="warning", message="Warning 1", location="test", suggestion="Fix"),
            DrcIssue(type="current_exceeds_ampacity", severity="warning", message="Warning 2", location="test", suggestion="Fix"),
            DrcIssue(type="awg_not_supported", severity="warning", message="Warning 3", location="test", suggestion="Fix")
        ]
        summary = drc_engine._generate_summary(warning_issues)
        assert "DRC passed with warnings: 3 warnings" in summary

        # Test case 4: Mixed errors and warnings
        mixed_issues = [
            DrcIssue(type="voltage_rating_exceeded", severity="error", message="Error 1", location="test", suggestion="Fix"),
            DrcIssue(type="bend_radius_too_small", severity="warning", message="Warning 1", location="test", suggestion="Fix"),
            DrcIssue(type="current_exceeds_ampacity", severity="warning", message="Warning 2", location="test", suggestion="Fix"),
            DrcIssue(type="temperature_rating_exceeded", severity="error", message="Error 2", location="test", suggestion="Fix")
        ]
        summary = drc_engine._generate_summary(mixed_issues)
        assert "2 errors, 2 warnings" in summary
        assert "DRC failed" in summary

    def test_empty_findings_case(self, drc_engine):
        """Test that empty findings result in passing DRC result."""
        from models import SynthesisProposal, ConductorSpec, ShieldSpec

        # Create a proposal that should pass all rules
        proposal = SynthesisProposal(
            proposal_id="test-010",
            draft_id="test-010",
            cable={},
            conductors=ConductorSpec(
                family="standard",
                length_mm=100,  # Well below limits
                awg=16,
                temp_rating_c=80,  # Within range
                voltage_rating=300  # Within limits
            ),
            endpoints={},
            shield=ShieldSpec(type="none", drain_policy="isolated"),
            wirelist=[],
            bom=[],
            warnings=[],
            errors=[],
            explain=[],
            environment="indoor"
        )

        # Run validation
        result = drc_engine.validate_proposal(proposal)

        # Should pass with no issues
        assert result.status == "pass"
        assert len(result.issues) == 0
        assert result.summary == "All design rules passed"

    def test_openapi_schema_generation(self):
        """Test that OpenAPI schema is properly generated for DRC endpoints."""
        from main import app
        from models import DrcRunResponse, RulesManifest

        # Get the OpenAPI schema
        schema = app.openapi()

        # Validate basic schema structure
        assert "openapi" in schema
        assert "info" in schema
        assert "paths" in schema
        assert "components" in schema

        # Validate info section
        assert schema["info"]["title"] == "DRC Service"
        assert schema["info"]["version"] == "0.1.0"

        # Validate paths exist
        paths = schema["paths"]
        assert "/v1/drc/run" in paths
        assert "/v1/drc/rules/manifest" in paths
        assert "/health" in paths  # Health endpoint should also be documented

        # Validate /v1/drc/run endpoint
        drc_run_path = paths["/v1/drc/run"]
        assert "post" in drc_run_path

        drc_run_post = drc_run_path["post"]
        assert "summary" in drc_run_post
        assert "responses" in drc_run_post

        # Check that response schema references are correct
        responses = drc_run_post["responses"]
        assert "200" in responses
        assert "content" in responses["200"]
        assert "application/json" in responses["200"]["content"]

        # Validate /v1/drc/rules/manifest endpoint
        rules_manifest_path = paths["/v1/drc/rules/manifest"]
        assert "get" in rules_manifest_path

        rules_manifest_get = rules_manifest_path["get"]
        assert "summary" in rules_manifest_get
        assert "responses" in rules_manifest_get

        # Check that response schema references are correct
        responses = rules_manifest_get["responses"]
        assert "200" in responses
        assert "content" in responses["200"]
        assert "application/json" in responses["200"]["content"]

        # Validate components/schemas exist
        components = schema["components"]
        assert "schemas" in components

        schemas = components["schemas"]
        # Check that our response models are in the schema
        assert "DrcRunResponse" in schemas
        assert "RulesManifest" in schemas