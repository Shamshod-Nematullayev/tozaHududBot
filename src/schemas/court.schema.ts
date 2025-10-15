import z from "zod";

export const createManySudArizaBodySchema = z.object({
  sudAktIds: z.array(z.string()),
  ariza_date: z.date(),
  ariza_type: z.string(),
});

export const getHybridMailsQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  sortField: z
    .enum([
      "residentId",
      "105120390695",
      "hybridMailId",
      "createdOn",
      "receiver",
      "isSavedBilling",
      "isSent",
    ])
    .default("createdOn"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  claim_amount_from: z.coerce.number().optional(),
  claim_amount_to: z.coerce.number().optional(),
  account_number: z.string().optional(),
});
