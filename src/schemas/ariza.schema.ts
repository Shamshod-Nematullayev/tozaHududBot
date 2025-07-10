import { arizaDocumentTypes } from "@models/Ariza";
import mongoose from "mongoose";
import z from "zod";

export const getArizalarQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortField: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),

  document_type: z.enum(arizaDocumentTypes).optional(),
  document_number: z.number().optional(),
  account_number: z.string().optional(),
  dublicat_account_number: z.string().optional(),

  created_from_date: z.coerce.date().optional(),
  created_to_date: z.coerce.date().optional(),
  act_from_date: z.coerce.date().optional(),
  act_to_date: z.coerce.date().optional(),

  act_amount_from: z.coerce.number().optional(),
  act_amount_to: z.coerce.number().optional(),

  ariza_status: z.string().optional(),
  act_status: z.string().optional(),
});

const accountNumberRegex = [
  /^\d{12}$/,
  "uzunligi 12 ta raqamdan iborat matn bo'lishi kerak",
] as const;

export const createArizaBodySchema = z
  .object({
    document_type: z.enum(arizaDocumentTypes),
    account_number: z.string().regex(...accountNumberRegex),
    document_number: z.number(),
    dublicat_account_number: z
      .string()
      .regex(...accountNumberRegex)
      .optional(),
    total: z.number(),
    current_prescribed_cnt: z.number().optional(),
    next_prescribed_cnt: z.number().optional(),
    comment: z.string().optional(),
    photos: z.array(z.string()).optional(),
    akt_summasi: z.object({
      total: z.number(),
      withQQSTotal: z.number(),
      withoutQQSTotal: z.number(),
    }),
    recalculationPeriods: z.array(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        withQQSTotal: z.number(),
        withoutQQSTotal: z.number(),
        total: z.number(),
      })
    ),
    muzlatiladi: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.document_type === "viza" && data.akt_summasi.total === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["akt_summasi", "total"],
        message: "Viza arizalariga akt summasi kiritish majburiy!",
      });
    }

    if (data.document_type === "dvaynik" && !data.dublicat_account_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ikkilamchi_licshet"],
        message: "Dvaynik arizalariga ikkilamchi licshet kiritish majburiy!",
      });
    }

    if (
      (data.document_type === "odam_soni" || data.document_type === "death") &&
      !data.current_prescribed_cnt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["current_prescribed_cnt"],
        message:
          "Odamlar soni, O'lim guvohnomasi arizalariga odamlar soni kiritish majburiy!",
      });
    }
  });

export const cancelArizaByIdSchema = z.object({
  _id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  }),
  canceling_description: z.string(),
});
