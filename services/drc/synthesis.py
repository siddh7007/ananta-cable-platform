from typing import List, Optional, Dict, Any
from models import (
    AssemblyStep1, SynthesisProposal, PartRef, WirelistRow, BomLine,
    ConductorSpec, EndpointFull, ShieldSpec, TerminationType
)
from mdm_dao import MDMDAO

class SynthesisEngine:
    """Deterministic synthesis engine for Step 2 cable assembly proposals."""

    def __init__(self):
        self.mdm_dao = MDMDAO()

    def propose_synthesis(self, draft_id: str, step1_payload: Optional[AssemblyStep1] = None) -> SynthesisProposal:
        """Generate synthesis proposal from Step 1 assembly specification."""

        # For now, accept step1_payload directly. In production, fetch from BFF/database
        if not step1_payload:
            raise ValueError("step1_payload required for synthesis")

        proposal_id = f"prop_{draft_id}_{hash(str(step1_payload)) % 10000}"

        # Cable selection
        cable_spec = self._select_cable(step1_payload)

        # Conductor specification
        conductors = self._calculate_conductors(step1_payload)

        # Endpoint specifications
        endpoints = self._specify_endpoints(step1_payload)

        # Shield specification (from Step 1 EMI)
        shield = ShieldSpec(
            type=step1_payload.emi.shield,
            drain_policy=step1_payload.emi.drain_policy
        )

        # Generate wirelist
        wirelist = self._generate_wirelist(step1_payload, conductors)

        # Generate BOM
        bom = self._generate_bom(cable_spec, endpoints, conductors, shield)

        # Generate explanations
        explain = self._generate_explanations(step1_payload, cable_spec, conductors, endpoints)

        return SynthesisProposal(
            proposal_id=proposal_id,
            draft_id=draft_id,
            cable=cable_spec,
            conductors=conductors,
            endpoints=endpoints,
            shield=shield,
            wirelist=wirelist,
            bom=bom,
            warnings=[],  # No warnings in basic implementation
            errors=[],   # No errors in basic implementation
            explain=explain
        )

    def _select_cable(self, step1: AssemblyStep1) -> Dict[str, Any]:
        """Select minimal cable family meeting requirements."""
        cable_type = step1.type

        if cable_type == "ribbon":
            # Determine pitch from endpoints
            pitch_in = float(self._determine_ribbon_pitch(step1))
            ways = self._determine_ways_required(step1)

            # Query MDM for ribbon cables
            cables = self.mdm_dao.find_ribbon_by(ways, pitch_in, temp_min=80, shield="none")

            if not cables:
                # Fallback to generic
                primary = PartRef(
                    mpn=f"RIBBON-{pitch_in}x{ways}",
                    family="Ribbon Cable",
                    series=f"{pitch_in}\" Pitch",
                    notes=f"Standard ribbon cable, {pitch_in}\" pitch, {ways} conductors"
                )
                alternates = []
            else:
                primary_cable = cables[0]
                primary = PartRef(
                    mpn=primary_cable['mpn'],
                    family=primary_cable['family'],
                    series=f"{primary_cable['pitch_in']}\" Pitch",
                    notes=f"Selected ribbon cable, {primary_cable['pitch_in']}\" pitch, {primary_cable['conductor_count']} conductors"
                )
                alternates = [
                    PartRef(
                        mpn=cable['mpn'],
                        family=cable['family'],
                        series=f"{cable['pitch_in']}\" Pitch",
                        notes=f"Alternative ribbon cable"
                    ) for cable in cables[1:3]  # Up to 3 alternates
                ]

        elif cable_type in ["power_cable", "custom"]:
            # Power cable selection
            voltage_min = step1.electrical.system_voltage_v if step1.electrical else 300
            conductors_needed = self._estimate_conductors_needed(step1)

            # Calculate AWG range based on current requirements
            awg_range = self._calculate_awg_range(step1)

            # Query MDM for round shielded cables
            cables = self.mdm_dao.find_round_cable_by(
                conductors_needed, awg_range, voltage_min, temp_min=80, shield="foil", flex_class="flexible"
            )

            if not cables:
                # Fallback
                primary = PartRef(
                    mpn=f"POWER-{conductors_needed}C-{voltage_min}V",
                    family="Power Cable",
                    series="Multi-conductor",
                    notes=f"Power cable, {conductors_needed} conductors, {voltage_min}V rated"
                )
                alternates = []
            else:
                primary_cable = cables[0]
                primary = PartRef(
                    mpn=primary_cable['mpn'],
                    family=primary_cable['family'],
                    series=f"{primary_cable['conductor_awg']} AWG",
                    notes=f"Selected power cable, {primary_cable['conductor_count']} conductors, {primary_cable['voltage_rating_v']}V rated"
                )
                alternates = [
                    PartRef(
                        mpn=cable['mpn'],
                        family=cable['family'],
                        series=f"{cable['conductor_awg']} AWG",
                        notes="Alternative power cable"
                    ) for cable in cables[1:3]  # Up to 3 alternates
                ]

        else:  # sensor_lead, rf_coax
            primary = PartRef(
                mpn=f"{cable_type.upper()}-STD",
                family=f"{cable_type.title()} Cable",
                series="Standard",
                notes=f"Standard {cable_type} cable"
            )
            alternates = []

        return {"primary": primary, "alternates": alternates}

    def _determine_ribbon_pitch(self, step1: AssemblyStep1) -> str:
        """Determine ribbon pitch from endpoints."""
        # Check if endpoints require 0.025" pitch (fine pitch connectors)
        for endpoint in [step1.endA, step1.endB]:
            if hasattr(endpoint.selector, 'series'):
                series = endpoint.selector.series.lower()
                if 'fine' in series or '0.025' in series:
                    return "0.025"

        # Default to 0.050" unless endpoints imply otherwise
        return "0.050"

    def _determine_ways_required(self, step1: AssemblyStep1) -> int:
        """Determine number of conductors needed."""
        if step1.electrical and step1.electrical.per_circuit:
            return len(step1.electrical.per_circuit)

        # Estimate from type
        if step1.type == "ribbon":
            return 10  # Default ribbon ways

        return 2  # Minimum for power

    def _calculate_awg_range(self, step1: AssemblyStep1) -> List[int]:
        """Calculate AWG range based on electrical requirements."""
        if not step1.electrical or not step1.electrical.per_circuit:
            return [14, 16, 18]  # Default range

        # Calculate based on current requirements
        awgs = []
        for circuit in step1.electrical.per_circuit:
            awg = self._calculate_awg_for_current(circuit.current_a, circuit.length_m or 1.0)
            awgs.append(awg)

        # Return unique AWGs, expanded to range
        unique_awgs = list(set(awgs))
        if len(unique_awgs) == 1:
            awg = unique_awgs[0]
            return [awg-2, awg-1, awg, awg+1, awg+2]  # Range around the AWG
        else:
            return sorted(unique_awgs)

    def _calculate_awg_for_current(self, current_a: float, length_m: float) -> int:
        """Calculate AWG based on current and length (simplified)."""
        # Simplified AWG calculation - in production use proper ampacity tables
        if current_a <= 1.0:
            return 22
        elif current_a <= 2.0:
            return 20
        elif current_a <= 5.0:
            return 18
        elif current_a <= 10.0:
            return 16
        else:
            return 14
        return type_defaults.get(step1.type, 2)

    def _calculate_conductors(self, step1: AssemblyStep1) -> ConductorSpec:
        """Calculate conductor specifications."""
        conductors_needed = self._estimate_conductors_needed(step1)

        if step1.type == "ribbon":
            # Ribbon cable specifics
            pitch = self._determine_ribbon_pitch(step1)
            return ConductorSpec(
                count=conductors_needed,
                awg=28,  # Standard ribbon AWG
                color_map=None,  # Will be determined by locale
                ribbon={
                    "pitch_in": float(pitch),
                    "ways": conductors_needed,
                    "red_stripe": True
                }
            )

        # Power/signal conductor calculation
        awg = self._calculate_awg(step1)

        return ConductorSpec(
            count=conductors_needed,
            awg=awg,
            color_map=None  # Will be determined by locale
        )

    def _calculate_awg(self, step1: AssemblyStep1) -> int:
        """Calculate appropriate AWG with derating and margin."""
        if not step1.electrical or not step1.electrical.per_circuit:
            # Default AWG by type
            defaults = {
                "power_cable": 16,
                "sensor_lead": 24,
                "rf_coax": 20,
                "custom": 18
            }
            return defaults.get(step1.type, 22)

        # Calculate per circuit
        max_current = 0
        for circuit in step1.electrical.per_circuit:
            current = circuit.get("current_a", 1.0)  # Default 1A
            max_current = max(max_current, current)

        # Apply derating for >3 current-carrying conductors
        current_carrying = len([c for c in step1.electrical.per_circuit if c.get("current_a", 0) > 0])
        if current_carrying > 3:
            max_current *= 0.8  # 80% derating

        # Add 20% margin
        max_current *= 1.2

        # AWG selection (simplified lookup)
        awg_table = [
            (1, 10), (2, 12), (3, 14), (5, 16), (7, 18), (10, 20), (15, 22), (20, 24), (25, 26), (30, 28)
        ]

        for current, awg in awg_table:
            if max_current <= current:
                return awg

        return 10  # Maximum AWG for high current

    def _specify_endpoints(self, step1: AssemblyStep1) -> Dict[str, Any]:
        """Specify full endpoint configurations."""
        endA = self._specify_endpoint(step1.endA, step1)
        endB = self._specify_endpoint(step1.endB, step1)

        return {"endA": endA, "endB": endB}

    def _specify_endpoint(self, endpoint: Any, step1: AssemblyStep1) -> EndpointFull:
        """Specify full endpoint with contacts and accessories."""
        # Basic connector selection
        if hasattr(endpoint.selector, 'mpn'):
            connector = PartRef(mpn=endpoint.selector.mpn)
        else:
            # Generate connector based on series/positions
            series = endpoint.selector.series
            positions = endpoint.selector.positions
            connector = PartRef(
                mpn=f"{series}-{positions}POS",
                family=series,
                series=series,
                notes=f"Generated {positions}-position connector"
            )

        # Contact selection
        contacts = self._select_contacts(endpoint.termination, step1)

        # Accessories
        accessories = self._select_accessories(connector, step1)

        return EndpointFull(
            connector=connector,
            termination=endpoint.termination,
            contacts=contacts,
            accessories=accessories
        )

    def _select_contacts(self, termination: TerminationType, step1: AssemblyStep1) -> Optional[Dict[str, Any]]:
        """Select appropriate contacts."""
        if termination == "crimp":
            awg = self._calculate_awg(step1)
            plating_pref = "gold_flash" if self._needs_gold_plating(step1) else "tin"

            # Determine connector family from endpoints
            connector_family = self._determine_connector_family(step1)

            # Query MDM for contacts
            contacts = self.mdm_dao.find_contacts_by(connector_family, awg, plating_pref)

            if not contacts:
                # Fallback
                primary = PartRef(
                    mpn=f"CRIMP-{awg}AWG-{plating_pref.upper()}",
                    family="Crimp Contacts",
                    series=f"{awg} AWG",
                    notes=f"{plating_pref} plating for {awg} AWG wire"
                )
                return {"primary": primary, "alternates": []}
            else:
                primary_contact = contacts[0]
                primary = PartRef(
                    mpn=primary_contact['mpn'],
                    family=primary_contact['family'],
                    series=f"{awg} AWG",
                    notes=f"Selected contact for {awg} AWG wire"
                )
                alternates = [
                    PartRef(
                        mpn=contact['mpn'],
                        family=contact['family'],
                        series=f"{awg} AWG",
                        notes="Alternative contact"
                    ) for contact in contacts[1:3]  # Up to 3 alternates
                ]
                return {"primary": primary, "alternates": alternates}

        elif termination == "idc":
            primary = PartRef(
                mpn="IDC-STANDARD",
                family="IDC Contacts",
                series="Standard",
                notes="Standard IDC contacts"
            )
            return {"primary": primary, "alternates": []}

        elif termination == "ring_lug":
            awg = self._calculate_awg(step1)
            stud_size = "M4"  # Default, should come from constraints

            primary = PartRef(
                mpn=f"RING-{awg}AWG-{stud_size}",
                family="Ring Lugs",
                series=f"{stud_size} Stud",
                notes=f"Ring lug for {awg} AWG wire, {stud_size} stud"
            )

        return {"primary": primary, "alternates": alternates}

    def _determine_connector_family(self, step1: AssemblyStep1) -> str:
        """Determine connector family from endpoints."""
        # Check both endpoints for connector family
        for endpoint in [step1.endA, step1.endB]:
            if hasattr(endpoint.selector, 'family'):
                return endpoint.selector.family
            elif hasattr(endpoint.selector, 'series'):
                series = endpoint.selector.series.lower()
                if 'mega' in series or '43645' in series:
                    return "Molex Mega-Fit"
                elif '451' in series or '3m' in series.lower():
                    return "3M IDC"

        return "Molex Mega-Fit"  # Default

    def _select_accessories(self, connector: PartRef, step1: AssemblyStep1) -> List[PartRef]:
        """Select accessories for connector."""
        accessories = []

        # Determine cable OD for accessory selection
        cable_od = self._estimate_cable_od(step1)

        # Query MDM for accessories
        mdm_accessories = self.mdm_dao.find_accessories_by(connector.family, cable_od)

        for accessory in mdm_accessories[:2]:  # Limit to 2 accessories
            accessories.append(PartRef(
                mpn=accessory['mpn'],
                family=accessory['family'],
                series=accessory['type'],
                notes=f"Accessory for {connector.family}"
            ))

        return accessories

    def _estimate_cable_od(self, step1: AssemblyStep1) -> float:
        """Estimate cable OD based on type and conductor count."""
        if step1.type == "ribbon":
            ways = self._determine_ways_required(step1)
            return 0.1 + (ways * 0.01)  # Rough estimate
        else:
            conductors = self._estimate_conductors_needed(step1)
            return 0.15 + (conductors * 0.02)  # Rough estimate    def _needs_gold_plating(self, step1: AssemblyStep1) -> bool:
        """Determine if gold plating is needed."""
        # Gold flash for chemicals or low-level signals
        if step1.environment.chemicals:
            return True

        # Check for low voltage signals
        if step1.electrical and step1.electrical.per_circuit:
            for circuit in step1.electrical.per_circuit:
                if circuit.get("voltage_v", 0) < 5:  # Low voltage signal
                    return True

        return False

    def _select_accessories(self, connector: PartRef, step1: AssemblyStep1) -> Optional[List[PartRef]]:
        """Select accessories like backshells."""
        # Simplified: always include basic backshell for now
        backshell = PartRef(
            mpn="BACKSHELL-STD",
            family="Backshells",
            series="Standard",
            notes="Standard backshell for strain relief"
        )

        return [backshell]

    def _generate_wirelist(self, step1: AssemblyStep1, conductors: ConductorSpec) -> List[WirelistRow]:
        """Generate wirelist with colors and pin assignments."""
        wirelist = []

        if step1.type == "ribbon":
            # Straight-through ribbon with red stripe
            for i in range(conductors.count or 10):
                color = self._get_ribbon_color(i, step1.locale)
                wirelist.append(WirelistRow(
                    circuit=f"CIRCUIT_{i+1}",
                    conductor=i+1,
                    endA_pin=str(i+1),
                    endB_pin=str(i+1),
                    color=color,
                    shield="none"
                ))

        else:
            # Power cable coloring
            colors = self._get_power_colors(step1.locale)
            for i, (circuit_name, color) in enumerate(zip(["+V", "RTN", "PE"], colors)):
                if i < (conductors.count or 2):
                    wirelist.append(WirelistRow(
                        circuit=circuit_name,
                        conductor=i+1,
                        endA_pin=str(i+1),
                        endB_pin=str(i+1),
                        color=color,
                        shield="none"
                    ))

        return wirelist

    def _get_ribbon_color(self, position: int, locale: str) -> str:
        """Get ribbon color for position."""
        # Simplified color coding
        colors = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "gray", "white"]
        return colors[position % len(colors)]

    def _get_power_colors(self, locale: str) -> List[str]:
        """Get power cable colors by locale."""
        locale_colors = {
            "NA": ["red", "black", "green"],
            "EU": ["brown", "blue", "green_yellow"],
            "JP": ["black", "white", "green"],
            "Other": ["red", "black", "green"]
        }
        return locale_colors.get(locale, ["red", "black", "green"])

    def _generate_bom(self, cable_spec: Dict, endpoints: Dict, conductors: ConductorSpec, shield: ShieldSpec) -> List[BomLine]:
        """Generate bill of materials."""
        bom = []

        # Cable
        cable = cable_spec["primary"]
        bom.append(BomLine(
            ref=cable,
            qty=1,
            role="primary",
            reason="Selected based on requirements"
        ))

        # Connectors
        for endpoint_name, endpoint in endpoints.items():
            connector = endpoint.connector
            bom.append(BomLine(
                ref=connector,
                qty=1,
                role="primary",
                reason=f"{endpoint_name} connector"
            ))

            # Contacts
            if endpoint.contacts:
                contacts = endpoint.contacts["primary"]
                qty = conductors.count or 2
                bom.append(BomLine(
                    ref=contacts,
                    qty=qty,
                    role="primary",
                    reason=f"Contacts for {endpoint_name}"
                ))

            # Accessories
            if endpoint.accessories:
                for accessory in endpoint.accessories:
                    bom.append(BomLine(
                        ref=accessory,
                        qty=1,
                        role="primary",
                        reason=f"Accessory for {endpoint_name}"
                    ))

        return bom

    def _generate_explanations(self, step1: AssemblyStep1, cable_spec: Dict, conductors: ConductorSpec, endpoints: Dict) -> List[str]:
        """Generate human-readable explanations."""
        explain = []

        # Cable selection explanation
        cable = cable_spec["primary"]
        explain.append(f"Selected {cable.family} ({cable.mpn}) based on {step1.type} requirements")

        # Conductor explanation
        if conductors.awg:
            explain.append(f"Conductor AWG {conductors.awg} selected for current requirements with 20% margin")

        if step1.type == "ribbon" and conductors.ribbon:
            pitch = conductors.ribbon["pitch_in"]
            ways = conductors.ribbon["ways"]
            explain.append(f"Ribbon cable: {pitch}\" pitch, {ways} conductors, red stripe on conductor 1")

        # Color coding explanation
        if step1.locale == "NA":
            explain.append("North American color coding: Red (+), Black (RTN), Green (PE)")
        elif step1.locale == "EU":
            explain.append("European color coding: Brown (+), Blue (RTN), Green/Yellow (PE)")

        # Termination explanation
        for endpoint_name, endpoint in endpoints.items():
            explain.append(f"{endpoint_name}: {endpoint.termination} termination with appropriate contacts")

        return explain