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