import { arizaDocumentTypes } from "@models/Ariza.js";
import { Types } from "mongoose";
import z from "zod";
const accountNumberRegex = [
  /^\d{12}$/,
  "uzunligi 12 ta raqamdan iborat matn bo'lishi kerak",
] as const;

export const getAbonentDataRowIdQuerySchema = z.object({
  residentId: z.coerce.number(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const createResidentActBodySchema = z.object({
  next_inhabitant_count: z.coerce.number().nullable(),
  akt_sum: z.coerce.number(),
  licshet: z.string().regex(...accountNumberRegex),
  amountWithoutQQS: z.coerce.number().optional(),
  document_type: z.enum(arizaDocumentTypes),
  description: z.string().max(255),
  ariza_id: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  }),
  photos: z.array(z.string()).optional(),
});

export const duplicateActFromRequestBodySchema = z.object({
  ariza_id: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  }),
  akt_sum: z.coerce.number(),
});

export const createDublicateActBodySchema = z.object({
  realAccountNumber: z.string().regex(...accountNumberRegex),
  fakeAccountNumber: z.string().regex(...accountNumberRegex),
  fakeAccountIncomeAmount: z.coerce.number().min(0),
});

export const sendAbonentsListToTelegramQuerySchema = z.object({
  minSaldo: z.string().optional(),
  maxSaldo: z.string().optional(),
  identified: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["true", "false"]).optional()
  ),
  elektrAccountNumberConfirmed: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["true", "false"]).optional()
  ),
  mahalla_name: z.string(),
});

export const getAbonentsByMfyIdQuerySchema = z.object({
  minSaldo: z.coerce.number().optional(),
  maxSaldo: z.coerce.number().optional(),
  identified: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["true", "false"]).optional()
  ),
  etkStatus: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["true", "false"]).optional()
  ),
});
