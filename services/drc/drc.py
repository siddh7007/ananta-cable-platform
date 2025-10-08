from typing import List, Optional, Dict, Any
from models import (
    SynthesisProposal, DrcResult, DrcIssue, DrcIssueType, DrcSeverity,
    ConductorSpec, EndpointFull, TerminationType
)

class DrcEngine:
    """Design Rule Check engine for synthesis validation."""

    def validate_proposal(self, proposal: SynthesisProposal) -> DrcResult:
        """Validate a synthesis proposal for design rule compliance."""

        issues: List[DrcIssue] = []

        # Check conductor count vs connector positions
        issues.extend(self._check_conductor_count(proposal))

        # Check AWG vs contact compatibility
        issues.extend(self._check_awg_compatibility(proposal))

        # Check termination compatibility
        issues.extend(self._check_termination_compatibility(proposal))

        # Check electrical ratings
        issues.extend(self._check_electrical_ratings(proposal))

        # Check EMI/shielding requirements
        issues.extend(self._check_shielding_requirements(proposal))

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
        """Check AWG vs contact compatibility."""
        issues = []

        awg = proposal.conductors.awg
        if not awg:
            return issues

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
        """Check electrical ratings compatibility."""
        issues = []

        # This would check voltage/current ratings against requirements
        # For now, simplified check
        if proposal.conductors.awg and proposal.conductors.awg > 30:
            issues.append(DrcIssue(
                type=DrcIssueType.ELECTRICAL_RATING,
                severity=DrcSeverity.WARNING,
                message=f"AWG {proposal.conductors.awg} may be too small for typical currents",
                location="conductors.awg",
                suggestion="Consider larger AWG for better current carrying capacity"
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