import z from "zod";

export const createManySudArizaBodySchema = z.object({
  sudAktIds: z.array(z.string()),
  ariza_date: z.date(),
  ariza_type: z.string(),
});
