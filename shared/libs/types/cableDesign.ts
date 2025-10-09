import { z } from "zod";

/**
 * Zod schema mirroring shared/contracts/schemas/v1/cable-design.schema.json
 */
export const CableDesignSchema = z.object({
  id: z.string(),
  name: z.string(),
  cores: z.number().int().min(1),
});

export type CableDesign = z.infer<typeof CableDesignSchema>;
