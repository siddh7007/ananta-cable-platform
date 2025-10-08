from typing import List, Optional, Dict, Any
import json
import os
from pathlib import Path
from models import (
    SynthesisProposal, DrcResult, DrcIssue, DrcIssueType, DrcSeverity,
    ConductorSpec, EndpointFull, TerminationType
)
from mdm_dao import MDMDAO

class DrcEngine:
    """Design Rule Check engine for synthesis validation."""

    def __init__(self, ruleset_id: str = "rs-001"):
        """Initialize DRC engine with rule tables."""
        self.ruleset_id = ruleset_id
        self.rule_tables = self._load_rule_tables()
        self.mdm_dao = MDMDAO()

    def _load_rule_tables(self) -> Dict[str, Any]:
        """Load JSON rule tables for the specified ruleset."""
        rules_dir = Path(__file__).parent.parent / "rules" / "rulesets" / self.ruleset_id
        rule_tables = {}

        # Load all JSON files in the ruleset directory
        if rules_dir.exists():
            for json_file in rules_dir.glob("*.json"):
                try:
                    with open(json_file, 'r') as f:
                        rule_tables[json_file.stem] = json.load(f)
                except Exception as e:
                    print(f"Warning: Failed to load rule table {json_file.name}: {e}")

        return rule_tables

    def validate_proposal(self, proposal: SynthesisProposal) -> DrcResult:
        """Validate a synthesis proposal for design rule compliance."""

        issues: List[DrcIssue] = []

        # Check conductor count vs connector positions
        issues.extend(self._check_conductor_count(proposal))

        # Check AWG vs contact compatibility and ampacity
        issues.extend(self._check_awg_compatibility(proposal))

        # Check bend radius requirements
        issues.extend(self._check_bend_radius(proposal))

        # Check termination compatibility
        issues.extend(self._check_termination_compatibility(proposal))

        # Check electrical ratings
        issues.extend(self._check_electrical_ratings(proposal))

        # Check EMI/shielding requirements
        issues.extend(self._check_shielding_requirements(proposal))

        # Check locale AC color requirements
        issues.extend(self._check_locale_ac_colors(proposal))

        # Check MDM-based requirements (accessories, lugs, contacts)
        issues.extend(self._check_mdm_requirements(proposal))

        # Check environmental compatibility
        issues.extend(self._check_environmental_compatibility(proposal))

        # Determine overall result
        has_errors = any(issue.severity == "error" for issue in issues)
        has_warnings = any(issue.severity == "warning" for issue in issues)

        status = "error" if has_errors else "warning" if has_warnings else "pass"

        return DrcResult(
            status=status,
            issues=issues,
            summary=self._generate_summary(issues)
        )

    def _check_conductor_count(self, proposal: SynthesisProposal) -> List[DrcIssue]:
        """Check that conductor count matches connector positions."""
        issues = []

        conductor_count = proposal.conductors.count or 0

        for endpoint_name, endpoint in proposal.endpoints.items():
            if hasattr(endpoint.connector, 'mpn'):
                # Extract positions from MPN (simplified parsing)
                mpn = endpoint.connector.mpn
                if "POS" in mpn:
                    try:
                        positions = int(mpn.split("-")[-1].replace("POS", ""))
                        if conductor_count != positions:
                            issues.append(DrcIssue(
                                type="connector_pin_count",
                                severity="error",
                                message=f"{endpoint_name} connector has {positions} positions but {conductor_count} conductors specified",
                                location=f"endpoints.{endpoint_name}.connector",
                                suggestion=f"Change to {conductor_count}-position connector or adjust conductor count"
                            ))
                    except ValueError:
                        # Could not parse positions, skip this check
                        pass

        return issues

    def _check_awg_compatibility(self, proposal: SynthesisProposal) -> List[DrcIssue]:
        """Check AWG vs contact compatibility using ampacity table."""
        issues = []

        awg = proposal.conductors.awg
        if not awg:
            return issues

        # Get ampacity data from rule table
        ampacity_table = self.rule_tables.get("ampacity", {}).get("data", {})
        if not ampacity_table:
            return issues

        # Check if AWG exists in ampacity table
        awg_str = str(awg)
        if awg_str not in ampacity_table:
            issues.append(DrcIssue(
                type="awg_not_supported",
                severity="error",
                message=f"AWG {awg} not found in ampacity table",
                location="conductors.awg",
                suggestion="Use supported AWG sizes from ampacity table"
            ))
            return issues

        ampacity = ampacity_table[awg_str]
        current_rating = proposal.conductors.current_rating or 0

        # Check if current rating exceeds ampacity
        if current_rating > ampacity:
            issues.append(DrcIssue(
                type="current_exceeds_ampacity",
                severity="error",
                message=f"Current rating {current_rating}A exceeds AWG {awg} ampacity of {ampacity}A",
                location="conductors.current_rating",
                suggestion=f"Reduce current to ≤{ampacity}A or use larger AWG wire"
            ))

        for endpoint_name, endpoint in proposal.endpoints.items():
            if not endpoint.contacts:
                continue

            contact_mpn = endpoint.contacts["primary"].mpn

            # Check if AWG is compatible with contact
            if "CRIMP" in contact_mpn:
                # Extract AWG from contact MPN
                try:
                    contact_awg = int(contact_mpn.split("-")[1].replace("AWG", ""))
                    if abs(awg - contact_awg) > 2:  # Allow 2 AWG difference
                        issues.append(DrcIssue(
                            type="contact_wire_compatibility",
                            severity="warning",
                            message=f"Contact rated for {contact_awg} AWG, wire is {awg} AWG",
                            location=f"endpoints.{endpoint_name}.contacts",
                            suggestion=f"Use {awg} AWG rated contacts"
                        ))
                except (ValueError, IndexError):
                    pass

        return issues

    def _check_bend_radius(self, proposal: SynthesisProposal) -> List[DrcIssue]:
        """Check bend radius requirements using bend radius table."""
        issues = []

        # Get bend radius data from rule table
        bend_radius_table = self.rule_tables.get("bend_radius", {}).get("data", {})
        if not bend_radius_table:
            return issues

        cable_family = proposal.conductors.family or "standard"
        bend_radius_data = bend_radius_table.get(cable_family, bend_radius_table.get("standard", {"multiplier": 10}))
        bend_radius_multiplier = bend_radius_data.get("multiplier", 10) if isinstance(bend_radius_data, dict) else bend_radius_data

        # Calculate minimum bend radius
        if proposal.conductors.od_mm:
            min_bend_radius = proposal.conductors.od_mm * bend_radius_multiplier
            if proposal.bend_radius_mm and proposal.bend_radius_mm < min_bend_radius:
                issues.append(DrcIssue(
                    type="bend_radius_too_small",
                    severity="error",
                    message=f"Bend radius {proposal.bend_radius_mm}mm too small for {cable_family} cable (min: {min_bend_radius:.1f}mm)",
                    location="bend_radius_mm",
                    suggestion=f"Increase bend radius to ≥{min_bend_radius:.1f}mm"
                ))

        return issues

    def _check_termination_compatibility(self, proposal: SynthesisProposal) -> List[DrcIssue]:
        """Check termination type compatibility."""
        issues = []

        for endpoint_name, endpoint in proposal.endpoints.items():
            termination = endpoint.termination
            connector_mpn = endpoint.connector.mpn

            # Check ribbon cable with IDC
            if proposal.conductors.ribbon and termination != "idc":
                issues.append(DrcIssue(
                    type="termination_type",
                    severity="error",
                    message=f"Ribbon cable requires IDC termination, got {termination}",
                    location=f"endpoints.{endpoint_name}.termination",
                    suggestion="Change termination to IDC for ribbon cable"
                ))

            # Check power cable with crimp/ring lug
            elif not proposal.conductors.ribbon and termination == "idc":
                issues.append(DrcIssue(
                    type="termination_type",
                    severity="error",
                    message=f"Power cable cannot use IDC termination, got {termination}",
                    location=f"endpoints.{endpoint_name}.termination",
                    suggestion="Change termination to crimp or ring_lug for power cable"
                ))

        return issues

    def _check_electrical_ratings(self, proposal: SynthesisProposal) -> List[DrcIssue]:
        """Check electrical ratings compatibility using voltage/temp table."""
        issues = []

        # Get voltage/temp data from rule table
        voltage_temp_table = self.rule_tables.get("voltage_temp", {}).get("data", {})
        if not voltage_temp_table:
            # Fallback to simple check
            if proposal.conductors.awg and proposal.conductors.awg > 30:
                issues.append(DrcIssue(
                    type=DrcIssueType.ELECTRICAL_RATING,
                    severity=DrcSeverity.WARNING,
                    message=f"AWG {proposal.conductors.awg} may be too small for typical currents",
                    location="conductors.awg",
                    suggestion="Consider larger AWG for better current carrying capacity"
                ))
            return issues

        awg = proposal.conductors.awg
        if awg:
            awg_str = str(awg)
            if awg_str in voltage_temp_table:
                awg_data = voltage_temp_table[awg_str]

                # Check voltage rating
                voltage_rating = proposal.conductors.voltage_rating or 0
                min_voltage = awg_data.get("voltage_v", 300)
                if voltage_rating > min_voltage:
                    issues.append(DrcIssue(
                        type="voltage_rating_exceeded",
                        severity="error",
                        message=f"Voltage rating {voltage_rating}V exceeds AWG {awg} limit of {min_voltage}V",
                        location="conductors.voltage_rating",
                        suggestion=f"Reduce voltage to ≤{min_voltage}V or use higher voltage rated wire"
                    ))

                # Check temperature rating
                temp_rating = proposal.conductors.temp_rating_c or 80
                max_temp = awg_data.get("temp_c", 80)
                if temp_rating > max_temp:
                    issues.append(DrcIssue(
                        type="temperature_rating_exceeded",
                        severity="warning",
                        message=f"Temperature rating {temp_rating}°C exceeds AWG {awg} limit of {max_temp}°C",
                        location="conductors.temp_rating_c",
                        suggestion=f"Reduce temperature to ≤{max_temp}°C or use higher temperature rated wire"
                    ))

        return issues

    def _check_shielding_requirements(self, proposal: SynthesisProposal) -> List[DrcIssue]:
        """Check EMI/shielding requirements."""
        issues = []

        # Simplified: if EMI shield is required but no shield specified
        if proposal.shield.type != "none" and not proposal.shield.drain_policy:
            issues.append(DrcIssue(
                type=DrcIssueType.SHIELDING_REQUIREMENT,
                severity=DrcSeverity.WARNING,
                message=f"Shield type '{proposal.shield.type}' requires drain policy specification",
                location="shield.drain_policy",
                suggestion="Specify appropriate drain policy (chassis, pigtail, etc.)"
            ))

        return issues

    def _check_locale_ac_colors(self, proposal: SynthesisProposal) -> List[DrcIssue]:
        """Check locale AC conductor color requirements."""
        issues = []

        # Get locale AC colors data from rule table
        locale_colors_table = self.rule_tables.get("locale_ac_colors", {}).get("data", {})
        if not locale_colors_table:
            return issues

        locale = proposal.locale or "us"
        if locale not in locale_colors_table:
            issues.append(DrcIssue(
                type="unsupported_locale",
                severity="warning",
                message=f"Locale '{locale}' not found in color standards table",
                location="locale",
                suggestion="Use supported locale or contact engineering for custom requirements"
            ))
            return issues

        locale_colors = locale_colors_table[locale]

        # Check AC conductor colors if specified
        if proposal.conductors.ac_colors:
            for i, color in enumerate(proposal.conductors.ac_colors):
                expected_color = locale_colors.get(str(i + 1))  # Colors are 1-indexed in table
                if expected_color and color.lower() != expected_color.lower():
                    issues.append(DrcIssue(
                        type="ac_color_mismatch",
                        severity="warning",
                        message=f"AC conductor {i+1} color '{color}' doesn't match locale '{locale}' standard '{expected_color}'",
                        location=f"conductors.ac_colors[{i}]",
                        suggestion=f"Change to '{expected_color}' for locale compliance"
                    ))

        return issues

    def _check_mdm_requirements(self, proposal: SynthesisProposal) -> List[DrcIssue]:
        """Check MDM-based requirements for accessories, lugs, and contacts."""
        issues = []

        try:
            # Check accessory clamp ranges for each endpoint
            for endpoint_name, endpoint in proposal.endpoints.items():
                if endpoint.connector and proposal.conductors.od_mm:
                    cable_od_in = proposal.conductors.od_mm / 25.4  # Convert mm to inches
                    accessories = self.mdm_dao.find_accessories_by(
                        endpoint.connector.family,
                        cable_od_in
                    )

                    if not accessories:
                        issues.append(DrcIssue(
                            type="no_compatible_accessories",
                            severity="warning",
                            message=f"No accessories found for {endpoint.connector.family} connector with cable OD {cable_od_in:.3f}\"",
                            location=f"endpoints.{endpoint_name}.connector",
                            suggestion="Verify connector family or cable OD specifications"
                        ))

            # Check lug compatibility for ring lug terminations
            for endpoint_name, endpoint in proposal.endpoints.items():
                if endpoint.termination == "ring_lug" and proposal.conductors.awg:
                    stud_size = getattr(endpoint, 'stud_size', 'M3')  # Default to M3 if not specified
                    lugs = self.mdm_dao.find_lugs_by(stud_size, proposal.conductors.awg)

                    if not lugs:
                        issues.append(DrcIssue(
                            type="no_compatible_lugs",
                            severity="error",
                            message=f"No {stud_size} lugs found for AWG {proposal.conductors.awg}",
                            location=f"endpoints.{endpoint_name}.termination",
                            suggestion=f"Change stud size or use different AWG wire"
                        ))

            # Check contact plating compatibility
            for endpoint_name, endpoint in proposal.endpoints.items():
                if endpoint.contacts and proposal.conductors.awg:
                    contact_mpn = endpoint.contacts["primary"].mpn
                    # Extract connector family from contact MPN (simplified)
                    connector_family = contact_mpn.split("-")[0] if "-" in contact_mpn else contact_mpn

                    contacts = self.mdm_dao.find_contacts_by(
                        connector_family,
                        proposal.conductors.awg,
                        "tin"  # Prefer tin plating
                    )

                    if not contacts:
                        issues.append(DrcIssue(
                            type="no_compatible_contacts",
                            severity="error",
                            message=f"No contacts found for {connector_family} family with AWG {proposal.conductors.awg}",
                            location=f"endpoints.{endpoint_name}.contacts",
                            suggestion="Verify connector family or change AWG"
                        ))

        except Exception as e:
            # If MDM is unavailable, log but don't fail DRC
            issues.append(DrcIssue(
                type="mdm_unavailable",
                severity="info",
                message=f"MDM lookup failed: {str(e)}",
                location="system",
                suggestion="Check MDM database connectivity"
            ))

        return issues

    def _check_environmental_compatibility(self, proposal: SynthesisProposal) -> List[DrcIssue]:
        """Check environmental compatibility."""
        issues = []

        # This would check temperature, chemicals, etc.
        # For now, placeholder for future implementation
        return issues

    def _generate_summary(self, issues: List[DrcIssue]) -> str:
        """Generate human-readable summary of DRC results."""
        if not issues:
            return "All design rules passed"

        error_count = sum(1 for issue in issues if issue.severity == "error")
        warning_count = sum(1 for issue in issues if issue.severity == "warning")

        if error_count > 0:
            return f"DRC failed: {error_count} errors, {warning_count} warnings"
        elif warning_count > 0:
            return f"DRC passed with warnings: {warning_count} warnings"
        else:
            return "DRC passed"