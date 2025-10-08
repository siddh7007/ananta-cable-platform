import pytest
from mdm_dao import MDMDAO

class TestMDMDAO:
    """Test MDM DAO queries."""

    @pytest.fixture
    def dao(self):
        return MDMDAO()

    def test_find_ribbon_by_10_way_050_pitch(self, dao):
        """Test finding 10-way 0.050" pitch ribbon cables."""
        results = dao.find_ribbon_by(ways=10, pitch_in=0.05, temp_min=80, shield="none")
        assert len(results) > 0
        cable = results[0]
        assert cable['conductor_count'] == 10
        assert float(cable['pitch_in']) == 0.05
        assert cable['type'] == 'ribbon'

    def test_find_ribbon_by_40_way_025_pitch(self, dao):
        """Test finding 40-way 0.025" pitch ribbon cables."""
        results = dao.find_ribbon_by(ways=40, pitch_in=0.025, temp_min=80, shield="none")
        assert len(results) > 0
        cable = results[0]
        assert cable['conductor_count'] == 40
        assert float(cable['pitch_in']) == 0.025

    def test_find_round_cable_by_2_conductor_14_awg(self, dao):
        """Test finding 2-conductor 14 AWG round shielded cables."""
        results = dao.find_round_cable_by(
            cond_count=2, awg_range=[14], voltage_min=300, temp_min=80, shield="foil", flex_class="flexible"
        )
        assert len(results) > 0
        cable = results[0]
        assert cable['conductor_count'] == 2
        assert cable['conductor_awg'] == 14
        assert cable['shield'] == 'foil'

    def test_find_contacts_by_molex_megafit_14_awg(self, dao):
        """Test finding contacts for Molex Mega-Fit, 14 AWG."""
        results = dao.find_contacts_by("Molex Mega-Fit", 14, "tin")
        assert len(results) > 0
        contact = results[0]
        assert contact['connector_family'] == 'Molex Mega-Fit'
        assert 14 in contact['awg_range']

    def test_find_lugs_by_10_stud_8_awg(self, dao):
        """Test finding #10 stud lugs for 8 AWG."""
        results = dao.find_lugs_by("#10", 8)
        assert len(results) > 0
        lug = results[0]
        assert lug['family'] == 'TE Ring Lugs'
        assert lug['stud_size'] == '#10'
        assert 8 in lug['compatible_contacts_awg']

    def test_find_accessories_by_3m_idc_cable_od(self, dao):
        """Test finding accessories for 3M IDC with specific cable OD."""
        results = dao.find_accessories_by("3M IDC", 0.25)
        assert len(results) > 0
        accessory = results[0]
        assert accessory['connector_family'] == '3M IDC'
        # Check that cable OD is within range
        od_range = accessory['cable_od_range_in']
        assert od_range[0] <= 0.25 <= od_range[1]

    def test_find_connector_by_family_termination(self, dao):
        """Test finding connectors by family and termination."""
        results = dao.find_connector_by_family_termination("3M IDC", "idc", 10)
        assert len(results) > 0
        connector = results[0]
        assert connector['family'] == '3M IDC'
        assert connector['termination'] == 'idc'
        assert connector['positions'] == 10