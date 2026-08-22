import { z } from "zod";

/**
 * Request body for POST /api/architect.
 *
 * Hand-written rather than generated: the OpenAPI spec (lib/api-spec/openapi.yaml)
 * has been updated with the equivalent contract as the source of truth, but the
 * generated packages (@workspace/api-zod, @workspace/api-client-react) are Orval
 * output and should be regenerated with `pnpm --filter @workspace/api-spec run
 * codegen` rather than hand-edited. This schema keeps the endpoint fully
 * validated in the meantime and can be deleted once codegen produces the
 * equivalent generated schema.
 */
export const CreateArchitectPlanBody = z.object({
  goal: z.string().min(3, "goal must be at least 3 characters"),
});

export type CreateArchitectPlanBodyType = z.infer<typeof CreateArchitectPlanBody>;
