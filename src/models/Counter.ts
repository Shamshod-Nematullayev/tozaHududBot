import mongoose from "mongoose";
import { arizaDocumentTypes } from "./Ariza.js";
import { Company } from "./Company.js";

interface ICounter {
  value: number;
  name: string;
  last_update: Date;
  arizaDocumentType:
    | "dvaynik"
    | "odam_soni"
    | "viza"
    | "death"
    | "gps"
    | "pul_kuchirish";
  companyId: number;
}

const schema = new mongoose.Schema<ICounter>(
  {
    value: Number,
    name: String,
    last_update: Date,
    arizaDocumentType: {
      type: String,
      enum: arizaDocumentTypes,
    },
    companyId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// auto incement uchun yaratilgan model
// name: counter nomi boshqalaridan ajratib olish uchun
// value: counter qiymati
// last_update: ohirgi marta qachon yangilanganligi
export const Counter = mongoose.model("counter", schema, "counter");

// creating counter for incoming document serial number
(async () => {
  const counterNames = [
    "incoming_document_number",
    "shaxsi_tashdiqlandi_bildirish_xati",
    "sudga_ariza_tartib_raqami",
  ];
  const companies = await Company.find({ active: true });
  companies.forEach((company) => {
    counterNames.forEach((name) => checkAndCreateCounter(name, company.id));
    arizaDocumentTypes.forEach((documentType) =>
      checkAndCreateCounter("ariza_tartib_raqami", company.id, documentType)
    );
  });
  async function checkAndCreateCounter(
    name: string,
    companyId: number,
    documentType?: string
  ) {
    const filters: any = { name, companyId };
    if (documentType) filters.arizaDocumentType = documentType;
    const counter = await Counter.findOne(filters);
    if (!counter) {
      await Counter.create({
        name,
        value: 0,
        companyId,
        arizaDocumentType: documentType,
      });
    }
  }
})();
