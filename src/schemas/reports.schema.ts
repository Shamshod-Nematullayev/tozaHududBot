import z from "zod";

export const getReportDataQuerySchema = z.object({
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});
