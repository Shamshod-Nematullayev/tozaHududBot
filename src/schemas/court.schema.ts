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

export const getSudAktsQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  sortField: z
    .enum(["status", "sana", "mfy_id", "licshet", "reg_number", "mfy_name"])
    .default("sana"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
  status: z
    .enum([
      "yangi",
      "ariza_yaratildi",
      "ariza_imzolandi",
      "sudga_ariza_berildi",
      "sud_qarori_chiqorildi",
      "rad_etildi",
    ])
    .optional(),
  account_number: z.string().optional(),
  warning_date_from: z.coerce.date().optional(),
  warning_date_to: z.coerce.date().optional(),
  claim_amount_from: z.coerce.number().optional(),
  claim_amount_to: z.coerce.number().optional(),
  case_number: z.string().optional(),
  pinfl: z.string().optional(),
});
