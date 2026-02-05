import z from "zod";

export const getAbonentFiltesQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  sortField: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional().default("asc"),
  filters: z
    .object({
      accountNumber: z.string().optional(),
      fullName: z.string().optional(),
      mahallaId: z.coerce.number().optional(),
      type: z.enum(["electricity", "phone"]).optional(),
      nazoratchi_id: z.coerce.number().optional(),
      status: z.enum(["completed", "in-progress", "rejected"]).optional(),
    })
    .optional(),
});

export const findTaskIdSchema = z.object({ id: z.string() });

export const createTaskBodySchema = z.object({
  accountNumber: z.string(),
  fullName: z.string(),
  mahallaId: z.number(),
  type: z.enum(["electricity", "phone"]),
  nazoratchi_id: z.number(),
  nazoratchiName: z.string(),
});

export const updateTaskBodySchema = z.object({
  accountNumber: z.string().optional(),
  fullName: z.string().optional(),
  mahallaId: z.number().optional(),
  type: z.enum(["electricity", "phone"]).optional(),
  nazoratchi_id: z.number().optional(),
  nazoratchiName: z.string().optional(),
});
