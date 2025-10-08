from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from .models import AssemblySchema, DRCFinding, DRCFix, DRCReport


class DRCEngine:
    """Deterministic Step 3 DRC engine."""

    DEFAULT_RULESET = {
        "id": "rs-001",
        "version": "1.0.0",
        "created_at": "2025-01-01T00:00:00Z",
        "notes": "Baseline deterministic ruleset",
    }

    AMPACITY_TABLE = {
        30: 0.86,
        28: 1.4,
        26: 2.2,
        24: 3.5,
        22: 5.5,
        20: 8.8,
        18: 14.0,
        16: 22.0,
        14: 32.0,
        12: 41.0,
        10: 55.0,
    }

    RIBBON_BEND_TABLE_MM = {
        0.025: 5.0,
        0.05: 7.5,
        0.1: 12.5,
    }

    LABEL_OFFSET_DEFAULT = 30
    LABEL_OFFSET_RANGE = (25, 50)
    CLAMP_TOLERANCE_MM = 0.2

    def __init__(self) -> None:
        self._assemblies: Dict[str, AssemblySchema] = {}

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------
    def get_rulesets(self) -> List[Dict[str, Any]]:
        """Return available rulesets."""
        return [self.DEFAULT_RULESET.copy()]

    def remember(self, assembly: AssemblySchema) -> None:
        """Cache an assembly for subsequent operations (e.g. apply-fixes)."""
        self._assemblies[assembly.assembly_id] = assembly

    def load(self, assembly_id: str) -> Optional[AssemblySchema]:
        """Lookup an assembly by id (populated via remember)."""
        return self._assemblies.get(assembly_id)

    def run_drc(self, assembly: AssemblySchema, ruleset_id: Optional[str] = None) -> DRCReport:
        assembly = self._ensure_schema(assembly)

        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        checkers = [
            self._check_mechanical_rules,
            self._check_electrical_rules,
            self._check_standards_rules,
            self._check_labeling_rules,
            self._check_consistency_rules,
        ]

        for checker in checkers:
            checker_findings, checker_fixes = checker(assembly)
            findings.extend(checker_findings)
            fixes.extend(checker_fixes)

        findings = self._dedupe_findings(findings)
        fixes = self._dedupe_fixes(fixes)

        errors = sum(1 for finding in findings if finding.severity == "error")
        warnings = sum(1 for finding in findings if finding.severity == "warning")
        passed = errors == 0

        report = DRCReport(
            assembly_id=assembly.assembly_id,
            ruleset_id=ruleset_id or self.DEFAULT_RULESET["id"],
            version=self.DEFAULT_RULESET["version"],
            passed=passed,
            errors=errors,
            warnings=warnings,
            findings=findings,
            fixes=fixes,
            generated_at=datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        )

        return report

    def apply_fixes(
        self,
        assembly: AssemblySchema,
        fix_ids: List[str],
        ruleset_id: Optional[str] = None,
    ) -> Tuple[AssemblySchema, DRCReport]:
        assembly = self._ensure_schema(assembly)
        working = deepcopy(assembly.model_dump(mode="python"))

        for fix_id in fix_ids:
            if fix_id == "FIX_LABEL_OFFSET_DEFAULT":
                labels = working.setdefault("labels", {})
                labels["offset_mm"] = self.LABEL_OFFSET_DEFAULT
            elif fix_id.startswith("FIX_CLAMP_ADJUST_"):
                clamp_id = fix_id.split("FIX_CLAMP_ADJUST_", 1)[1]
                self._apply_clamp_adjustment(working, clamp_id)
            elif fix_id.startswith("FIX_CONTACT_PLATING_"):
                end_key = fix_id.split("FIX_CONTACT_PLATING_", 1)[1].lower()
                self._apply_contact_plating_upgrade(working, end_key)
            elif fix_id.startswith("FIX_ADD_HEAT_SHRINK_"):
                end_key = fix_id.split("FIX_ADD_HEAT_SHRINK_", 1)[1].lower()
                self._apply_heat_shrink(working, end_key)

        data_for_hash = deepcopy(working)
        data_for_hash.pop("schema_hash", None)
        normalized = json.dumps(data_for_hash, sort_keys=True, separators=(",", ":")).encode("utf-8")
        schema_hash = hashlib.sha1(normalized).hexdigest()

        working["schema_hash"] = schema_hash
        updated = AssemblySchema.model_validate(working)
        self.remember(updated)

        report = self.run_drc(updated, ruleset_id)
        return updated, report

    # ---------------------------------------------------------------------
    # Mechanical domain
    # ---------------------------------------------------------------------
    def _check_mechanical_rules(self, assembly: AssemblySchema) -> Tuple[List[DRCFinding], List[DRCFix]]:
        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        cable = assembly.cable
        conductors = assembly.conductors
        endpoints = assembly.endpoints or {}

        cable_type = cable.get("type", "")
        conductor_count = conductors.get("count") or len(assembly.wirelist)
        ribbon = conductors.get("ribbon") or {}
        ribbon_ways = ribbon.get("ways")
        expected_positions = ribbon_ways if cable_type == "ribbon" and ribbon_ways else conductor_count

        for end_name, endpoint in endpoints.items():
            connector = endpoint.get("connector") or {}
            positions = connector.get("positions")
            if positions is None:
                continue
            if positions != expected_positions:
                findings.append(
                    DRCFinding(
                        id=f"MECH_CONNECTOR_POSITIONS_{end_name.upper()}",
                        severity="error",
                        domain="mechanical",
                        code="MECHANICAL/CONNECTOR_POSITION_MISMATCH",
                        message=(
                            f"Connector at {end_name} has {positions} positions but design expects "
                            f"{expected_positions}"
                        ),
                        where=f"endpoints.{end_name}.connector.positions",
                    )
                )

        environment = cable.get("environment") or {}
        flex_class = environment.get("flex_class", "static")
        design_radius = cable.get("bend_radius_mm")
        recommended_radius = cable.get("min_bend_radius_mm") or self._recommended_bend_radius(
            cable_type, cable.get("od_mm"), ribbon
        )
        if design_radius is not None and recommended_radius is not None and design_radius < recommended_radius:
            severity = "error" if flex_class != "static" else "warning"
            findings.append(
                DRCFinding(
                    id="MECH_BEND_RADIUS",
                    severity=severity,
                    domain="mechanical",
                    code="MECHANICAL/BEND_RADIUS_TOO_SMALL",
                    message=(
                        f"Design bend radius {design_radius}mm below recommended {recommended_radius}mm "
                        f"for flex classification '{flex_class}'"
                    ),
                    where="cable.bend_radius_mm",
                )
            )

        cable_od = cable.get("od_mm")
        for end_name, endpoint in endpoints.items():
            for index, accessory in enumerate(endpoint.get("accessories", []) or []):
                clamp = accessory.get("clamp")
                if not clamp or cable_od is None:
                    continue

                min_od = clamp.get("min_od_mm")
                max_od = clamp.get("max_od_mm")
                if min_od is None or max_od is None:
                    continue

                if min_od <= cable_od <= max_od:
                    continue

                if cable_od < min_od:
                    delta = min_od - cable_od
                    direction = "below"
                else:
                    delta = cable_od - max_od
                    direction = "above"

                severity = "warning" if delta <= self.CLAMP_TOLERANCE_MM else "error"
                findings.append(
                    DRCFinding(
                        id=f"MECH_CLAMP_RANGE_{end_name.upper()}_{index}",
                        severity=severity,
                        domain="mechanical",
                        code="MECHANICAL/CLAMP_RANGE_MISMATCH",
                        message=(
                            f"Accessory clamp range [{min_od}, {max_od}]mm {direction} cable OD {cable_od}mm "
                            f"by {delta:.2f}mm"
                        ),
                        where=f"endpoints.{end_name}.accessories[{index}].clamp",
                    )
                )

                if severity == "warning":
                    clamp_id = accessory.get("mpn") or f"{end_name}_{index}"
                    fixes.append(
                        DRCFix(
                            id=f"FIX_CLAMP_ADJUST_{clamp_id}",
                            label="Select clamp to match cable OD",
                            description=(
                                "Swap to clamp size that properly envelopes the cable OD or adjust existing clamp insert."
                            ),
                            applies_to=[f"endpoints.{end_name}.accessories[{index}]"],
                            effect="substitution",
                        )
                    )

        return findings, fixes

    # ---------------------------------------------------------------------
    # Electrical domain
    # ---------------------------------------------------------------------
    def _check_electrical_rules(self, assembly: AssemblySchema) -> Tuple[List[DRCFinding], List[DRCFix]]:
        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        cable = assembly.cable
        conductors = assembly.conductors
        endpoints = assembly.endpoints or {}

        awg = conductors.get("awg")
        electrical = cable.get("electrical") or {}
        per_circuit = electrical.get("per_circuit") or []
        system_voltage = electrical.get("system_voltage_v")
        env = cable.get("environment") or {}
        temp_max = env.get("temp_max_c")
        ratings = cable.get("ratings") or {}
        rating_voltage = ratings.get("voltage_v")
        rating_temp = ratings.get("temp_c")

        max_current = max((circuit.get("current_a", 0.0) for circuit in per_circuit), default=0.0)
        loaded_circuits = sum(1 for circuit in per_circuit if circuit.get("current_a", 0.0) > 0.0)

        if awg in self.AMPACITY_TABLE and per_circuit:
            ampacity = self.AMPACITY_TABLE[awg]
            bundle_factor = 0.8 if loaded_circuits > 3 else 1.0
            allowable = ampacity * bundle_factor * 0.8  # 20% design margin
            if max_current > allowable:
                findings.append(
                    DRCFinding(
                        id="ELEC_AMPACITY_MARGIN",
                        severity="error",
                        domain="electrical",
                        code="ELECTRICAL/AMPACITY_MARGIN",
                        message=(
                            f"Maximum circuit current {max_current}A exceeds allowable {allowable:.2f}A "
                            f"for AWG {awg} with required margin."
                        ),
                        where="cable.electrical.per_circuit",
                    )
                )

        if system_voltage and rating_voltage and rating_voltage < system_voltage:
            findings.append(
                DRCFinding(
                    id="ELEC_VOLTAGE_RATING",
                    severity="error",
                    domain="electrical",
                    code="ELECTRICAL/VOLTAGE_RATING",
                    message=f"Cable voltage rating {rating_voltage}V below system requirement {system_voltage}V.",
                    where="cable.ratings.voltage_v",
                )
            )

        if rating_temp and temp_max and rating_temp < temp_max:
            findings.append(
                DRCFinding(
                    id="ELEC_TEMPERATURE_RATING",
                    severity="error",
                    domain="electrical",
                    code="ELECTRICAL/TEMPERATURE_RATING",
                    message=(
                        f"Cable temperature rating {rating_temp}°C below environment maximum {temp_max}°C."
                    ),
                    where="cable.ratings.temp_c",
                )
            )

        shield = assembly.shield or {}
        drain_policy = shield.get("drain_policy")
        if shield.get("type") and shield.get("type") != "none" and drain_policy:
            for end_name, endpoint in endpoints.items():
                termination_policy = endpoint.get("shield_termination")
                if termination_policy and termination_policy != drain_policy:
                    findings.append(
                        DRCFinding(
                            id=f"ELEC_SHIELD_POLICY_{end_name.upper()}",
                            severity="warning",
                            domain="electrical",
                            code="ELECTRICAL/SHIELD_TERMINATION_MISMATCH",
                            message=(
                                f"Shield termination at {end_name} ({termination_policy}) differs from "
                                f"cable drain policy ({drain_policy})."
                            ),
                            where=f"endpoints.{end_name}.shield_termination",
                        )
                    )

        chemicals = env.get("chemicals") or []
        low_level_signal = max_current <= 1.0
        if chemicals and low_level_signal:
            for end_name, endpoint in endpoints.items():
                contacts = (endpoint.get("contacts") or {}).get("primary") or {}
                plating = contacts.get("plating")
                if isinstance(plating, str) and plating.lower() == "tin":
                    fixes.append(
                        DRCFix(
                            id=f"FIX_CONTACT_PLATING_{end_name.upper()}",
                            label="Upgrade contact plating",
                            description=(
                                "Upgrade to gold-flash or equivalent plating for low-level signals exposed to chemicals."
                            ),
                            applies_to=[f"endpoints.{end_name}.contacts.primary.plating"],
                            effect="substitution",
                        )
                    )
                    findings.append(
                        DRCFinding(
                            id=f"ELEC_CONTACT_PLATING_{end_name.upper()}",
                            severity="warning",
                            domain="electrical",
                            code="ELECTRICAL/CONTACT_PLATING",
                            message=(
                                f"Tin plating at {end_name} susceptible to chemical corrosion; upgrade recommended."
                            ),
                            where=f"endpoints.{end_name}.contacts.primary.plating",
                        )
                    )

        return findings, fixes

    # ---------------------------------------------------------------------
    # Standards domain
    # ---------------------------------------------------------------------
    def _check_standards_rules(self, assembly: AssemblySchema) -> Tuple[List[DRCFinding], List[DRCFix]]:
        findings: List[DRCFinding] = []
        cable = assembly.cable
        compliance = cable.get("compliance") or {}

        ipc_class = compliance.get("ipc_class")
        if not ipc_class:
            findings.append(
                DRCFinding(
                    id="STD_IPC_CLASS",
                    severity="error",
                    domain="standards",
                    code="STANDARDS/IPC_CLASS",
                    message="IPC/WHMA-A-620 class must be specified.",
                    where="cable.compliance.ipc_class",
                )
            )

        if compliance.get("rohs_reach") is not True:
            findings.append(
                DRCFinding(
                    id="STD_ROHS_REACH",
                    severity="error",
                    domain="standards",
                    code="STANDARDS/ROHS_REACH",
                    message="Design must declare RoHS/REACH compliance.",
                    where="cable.compliance.rohs_reach",
                )
            )

        labels = assembly.labels or {}
        if labels and compliance.get("ul94_v0_labels") is not True:
            findings.append(
                DRCFinding(
                    id="STD_UL94_V0",
                    severity="error",
                    domain="standards",
                    code="STANDARDS/UL94_V0",
                    message="Label material must meet UL94-V0 when labels are present.",
                    where="cable.compliance.ul94_v0_labels",
                )
            )

        return findings, []

    # ---------------------------------------------------------------------
    # Labeling domain
    # ---------------------------------------------------------------------
    def _check_labeling_rules(self, assembly: AssemblySchema) -> Tuple[List[DRCFinding], List[DRCFix]]:
        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        labels = assembly.labels or {}

        title_block = labels.get("title_block") or {}
        required_fields = ["pn", "rev", "mfr", "date"]
        missing_fields = [field for field in required_fields if not title_block.get(field)]
        if missing_fields:
            findings.append(
                DRCFinding(
                    id="LAB_TITLE_BLOCK",
                    severity="error",
                    domain="labeling",
                    code="LABELING/TITLE_BLOCK_MISSING",
                    message=f"Title block missing fields: {', '.join(missing_fields)}.",
                    where="labels.title_block",
                )
            )

        label_text = labels.get("text", "") or ""
        expected_tokens = ["PN", "REV", "MFR"]
        missing_tokens = [token for token in expected_tokens if token not in label_text.upper()]
        if missing_tokens or not any(char.isdigit() for char in label_text):
            findings.append(
                DRCFinding(
                    id="LAB_TEXT_CONTENT",
                    severity="warning",
                    domain="labeling",
                    code="LABELING/TEXT_CONTENT",
                    message="Label text should include PN/REV/MFR and a date code.",
                    where="labels.text",
                )
            )

        offset = labels.get("offset_mm")
        if offset is None:
            findings.append(
                DRCFinding(
                    id="LAB_OFFSET_MISSING",
                    severity="warning",
                    domain="labeling",
                    code="LABEL_OFFSET_MISSING",
                    message="Label offset not specified; defaulting to 30mm from end.",
                    where="labels.offset_mm",
                )
            )
            fixes.append(
                DRCFix(
                    id="FIX_LABEL_OFFSET_DEFAULT",
                    label="Apply default label offset",
                    description="Set label offset to default 30mm from connector datum.",
                    applies_to=["labels.offset_mm"],
                    effect="non_destructive",
                )
            )
        elif not (self.LABEL_OFFSET_RANGE[0] <= offset <= self.LABEL_OFFSET_RANGE[1]):
            findings.append(
                DRCFinding(
                    id="LAB_OFFSET_RANGE",
                    severity="warning",
                    domain="labeling",
                    code="LABELING/OFFSET_RANGE",
                    message=(
                        f"Label offset {offset}mm outside recommended range "
                        f"{self.LABEL_OFFSET_RANGE[0]}-{self.LABEL_OFFSET_RANGE[1]}mm."
                    ),
                    where="labels.offset_mm",
                )
            )

        return findings, fixes

    # ---------------------------------------------------------------------
    # Consistency domain
    # ---------------------------------------------------------------------
    def _check_consistency_rules(self, assembly: AssemblySchema) -> Tuple[List[DRCFinding], List[DRCFix]]:
        findings: List[DRCFinding] = []
        fixes: List[DRCFix] = []

        cable = assembly.cable
        conductors = assembly.conductors
        endpoints = assembly.endpoints or {}

        if cable.get("type") == "ribbon":
            ribbon = conductors.get("ribbon") or {}
            if not ribbon.get("red_stripe", False):
                findings.append(
                    DRCFinding(
                        id="CONSIST_RIBBON_STRIPE",
                        severity="warning",
                        domain="consistency",
                        code="CONSISTENCY/RIBBON_RED_STRIPE",
                        message="Ribbon cable should include red stripe on conductor 1.",
                        where="conductors.ribbon.red_stripe",
                    )
                )

        for end_name, endpoint in endpoints.items():
            connector = endpoint.get("connector") or {}
            if connector and connector.get("pin1_indicator") is not True:
                findings.append(
                    DRCFinding(
                        id=f"CONSIST_PIN1_{end_name.upper()}",
                        severity="warning",
                        domain="consistency",
                        code="CONSISTENCY/PIN1_INDICATOR",
                        message=f"Connector at {end_name} should include pin-1 indicator.",
                        where=f"endpoints.{end_name}.connector.pin1_indicator",
                    )
                )

        locale = cable.get("locale")
        if locale == "EU":
            for wire in assembly.wirelist:
                circuit = (wire.get("circuit") or "").upper()
                color = (wire.get("color") or "").upper()
                if circuit in ("L", "N", "PE") and not self._is_eu_color_correct(circuit, color):
                    findings.append(
                        DRCFinding(
                            id=f"CONSIST_COLOR_{circuit}",
                            severity="warning",
                            domain="consistency",
                            code="CONSISTENCY/LOCALE_COLOR",
                            message=f"EU locale requires {circuit} circuit colors to follow IEC standard.",
                            where=f"wirelist[{wire.get('conductor', 0)}].color",
                        )
                    )

        for end_name, endpoint in endpoints.items():
            if endpoint.get("termination") == "ring_lug":
                lugs = endpoint.get("lugs") or []
                missing_stud = False
                for index, lug in enumerate(lugs):
                    if not lug.get("stud"):
                        missing_stud = True
                        break
                if not lugs or missing_stud:
                    findings.append(
                        DRCFinding(
                            id=f"CONSIST_STUD_SIZE_{end_name.upper()}",
                            severity="error",
                            domain="consistency",
                            code="CONSISTENCY/STUD_SIZE_MISSING",
                            message="Ring lug termination requires stud size to be specified.",
                            where=f"{end_name}.lugs[*].stud",
                        )
                    )

                needs_heat_shrink = endpoint.get("requires_heat_shrink")
                if needs_heat_shrink and not endpoint.get("heat_shrink"):
                    fixes.append(
                        DRCFix(
                            id=f"FIX_ADD_HEAT_SHRINK_{end_name.upper()}",
                            label="Add heat-shrink at lug",
                            description="Add adhesive heat-shrink sleeve for strain relief and insulation.",
                            applies_to=[f"endpoints.{end_name}"],
                            effect="non_destructive",
                        )
                    )
                    findings.append(
                        DRCFinding(
                            id=f"CONSIST_HEAT_SHRINK_{end_name.upper()}",
                            severity="warning",
                            domain="consistency",
                            code="CONSISTENCY/HEAT_SHRINK",
                            message=f"Heat-shrink required at {end_name} ring lug termination.",
                            where=f"endpoints.{end_name}",
                        )
                    )

        return findings, fixes

    # ---------------------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------------------
    def _ensure_schema(self, assembly: AssemblySchema | Dict[str, Any]) -> AssemblySchema:
        if isinstance(assembly, AssemblySchema):
            return assembly
        return AssemblySchema.model_validate(assembly)

    def _dedupe_findings(self, findings: List[DRCFinding]) -> List[DRCFinding]:
        unique: Dict[Tuple[str, Optional[str]], DRCFinding] = {}
        for finding in findings:
            key = (finding.id, finding.where)
            if key not in unique:
                unique[key] = finding
        return list(unique.values())

    def _dedupe_fixes(self, fixes: List[DRCFix]) -> List[DRCFix]:
        unique: Dict[str, DRCFix] = {}
        for fix in fixes:
            unique.setdefault(fix.id, fix)
        return list(unique.values())

    def _recommended_bend_radius(
        self,
        cable_type: str,
        od_mm: Optional[float],
        ribbon: Dict[str, Any],
    ) -> Optional[float]:
        if cable_type == "ribbon":
            pitch = ribbon.get("pitch_in")
            if isinstance(pitch, (int, float)):
                return self.RIBBON_BEND_TABLE_MM.get(float(pitch), 10.0)
            return 10.0
        if od_mm is not None:
            return round(8.0 * float(od_mm), 2)
        return None

    def _is_eu_color_correct(self, circuit: str, color: str) -> bool:
        eu_colors = {
            "L": {"BROWN", "BLACK"},
            "N": {"BLUE"},
            "PE": {"GREEN/YELLOW", "GREEN-YELLOW", "GREEN/YEL"},
        }
        return color in eu_colors.get(circuit, set())

    def _apply_clamp_adjustment(self, data: Dict[str, Any], clamp_id: str) -> None:
        cable_od = data.get("cable", {}).get("od_mm")
        if cable_od is None:
            return

        for endpoint in (data.get("endpoints") or {}).values():
            for accessory in endpoint.get("accessories", []) or []:
                mpn = accessory.get("mpn") or ""
                if mpn == clamp_id:
                    clamp = accessory.setdefault("clamp", {})
                    clamp["min_od_mm"] = min(clamp.get("min_od_mm", cable_od), cable_od - 0.05)
                    clamp["max_od_mm"] = max(clamp.get("max_od_mm", cable_od), cable_od + 0.05)
                    return

    def _apply_contact_plating_upgrade(self, data: Dict[str, Any], end_key: str) -> None:
        endpoint = (data.get("endpoints") or {}).get(end_key)
        if not endpoint:
            return
        contacts = endpoint.setdefault("contacts", {})
        primary = contacts.setdefault("primary", {})
        primary["plating"] = "gold-flash"

    def _apply_heat_shrink(self, data: Dict[str, Any], end_key: str) -> None:
        endpoint = (data.get("endpoints") or {}).get(end_key)
        if not endpoint:
            return
        endpoint["heat_shrink"] = True
