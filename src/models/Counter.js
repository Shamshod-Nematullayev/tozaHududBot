import mongoose from "mongoose";
import { arizaDocumentTypes } from "./Ariza";
import { Company } from "./Company";

const schema = new mongoose.Schema(
  {
    value: Number,
    name: String,
    last_update: Date,
    arizaDocumentType: String,
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
  async function checkAndCreateCounter(name, companyId, documentType) {
    const filters = { name, companyId };
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
