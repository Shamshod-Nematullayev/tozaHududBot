import z from "zod";

export const createGPSDalolatnomaBodySchema = z.object({
  date: z.coerce.date(),
  participants: z.array(
    z.object({
      position: z.string(),
      fullName: z.string(),
    })
  ),
  content: z.string(),
  responsibleCarId: z.coerce.number(),
  currentCarId: z.coerce.number(),
});

export const getGPSDalolatnomalarQuerySchema = z.object({
  page: z.coerce.number().default(0),
  limit: z.coerce.number().default(10),
  sortField: z
    .enum(["date", "responsibleCarId", "currentCarId", "documentNumber"])
    .default("date"),
  sortDirection: z.enum(["asc", "desc"]).optional().default("asc"),
  filters: z.object({
    documentNumber: z.coerce.number().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    responsibleCarId: z.coerce.number().optional(),
    currentCarId: z.coerce.number().optional(),
  }),
});
