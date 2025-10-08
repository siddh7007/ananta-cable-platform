from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from models import DRCFinding, DRCFix, DRCReport, AssemblySchema

class DRCEngine:
    """DRC Engine implementing comprehensive design rule checks."""

    DEFAULT_RULESET = {
        "id": "rs-001",
        "version": "1.0.0",
        "created_at": "2025-01-01T00:00:00Z"
    }

    def get_rulesets(self) -> List[Dict[str, Any]]:
        """Return available rulesets."""
        return [self.DEFAULT_RULESET]

    def run_drc(self, assembly: AssemblySchema, ruleset_id: Optional[str] = None) -> DRCReport:
        """Run complete DRC analysis on an assembly."""
        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        # Run all rule checks
        mechanical_findings, mechanical_fixes = self._check_mechanical_rules(assembly)
        electrical_findings, electrical_fixes = self._check_electrical_rules(assembly)
        standards_findings, standards_fixes = self._check_standards_rules(assembly)
        labeling_findings, labeling_fixes = self._check_labeling_rules(assembly)
        consistency_findings, consistency_fixes = self._check_consistency_rules(assembly)

        # Combine all findings and fixes
        findings.extend(mechanical_findings + electrical_findings + standards_findings +
                       labeling_findings + consistency_findings)
        fixes.extend(mechanical_fixes + electrical_fixes + standards_fixes +
                    labeling_fixes + consistency_fixes)

        # Calculate summary
        errors = sum(1 for f in findings if f.severity == "error")
        warnings = sum(1 for f in findings if f.severity == "warning")
        passed = errors == 0

        return DRCReport(
            assembly_id=assembly.assembly_id,
            ruleset_id=ruleset_id or self.DEFAULT_RULESET["id"],
            version=self.DEFAULT_RULESET["version"],
            passed=passed,
            errors=errors,
            warnings=warnings,
            findings=findings,
            fixes=fixes,
            generated_at=datetime.utcnow().isoformat() + "Z"
        )

    def apply_fixes(self, assembly: AssemblySchema, fix_ids: List[str],
                   ruleset_id: Optional[str] = None) -> Tuple[str, DRCReport]:
        """Apply selected fixes and return updated assembly hash and new DRC report."""
        # For now, simulate applying fixes by updating the schema_hash
        # In a real implementation, this would modify the assembly schema
        updated_hash = f"{assembly.schema_hash}_fixed_{'_'.join(sorted(fix_ids))}"

        # Create a new assembly with "applied" fixes
        updated_assembly = AssemblySchema(
            assembly_id=assembly.assembly_id,
            schema_hash=updated_hash,
            cable=assembly.cable,
            conductors=assembly.conductors,
            endpoints=assembly.endpoints,
            shield=assembly.shield,
            wirelist=assembly.wirelist,
            bom=assembly.bom,
            labels=assembly.labels
        )

        # Run DRC again on the "fixed" assembly
        report = self.run_drc(updated_assembly, ruleset_id)
        return updated_hash, report

    def _check_mechanical_rules(self, assembly: AssemblySchema) -> Tuple[List[DRCFinding], List[DRCFix]]:
        """Check mechanical design rules."""
        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        cable = assembly.cable
        conductors = assembly.conductors
        endpoints = assembly.endpoints

        # Rule: Connector positions/ways must match conductor count
        conductor_count = conductors.get("count", 0)
        ribbon_ways = conductors.get("ribbon", {}).get("ways", 0)

        for end_name, endpoint in [("endA", endpoints.get("endA", {})), ("endB", endpoints.get("endB", {}))]:
            connector = endpoint.get("connector", {})
            positions = connector.get("positions", 0)

            if cable.get("type") == "ribbon" and ribbon_ways != positions:
                findings.append(DRCFinding(
                    id=f"MECH_RIBBON_WAYS_{end_name.upper()}",
                    severity="error",
                    domain="mechanical",
                    code="CONNECTOR_RIBBON_WAYS_MISMATCH",
                    message=f"Ribbon cable has {ribbon_ways} ways but {end_name} connector has {positions} positions",
                    where=f"endpoints.{end_name}.connector.positions"
                ))
            elif cable.get("type") != "ribbon" and conductor_count != positions:
                findings.append(DRCFinding(
                    id=f"MECH_CONDUCTOR_COUNT_{end_name.upper()}",
                    severity="error",
                    domain="mechanical",
                    code="CONNECTOR_CONDUCTOR_COUNT_MISMATCH",
                    message=f"Cable has {conductor_count} conductors but {end_name} connector has {positions} positions",
                    where=f"endpoints.{end_name}.connector.positions"
                ))

        # Rule: Bend radius check
        # This is a simplified check - in reality would need cable OD data
        length_mm = cable.get("length_mm", 0)
        if length_mm > 1000:  # Long cables need bend radius check
            findings.append(DRCFinding(
                id="MECH_BEND_RADIUS",
                severity="warning",
                domain="mechanical",
                code="BEND_RADIUS_CHECK",
                message="Long cable assembly should verify bend radius requirements",
                where="cable.length_mm"
            ))

        # Rule: Accessory clamp range
        for end_name, endpoint in [("endA", endpoints.get("endA", {})), ("endB", endpoints.get("endB", {}))]:
            accessories = endpoint.get("accessories", [])
            for i, accessory in enumerate(accessories):
                # Check if this is a clamp/strain relief accessory
                family = accessory.get("family", "").lower()
                mpn = accessory.get("mpn", "").lower()
                if "clamp" in family or "strain" in family or "clamp" in mpn:
                    findings.append(DRCFinding(
                        id=f"MECH_CLAMP_RANGE_{end_name.upper()}_{i}",
                        severity="warning",
                        domain="mechanical",
                        code="CLAMP_RANGE_WARNING",
                        message=f"Verify clamp {accessory.get('mpn')} range matches cable OD",
                        where=f"endpoints.{end_name}.accessories[{i}]"
                    ))
                    # Add fix suggestion for clamp size
                    fixes.append(DRCFix(
                        id=f"FIX_CLAMP_SIZE_{end_name.upper()}_{i}",
                        label="Adjust clamp to next size",
                        description="Change clamp to next larger size to accommodate cable OD",
                        applies_to=[f"endpoints.{end_name}.accessories[{i}].mpn"],
                        effect="substitution"
                    ))

        return findings, fixes

    def _check_electrical_rules(self, assembly: AssemblySchema) -> Tuple[List[DRCFinding], List[DRCFix]]:
        """Check electrical design rules."""
        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        conductors = assembly.conductors
        cable = assembly.cable
        shield = assembly.shield

        # Rule: Ampacity vs AWG
        awg = conductors.get("awg")
        if awg is not None:
            # Simplified ampacity check - would need lookup table
            max_current = self._get_awg_ampacity(awg)
            electrical = cable.get("electrical", {})
            per_circuit = electrical.get("per_circuit", [])

            for circuit in per_circuit:
                current_a = circuit.get("current_a", 0)
                if current_a > max_current * 0.8:  # 20% margin required
                    findings.append(DRCFinding(
                        id=f"ELEC_AMPACITY_{circuit.get('circuit', 'unknown')}",
                        severity="error",
                        domain="electrical",
                        code="AMPACITY_INSUFFICIENT",
                        message=f"Circuit {circuit.get('circuit')} requires {current_a}A but AWG {awg} only supports {max_current}A",
                        where="cable.electrical.per_circuit"
                    ))

        # Rule: Voltage and temperature ratings
        system_voltage = cable.get("electrical", {}).get("system_voltage_v")
        temp_rating = cable.get("environment", {}).get("temp_max_c", 25)

        if system_voltage and system_voltage > 300:  # High voltage check
            findings.append(DRCFinding(
                id="ELEC_VOLTAGE_RATING",
                severity="warning",
                domain="electrical",
                code="VOLTAGE_RATING_CHECK",
                message=f"High voltage system ({system_voltage}V) requires verification of insulation rating",
                where="cable.electrical.system_voltage_v"
            ))

        # Rule: Shield termination policy consistency
        shield_type = shield.get("type")
        drain_policy = shield.get("drain_policy")

        if shield_type != "none":
            endpoints = assembly.endpoints
            for end_name, endpoint in [("endA", endpoints.get("endA", {})), ("endB", endpoints.get("endB", {}))]:
                termination = endpoint.get("termination")
                if termination == "ring_lug" and drain_policy == "fold_back":
                    findings.append(DRCFinding(
                        id=f"ELEC_SHIELD_TERMINATION_{end_name.upper()}",
                        severity="error",
                        domain="electrical",
                        code="SHIELD_TERMINATION_INCONSISTENT",
                        message=f"Ring lug termination incompatible with fold_back drain policy",
                        where=f"endpoints.{end_name}.termination"
                    ))

        return findings, fixes

    def _check_standards_rules(self, assembly: AssemblySchema) -> Tuple[List[DRCFinding], List[DRCFix]]:
        """Check standards compliance rules."""
        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        compliance = assembly.cable.get("compliance", {})

        # Rule: IPC/WHMA class present
        if not compliance.get("ipc_class"):
            findings.append(DRCFinding(
                id="STD_IPC_CLASS_MISSING",
                severity="warning",
                domain="standards",
                code="IPC_CLASS_MISSING",
                message="IPC/WHMA-A-620 class should be specified",
                where="cable.compliance.ipc_class"
            ))

        # Rule: RoHS/REACH flags
        if not compliance.get("rohs_reach"):
            findings.append(DRCFinding(
                id="STD_ROHS_REACH_MISSING",
                severity="error",
                domain="standards",
                code="ROHS_REACH_REQUIRED",
                message="RoHS/REACH compliance must be confirmed",
                where="cable.compliance.rohs_reach"
            ))

        # Rule: UL94 labels
        labels = assembly.labels or {}
        if labels and not compliance.get("ul94_v0_labels"):
            findings.append(DRCFinding(
                id="STD_UL94_LABELS_MISSING",
                severity="warning",
                domain="standards",
                code="UL94_LABELS_INCONSISTENT",
                message="Labels present but UL94-V0 compliance not confirmed",
                where="cable.compliance.ul94_v0_labels"
            ))

        return findings, fixes

    def _check_labeling_rules(self, assembly: AssemblySchema) -> Tuple[List[DRCFinding], List[DRCFix]]:
        """Check labeling requirements."""
        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        labels = assembly.labels or {}

        # Rule: Title block fields
        required_fields = ["pn", "rev", "mfr", "date"]
        title_block = labels.get("title_block", {})

        for field in required_fields:
            if field not in title_block:
                findings.append(DRCFinding(
                    id=f"LABEL_TITLE_BLOCK_{field.upper()}_MISSING",
                    severity="warning",
                    domain="labeling",
                    code="TITLE_BLOCK_INCOMPLETE",
                    message=f"Title block missing {field.upper()} field",
                    where=f"labels.title_block.{field}"
                ))

        # Rule: Label text content
        label_text = labels.get("text", "")
        if label_text:
            required_content = ["PN", "REV", "MFR"]
            for content in required_content:
                if content not in label_text:
                    findings.append(DRCFinding(
                        id=f"LABEL_TEXT_{content}_MISSING",
                        severity="warning",
                        domain="labeling",
                        code="LABEL_TEXT_INCOMPLETE",
                        message=f"Label text missing {content}",
                        where="labels.text"
                    ))

        # Rule: Label offset
        offset_mm = labels.get("offset_mm")
        if offset_mm is None:
            findings.append(DRCFinding(
                id="LABEL_OFFSET_MISSING",
                severity="warning",
                domain="labeling",
                code="LABEL_OFFSET_MISSING",
                message="Label offset not specified, will use default 30mm",
                where="labels.offset_mm"
            ))
            # Add auto-fix for label offset
            fixes.append(DRCFix(
                id="FIX_LABEL_OFFSET_DEFAULT",
                label="Set default label offset",
                description="Set label offset to default 30mm from end",
                applies_to=["labels.offset_mm"],
                effect="non_destructive"
            ))
        elif not (25 <= offset_mm <= 50):
            findings.append(DRCFinding(
                id="LABEL_OFFSET_OUT_OF_RANGE",
                severity="warning",
                domain="labeling",
                code="LABEL_OFFSET_OUT_OF_RANGE",
                message=f"Label offset {offset_mm}mm outside recommended range 25-50mm",
                where="labels.offset_mm"
            ))

        return findings, fixes

    def _check_consistency_rules(self, assembly: AssemblySchema) -> Tuple[List[DRCFinding], List[DRCFix]]:
        """Check consistency rules."""
        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        conductors = assembly.conductors
        endpoints = assembly.endpoints
        cable = assembly.cable

        # Rule: Ribbon red-stripe at conductor 1
        if cable.get("type") == "ribbon":
            ribbon = conductors.get("ribbon", {})
            if not ribbon.get("red_stripe", False):
                findings.append(DRCFinding(
                    id="CONSIST_RIBBON_RED_STRIPE_MISSING",
                    severity="warning",
                    domain="consistency",
                    code="RIBBON_RED_STRIPE_MISSING",
                    message="Ribbon cable should have red stripe at conductor 1",
                    where="conductors.ribbon.red_stripe"
                ))

        # Rule: Pin-1 triangles at both ends
        for end_name, endpoint in [("endA", endpoints.get("endA", {})), ("endB", endpoints.get("endB", {}))]:
            # This would need actual connector data to check pin-1 markings
            pass

        # Rule: AC color semantics by locale
        locale = cable.get("locale")
        if locale == "EU":
            # Check for L/N/PE color coding
            wirelist = assembly.wirelist
            for wire in wirelist:
                color = wire.get("color", "").upper()
                circuit = wire.get("circuit", "").upper()
                if circuit in ["L", "N", "PE"] and not self._is_eu_color_correct(circuit, color):
                    findings.append(DRCFinding(
                        id=f"CONSIST_EU_COLOR_{circuit}",
                        severity="warning",
                        domain="consistency",
                        code="EU_COLOR_SEMANTICS_INCORRECT",
                        message=f"EU locale: {circuit} circuit should use correct color coding",
                        where=f"wirelist[{wire.get('conductor', 0)}].color"
                    ))

        # Rule: Ring-lug stud sizes must be specified
        for end_name, endpoint in [("endA", endpoints.get("endA", {})), ("endB", endpoints.get("endB", {}))]:
            if endpoint.get("termination") == "ring_lug":
                # Check for stud size in constraints or endpoint data
                constraints = cable.get("constraints", {})
                stud_size = constraints.get("stud_size")
                if not stud_size:
                    findings.append(DRCFinding(
                        id=f"CONSIST_STUD_SIZE_MISSING_{end_name.upper()}",
                        severity="error",
                        domain="consistency",
                        code="STUD_SIZE_MISSING",
                        message=f"Ring lug termination requires stud size specification",
                        where=f"cable.constraints.stud_size"
                    ))

        return findings, fixes

    def _get_awg_ampacity(self, awg: int) -> float:
        """Get ampacity for AWG at 30°C (simplified lookup)."""
        ampacity_table = {
            30: 0.86, 28: 1.4, 26: 2.2, 24: 3.5, 22: 5.5,
            20: 8.8, 18: 14, 16: 22, 14: 32, 12: 41, 10: 55
        }
        return ampacity_table.get(awg, 0)

    def _is_eu_color_correct(self, circuit: str, color: str) -> bool:
        """Check if EU color coding is correct for circuit."""
        eu_colors = {
            "L": ["BROWN", "BLACK"],
            "N": ["BLUE"],
            "PE": ["GREEN/YELLOW", "GREEN-YELLOW"]
        }
        return color in eu_colors.get(circuit, [])