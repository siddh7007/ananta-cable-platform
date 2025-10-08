// Static data for now - in production, this would come from a database
const NOTES_PACKS = [
    {
        id: 'STD-NOTES-IPC620-ROHS-REACH',
        name: 'IPC-620 Standard with RoHS/REACH',
        description: 'Standard notes pack compliant with IPC-620 requirements including RoHS and REACH certifications'
    },
    {
        id: 'MIL-SPEC-NOTES',
        name: 'Military Specification Notes',
        description: 'Notes pack for military and aerospace applications with enhanced quality requirements'
    }
];
export async function presetsRoutes(fastify) {
    // GET /v1/presets/notes-packs - Get available notes packs
    fastify.get('/v1/presets/notes-packs', {
        handler: async (request, reply) => {
            return reply.send(NOTES_PACKS);
        }
    });
}
