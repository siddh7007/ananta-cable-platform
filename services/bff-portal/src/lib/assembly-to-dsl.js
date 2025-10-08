/**
 * Locale-specific color mappings for power cables
 */
const POWER_COLORS = {
    NA: { positive: 'red', negative: 'black', ground: 'green' },
    EU: { positive: 'brown', negative: 'blue', ground: 'green-yellow' },
    JP: { positive: 'red', negative: 'white', ground: 'green' },
    Other: { positive: 'red', negative: 'black', ground: 'green' },
};
/**
 * Convert inches to millimeters
 */
function inchesToMm(inches) {
    return inches * 25.4;
}
/**
 * Maps AssemblySchema (from synthesis/DRC) to RenderDSL for renderer service
 */
export function assemblyToRenderDSL(schema, _templatePackId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cable = schema.cable;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conductors = schema.conductors;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const endpoints = schema.endpoints;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shield = schema.shield;
    const wirelist = schema.wirelist || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labels = schema.labels;
    // Determine cable type
    let cableDsl;
    if (cable.type === 'ribbon' || (conductors.ribbon && conductors.ribbon.ways > 0)) {
        // Ribbon cable
        const ribbon = conductors.ribbon || {};
        cableDsl = {
            type: 'ribbon',
            ways: ribbon.ways || conductors.count || wirelist.length,
            pitch_in: ribbon.pitch_in || 0.05,
            red_stripe: ribbon.red_stripe !== false, // Default true
        };
    }
    else {
        // Round cable (power, sensor, coax, etc.)
        cableDsl = {
            type: 'round',
            conductors: conductors.count || wirelist.length,
            awg: conductors.awg,
            shield: shield.type || 'none',
        };
    }
    // Extract endpoints
    const endA = endpoints.endA || {};
    const endB = endpoints.endB || {};
    const endADsl = {
        connector_mpn: endA.connector?.mpn || 'UNKNOWN',
        type: endA.termination || 'crimp',
        positions: endA.connector?.positions || conductors.count || wirelist.length,
        orientation: 'horizontal',
    };
    const endBDsl = {
        connector_mpn: endB.connector?.mpn || 'UNKNOWN',
        type: endB.termination || 'crimp',
        positions: endB.connector?.positions || conductors.count || wirelist.length,
        orientation: 'horizontal',
    };
    // Build nets from wirelist
    const nets = wirelist.map((row, index) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wireRow = row;
        let color = wireRow.color;
        // For power cables without explicit colors, apply locale mapping
        if (!color && cable.type === 'power_cable') {
            const locale = (cable.locale || 'NA');
            const colorMap = POWER_COLORS[locale] || POWER_COLORS.NA;
            // Map circuit names to colors
            const circuit = (wireRow.circuit || '').toLowerCase();
            if (circuit.includes('+') || circuit.includes('pos') || circuit.includes('vcc')) {
                color = colorMap.positive;
            }
            else if (circuit.includes('gnd') || circuit.includes('ground') || circuit === 'pe') {
                color = colorMap.ground;
            }
            else if (circuit.includes('-') || circuit.includes('neg') || circuit.includes('return')) {
                color = colorMap.negative;
            }
            else {
                // Default color for ribbon cables
                const defaultColors = ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'black'];
                color = defaultColors[index % defaultColors.length];
            }
        }
        return {
            circuit: wireRow.circuit || `Net${index + 1}`,
            endA_pin: wireRow.endA_pin || String(index + 1),
            endB_pin: wireRow.endB_pin || String(index + 1),
            color,
            shield: wireRow.shield || 'none',
        };
    });
    // Extract labels from schema
    const labelsDsl = [];
    if (labels && Array.isArray(labels.callouts)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        labels.callouts.forEach((label) => {
            // Convert inch offsets to mm
            const offset_x = label.offset_x ? inchesToMm(label.offset_x) : 0;
            const offset_y = label.offset_y ? inchesToMm(label.offset_y) : 0;
            labelsDsl.push({
                text: label.text,
                anchor: label.anchor || 'cable',
                offset_x,
                offset_y,
            });
        });
    }
    // Add endpoint labels if provided
    if (endA.label) {
        labelsDsl.push({
            text: endA.label,
            anchor: 'endA',
            offset_y: -5, // 5mm above
        });
    }
    if (endB.label) {
        labelsDsl.push({
            text: endB.label,
            anchor: 'endB',
            offset_y: -5,
        });
    }
    // Extract dimensions
    const length_mm = cable.length_mm || 1000;
    const tolerance_mm = cable.tolerance_mm || 5;
    // Check if cable is too long for single drawing (broken dimension)
    const broken_dim = length_mm > 2000; // Over 2 meters, use broken dimension
    // Extract notes pack
    const notesPack = cable.notes_pack_id || labels?.notes_pack || 'STANDARD';
    // Build QR code URL (hash of assembly)
    const qr = `https://cable.example.com/a/${schema.assembly_id}`;
    return {
        meta: {
            assembly_id: schema.assembly_id,
            schema_hash: schema.schema_hash,
            created_at: new Date().toISOString(),
        },
        dimensions: {
            oal_mm: length_mm,
            tolerance_mm,
            broken_dim,
        },
        cable: cableDsl,
        endA: endADsl,
        endB: endBDsl,
        nets,
        labels: labelsDsl,
        notesPack,
        qr,
    };
}
