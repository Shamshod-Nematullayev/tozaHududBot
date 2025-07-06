// services/billing.service.js

const FormData = require("form-data");
const { PDFMerger } = require("pdf-merger-js");
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");
const { Company } = require("../requires");
const { packNames, packTypes } = require("../intervals/createAktPack");

// Sana formatlash yordamchi funksiyasi
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Akt pachkasi mavjud bo‘lmasa yaratadi va qaytaradi
 */
async function getOrCreateActPackId(documentType, tozaMakonApi, companyId) {
  const date = new Date();
  const company = await Company.findOne({ id: companyId });
  const packIds = company.akt_pachka_ids || {};
  let actPack = packIds[documentType];

  const isSameMonthYear =
    actPack &&
    actPack.month === date.getMonth() + 1 &&
    actPack.year === date.getFullYear();

  if (!actPack?.id || !isSameMonthYear) {
    const response = await tozaMakonApi.post("/billing-service/act-packs", {
      companyId,
      createdDate: formatDate(date),
      description: "created by service",
      isActive: true,
      isSpecialPack: false,
      name: actPack?.name || packNames[documentType],
      packType: actPack?.type || packTypes[documentType],
    });

    const packId = response.data;

    await Company.findOneAndUpdate(
      { id: companyId },
      {
        $set: {
          [`akt_pachka_ids.${documentType}`]: {
            id: packId,
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            type: actPack?.type || packTypes[documentType],
            name: actPack?.name || packNames[documentType],
          },
        },
      }
    );

    return packId;
  }

  return actPack.id;
}

/**
 * Faylni TozaMakon APIga yuklaydi va fileId qaytaradi
 */
async function uploadFileToTozaMakon(tozaMakonApi, buffer, filename) {
  const formData = new FormData();
  formData.append("file", buffer, filename);

  const res = await tozaMakonApi.post(
    "/file-service/buckets/upload?folderType=SPECIFIC_ACT",
    formData,
    {
      headers: formData.getHeaders(),
    }
  );

  return res.data.fileName + "*" + res.data.fileId;
}

/**
 * Akt uchun kSaldo hisoblash
 */
async function calculateKSaldo(tozaMakonApi, params) {
  return (
    await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
      params,
    })
  ).data;
}

/**
 * Akt uchun amount hisoblash (ya'ni avtomatik narx)
 */
async function calculateAmount(tozaMakonApi, params) {
  return (
    await tozaMakonApi.get("/billing-service/acts/calculate-amount", {
      params,
    })
  ).data;
}

/**
 * Akt yaratish
 */
async function createAct(tozaMakonApi, payload) {
  return (await tozaMakonApi.post("/billing-service/acts", payload)).data;
}

async function transferAmountBetweenAccounts({
  tozaMakonApi,
  amount,
  residentFrom,
  residentTo,
  actPackId,
  fileId,
  descriptionPrefix = "",
}) {
  const date = new Date();

  // DEBIT akt (soxta hisobdan pul chiqarish)
  const debitKSaldo = await calculateKSaldo(tozaMakonApi, {
    amount,
    residentId: residentFrom,
    actPackId,
    actType: "DEBIT",
  });

  await createAct(tozaMakonApi, {
    actPackId,
    actType: "DEBIT",
    amount,
    amountWithQQS: 0,
    amountWithoutQQS: amount,
    description: `${descriptionPrefix}dan pul chiqarish`,
    endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    fileId,
    kSaldo: debitKSaldo,
    residentId: residentFrom,
  });

  // CREDIT akt (asosiy hisobga pul kirim qilish)
  const creditKSaldo = await calculateKSaldo(tozaMakonApi, {
    amount,
    residentId: residentTo,
    actPackId,
    actType: "CREDIT",
  });

  await createAct(tozaMakonApi, {
    actPackId,
    actType: "CREDIT",
    amount,
    amountWithQQS: 0,
    amountWithoutQQS: amount,
    description: `${descriptionPrefix}ga pul kirim qilish`,
    endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    fileId,
    kSaldo: creditKSaldo,
    residentId: residentTo,
  });
}

async function createMoneyTransferActs({
  tozaMakonApi,
  fileId,
  actPackId,
  debitor,
  creditors,
}) {
  const date = new Date();
  const createdActs = [];

  // Debitor akt
  const debitKSaldo = await calculateKSaldo(tozaMakonApi, {
    amount: debitor.amount,
    residentId: debitor.residentId,
    actPackId,
    actType: "DEBIT",
  });

  const debitAct = await createAct(tozaMakonApi, {
    actPackId,
    actType: "DEBIT",
    amount: debitor.amount,
    amountWithQQS: debitor.amount,
    amountWithoutQQS: 0,
    kSaldo: debitKSaldo,
    description: `pul ko'chirish ${creditors
      .map((a) => a.accountNumber)
      .join(", ")}larga ${debitor.amount} so'm`,
    fileId,
    endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    residentId: debitor.residentId,
  });

  createdActs.push(debitAct);

  for (const creditor of creditors) {
    const creditKSaldo = await calculateKSaldo(tozaMakonApi, {
      amount: creditor.amount,
      residentId: creditor.residentId,
      actPackId,
      actType: "CREDIT",
    });

    const creditAct = await createAct(tozaMakonApi, {
      actPackId,
      actType: "CREDIT",
      amount: creditor.amount,
      amountWithQQS: creditor.amount,
      amountWithoutQQS: 0,
      kSaldo: creditKSaldo,
      description: `pul ko'chirish ${debitor.accountNumber} dan ${creditor.amount} so'm`,
      fileId,
      endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
      startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
      residentId: creditor.residentId,
    });

    createdActs.push(creditAct);
  }

  return createdActs; // rollback uchun
}

async function deleteActById(tozaMakonApi, actId) {
  return await tozaMakonApi.delete("/billing-service/acts/" + actId);
}

async function getFileAsBuffer(tozaMakonApi, fileId) {
  return (
    await tozaMakonApi.get("/file-service/buckets/download", {
      params: { file: fileId },
      responseType: "arraybuffer",
    })
  ).data;
}

module.exports = {
  formatDate,
  getOrCreateActPackId,
  uploadFileToTozaMakon,
  calculateKSaldo,
  calculateAmount,
  createAct,
  transferAmountBetweenAccounts,
  createMoneyTransferActs,
  deleteActById,
  getFileAsBuffer,
};
