const PDFMerger = require("pdf-merger-js");
const { tozaMakonApi, createTozaMakonApi } = require("../../api/tozaMakon");
const { Abonent } = require("../../models/Abonent");
const { Counter } = require("../../models/Counter");
const { IncomingDocument } = require("../../models/IncomingDocument");
const { Ariza } = require("../../models/Ariza");
const { bot, Company } = require("../../requires");
const FormData = require("form-data");
const { default: axios } = require("axios");
const { PDFDocument } = require("pdf-lib");
const { kirillga } = require("../../middlewares/smallFunctions/lotinKiril");
const { Mahalla } = require("../../models/Mahalla");
const { packNames, packTypes } = require("../../intervals/createAktPack");
const Excel = require("exceljs");
const {
  uploadFileToTozaMakon,
  getOrCreateActPackId,
  calculateKSaldo,
  createAct,
  deleteActById,
  getFileAsBuffer,
} = require("../../services/billing.service");

module.exports.downloadFileFromBilling = async (req, res) => {
  try {
    // 1. inputlarni olish
    const { file_id } = req.query;
    if (!file_id) {
      return res
        .status(400)
        .json({ ok: false, message: "Fayl ID talab qilinadi." });
    }
    const cleanFileId = file_id.split("*").pop(); // "filaname*fileId" => "fileId"
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);

    // 2. faylni yuklab olish
    const response = await getFileAsBuffer(tozaMakonApi, cleanFileId);

    // 3. Faylni Base64 ga o'tkazish
    const base64Data = Buffer.from(response.data).toString("base64");

    // 4. javob qaytarish
    res.json({
      ok: true,
      file: `data:application/pdf;base64,${base64Data}`,
    });
  } catch (error) {
    console.error("Error downloading file:", error);

    res.status(500).json({
      ok: false,
      message: error.response?.data || error.message || "Internal server error",
    });
  }
};

module.exports.getAbonentDHJByAbonentId = async (req, res) => {
  try {
    const { page = 0, limit = 100 } = req.query;
    const { data } = await tozaMakonApi.get(
      `/billing-service/resident-balances/dhsh`,
      {
        params: {
          residentId: req.params.abonent_id,
          page: page,
          size: limit,
        },
      }
    );

    res.json({
      ok: true,
      message: data.msg,
      rows: data.content,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

module.exports.getAbonentActs = async (req, res) => {
  try {
    const { page = 0, limit = 100 } = req.query;
    const { data } = await tozaMakonApi.get(`/billing-service/acts`, {
      params: {
        residentId: req.params.abonentId,
        page: page,
        size: limit,
      },
    });
    res.json({
      ok: true,
      rows: data.content,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

module.exports.createResidentAct = async (req, res) => {
  try {
    const {
      next_inhabitant_count,
      akt_sum,
      licshet,
      amountWithoutQQS,
      document_type,
      description,
      ariza_id,
      photos,
    } = req.body;

    const companyId = req.user.companyId;
    const date = new Date();

    // Validate
    if (
      [next_inhabitant_count, akt_sum, amountWithoutQQS].some(isNaN) &&
      document_type !== "viza"
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "[next_inhabitant_count, akt_sum, amountWithoutQQS] fields are not valid",
      });
    }

    const abonent = await Abonent.findOne({ licshet, companyId });
    if (!abonent) {
      return res.status(404).json({
        ok: false,
        message: "Abonent topilmadi",
      });
    }

    // 🖼️ 1. Agar rasm bo‘lsa — PDFga qo‘shamiz
    if (photos?.length > 0) {
      const pdfDoc = await PDFDocument.create();
      for (let file_id of photos) {
        const file = await bot.telegram.getFile(file_id);
        const photoUrl = await bot.telegram.getFileLink(file.file_id);
        const response = await axios.get(photoUrl, {
          responseType: "arraybuffer",
        });
        const image = await pdfDoc.embedPng(response.data);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      // PDFni merge qilamiz
      const merger = new PDFMerger();
      await merger.add(req.file.buffer); // original akt
      await merger.add(Buffer.from(await pdfDoc.save())); // rasmli PDF
      req.file.buffer = await merger.saveAsBuffer();
    }

    // 📎 2. Faylni Telegramga yuklaymiz
    const telegramDoc = await bot.telegram.sendDocument(
      process.env.TEST_BASE_CHANNEL_ID,
      {
        source: req.file.buffer,
        filename: req.file.originalname,
      }
    );

    // 📄 3. Incoming Document yaratish
    let counter = await Counter.findOne({
      name: "incoming_document_number",
      companyId,
    });
    await IncomingDocument.create({
      abonent: licshet,
      doc_type: document_type,
      file_id: telegramDoc.document.file_id,
      file_name: req.file.originalname,
      comment: description,
      date: Date.now(),
      doc_num: counter.value + 1,
      companyId,
    });
    await counter.updateOne({
      $set: {
        value: counter.value + 1,
        last_update: Date.now(),
      },
    });

    // 📤 4. Faylni TozaMakon APIga yuklash
    const tozaMakonApi =
      require("../api/tozaMakon").createTozaMakonApi(companyId);
    const fileId = await uploadFileToTozaMakon(
      tozaMakonApi,
      req.file.buffer,
      req.file.originalname
    );

    // 📦 5. Akt Pachkasini olish
    const actPackId = await getOrCreateActPackId(
      document_type,
      tozaMakonApi,
      companyId
    );

    // 📊 6. kSaldo hisoblash
    const kSaldo = await calculateKSaldo(tozaMakonApi, {
      amount: Math.abs(akt_sum),
      residentId: abonent.id,
      actPackId,
      actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
    });

    const inhabitantCounts =
      next_inhabitant_count && "undefined" !== next_inhabitant_count
        ? { inhabitantCount: next_inhabitant_count }
        : {};

    // 📌 7. Aktni yaratish
    const aktPayload = {
      actPackId,
      actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
      amount: Number(akt_sum),
      amountWithQQS: Number(akt_sum) - (Number(amountWithoutQQS) || 0),
      amountWithoutQQS: Number(amountWithoutQQS) || 0,
      description,
      endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
      startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
      fileId,
      kSaldo,
      residentId: abonent.id,
      ...inhabitantCounts,
    };

    const aktResponse = await createAct(tozaMakonApi, aktPayload);

    // Agar ariza bo'lsa akt ma'lumotlari yozib qolinadi
    if (ariza_id) {
      const { Ariza } = require("../models/Ariza");
      await Ariza.findByIdAndUpdate(ariza_id, {
        $set: {
          status: "akt_kiritilgan",
          akt_pachka_id: aktResponse.actPackId,
          akt_id: aktResponse.id,
          aktInfo: aktResponse,
          akt_date: aktResponse.createdAt,
        },
      });
    }

    return res.json({ ok: true, message: "Akt muvaffaqqiyatli qo‘shildi" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports.duplicateActFromRequest = async (req, res) => {
  try {
    const { ariza_id, akt_sum } = req.body;
    const { Ariza } = require("../models/Ariza");
    const ariza = await Ariza.findById(ariza_id);

    if (!ariza) {
      return res.status(404).json({ ok: false, message: "Ariza topilmadi" });
    }

    const { Abonent } = require("../models/Abonent");
    const companyId = req.user.companyId;

    const abonentReal = await Abonent.findOne({
      licshet: ariza.licshet,
      companyId,
    });
    const abonentFake = await Abonent.findOne({
      licshet: ariza.ikkilamchi_licshet,
      companyId,
    });

    const tozaMakonApi =
      require("../api/tozaMakon").createTozaMakonApi(companyId);

    // 1. Faylni TozaMakon APIga yuklash
    const fileId = await uploadFileToTozaMakon(
      tozaMakonApi,
      req.file.buffer,
      req.file.originalname
    );

    // 2. Akt pachkalarini olish
    const pulKuchirishPackId = await getOrCreateActPackId(
      "pul_kuchirish",
      tozaMakonApi,
      companyId
    );
    const dvaynikPackId = await getOrCreateActPackId(
      "dvaynik",
      tozaMakonApi,
      companyId
    );

    // 3. Pul ko‘chirish aktlarini yaratish
    if (Number(akt_sum))
      await transferAmountBetweenAccounts({
        tozaMakonApi,
        amount: Number(akt_sum),
        residentFrom: abonentFake.id,
        residentTo: abonentReal.id,
        actPackId: pulKuchirishPackId,
        fileId,
        descriptionPrefix: `${abonentFake.licshet} → ${abonentReal.licshet}`,
      });

    // 4. Dvaynikni yopish
    const amountObj = await calculateAmount(tozaMakonApi, {
      actPackId: dvaynikPackId,
      residentId: abonentFake.id,
      inhabitantCount: 0,
      kSaldo: 0,
    });

    const dvaynikAct = await createAct(tozaMakonApi, {
      actPackId: dvaynikPackId,
      actType: "CREDIT",
      amount: Number(amountObj.amount) + Number(akt_sum),
      amountWithQQS: 0,
      amountWithoutQQS: Number(amountObj.amount) + Number(akt_sum),
      description: "ikkilamchi hisob raqamini o'chirish",
      endPeriod: `${new Date().getMonth() + 1}.${new Date().getFullYear()}`,
      startPeriod: `${new Date().getMonth() + 1}.${new Date().getFullYear()}`,
      fileId,
      kSaldo: 0,
      residentId: abonentFake.id,
      inhabitantCount: 0,
    });

    // 5. Arizani yangilash
    await ariza.updateOne({
      $set: {
        status: "akt_kiritilgan",
        akt_pachka_id: dvaynikPackId,
        akt_id: dvaynikAct.id,
        aktInfo: dvaynikAct,
        akt_date: new Date(),
      },
    });

    res.json({ ok: true, message: "Aktlar muvaffaqiyatli yaratildi" });
  } catch (err) {
    console.error("Xato:", err.message);
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports.getActiveMfy = async (req, res) => {
  try {
    const data = await Mahalla.find({
      reja: { $gt: 0 },
      companyId: req.user.companyId,
    });
    const mahallalar = data.map((mfy) => {
      return { id: mfy.id, name: mfy.name, printed: mfy.abarotka_berildi };
    });
    mahallalar.sort((a, b) => a.name.localeCompare(b.name));
    mahallalar.sort((a, b) => parseInt(a.printed) - parseInt(b.printed));
    res.json({ ok: true, data: mahallalar });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

module.exports.createDublicateAct = async (req, res) => {
  try {
    const { realAccountNumber, fakeAccountNumber, fakeAccountIncomeAmount } =
      req.body;
    const date = new Date();
    const abonentReal = await Abonent.findOne({ licshet: realAccountNumber });
    const abonentFake = await Abonent.findOne({ licshet: fakeAccountNumber });
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);
    const fileUploadResponse = await tozaMakonApi.post(
      "/file-service/buckets/upload?folderType=SPECIFIC_ACT",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    if (fakeAccountIncomeAmount > 0) {
      const calculateKSaldo = (
        await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
          params: {
            amount: Math.abs(fakeAccountIncomeAmount),
            residentId: abonentReal.id,
            actPackId: akt_pachka_id.pul_kuchirish,
            actType: "CREDIT",
          },
        })
      ).data;
      (
        await tozaMakonApi.post("/billing-service/acts", {
          actPackId: akt_pachka_id.pul_kuchirish,
          actType: "CREDIT",
          amount: Math.abs(fakeAccountIncomeAmount),
          amountWithQQS: Math.abs(fakeAccountIncomeAmount),
          amountWithoutQQS: 0,
          description: `${fakeAccountNumber} ikkilamchi hisob raqamidan pul ko'chirish`,
          endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          fileId:
            fileUploadResponse.data.fileName +
            "*" +
            fileUploadResponse.data.fileId,
          kSaldo: calculateKSaldo,
          residentId: abonentReal.id,
        })
      ).data;
      // monay transfer from fake account
      const calculateKSaldo2 = (
        await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
          params: {
            amount: fakeAccountIncomeAmount,
            residentId: abonentFake.id,
            actPackId: akt_pachka_id.pul_kuchirish,
            actType: "DEBIT",
          },
        })
      ).data;
      (
        await tozaMakonApi.post("/billing-service/acts", {
          actPackId: akt_pachka_id.pul_kuchirish,
          actType: "DEBIT",
          amount: fakeAccountIncomeAmount,
          amountWithQQS: fakeAccountIncomeAmount,
          amountWithoutQQS: 0,
          description: `${abonentReal.licshet} haqiqiy hisob raqamiga pul ko'chirish`,
          endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          fileId:
            fileUploadResponse.data.fileName +
            "*" +
            fileUploadResponse.data.fileId,
          kSaldo: calculateKSaldo2,
          residentId: abonentFake.id,
        })
      ).data;
    }
    // ikkilamchi hisob raqamini o'chirish kodlari
    const calculateAmount = (
      await tozaMakonApi.get("/billing-service/acts/calculate-amount", {
        params: {
          actPackId: akt_pachka_id.dvaynik,
          residentId: abonentFake.id,
          inhabitantCount: 0,
          kSaldo: 0,
        },
      })
    ).data;
    const dvaynikAkt = (
      await tozaMakonApi.post("/billing-service/acts", {
        actPackId: akt_pachka_id.dvaynik,
        actType: "CREDIT",
        amount:
          Number(calculateAmount.amount) + Number(fakeAccountIncomeAmount),
        amountWithQQS:
          Number(calculateAmount.amount) + Number(fakeAccountIncomeAmount),
        amountWithoutQQS: 0,
        description: `ikkilamchi hisob raqamini o'chirish`,
        endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        fileId:
          fileUploadResponse.data.fileName +
          "*" +
          fileUploadResponse.data.fileId,
        kSaldo: 0,
        residentId: abonentFake.id,
        inhabitantCount: 0,
      })
    ).data;

    return res.json({
      ok: true,
      message: "muvaffaqqiyatli akt qilindi",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Internal server error 500" });
  }
};

module.exports.sendAbonentsListToTelegram = async (req, res) => {
  try {
    let { minSaldo, maxSaldo, identified, etkStatus, mahalla_name } = req.query;
    const files = req.files;
    const company = await Company.findOne({ id: req.user.companyId });

    if (!files || files.length === 0) {
      return res.status(400).send("Hech qanday fayl yuklanmadi!");
    }

    // Yuklangan fayllarni Telegram media group formatiga o‘tkazish

    const mediaGroup = files.map((file) => ({
      type: "photo",
      media: { source: file.buffer }, // Faylni `buffer` orqali yuboramiz
    }));

    // Media groupni Telegram guruhiga yuborish
    await bot.telegram.sendMediaGroup(
      company.GROUP_ID_NAZORATCHILAR,
      mediaGroup
    );

    await bot.telegram.sendMessage(
      company.GROUP_ID_NAZORATCHILAR,
      generateMessage({
        minSaldo,
        maxSaldo,
        identified,
        etkStatus,
        mahalla_name,
      })
    );

    res.status(200).send("Rasmlar muvaffaqiyatli yuborildi!");
  } catch (error) {
    console.error("Xatolik yuz berdi:", error.message);
    res.status(500).json({
      ok: false,
      message: "Internal server error 500",
    });
  }
};

function generateMessage({
  minSaldo,
  maxSaldo,
  identified,
  etkStatus,
  mahalla_name,
}) {
  let parts = [];
  // 1. Qarz chegarasi
  if (minSaldo && maxSaldo) {
    parts.push(
      `${minSaldo} dan yuqori va ${maxSaldo} dan kam qarzdorligi bo‘lgan`
    );
  } else if (minSaldo) {
    parts.push(`${minSaldo} dan yuqori qarzdorligi bo‘lgan`);
  } else if (maxSaldo) {
    parts.push(`${maxSaldo} dan kam qarzdorligi bo‘lgan`);
  }

  // 2. Shaxsi tasdiqlanmagan
  if (identified === "true") {
    parts.push("shaxsi tasdiqlangan");
  } else if (identified === "false") {
    parts.push("shaxsi tasdiqmalangan");
  }

  // 3. Elektr kodi holati
  if (etkStatus === "true") {
    parts.push("elektr kodi kiritilgan");
  } else if (etkStatus === "false") {
    parts.push("elektr kodi kiritilmagan");
  }
  // 4. Yakuniy matn
  if (parts.length === 0)
    return `${mahalla_name} abonentlar aholi nazoratchisi uchun ro'yxat`;

  return `Ro'yxat: ${mahalla_name} ${parts.join(
    ", "
  )} abonentlar aholi nazoratchisi uchun.`;
}

module.exports.getMfyById = async (req, res) => {
  try {
    const mahalla = await Mahalla.findOne({
      id: req.params.mfy_id,
      companyId: req.user.companyId,
    });
    if (!mahalla) return res.json({ ok: false, message: "MFY not found" });

    const company = await Company.findOne({ id: req.user.companyId });

    res.json({ ok: true, data: mahalla, company });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

module.exports.getAbonentDataByLicshet = async (req, res) => {
  try {
    const abonentData = await Abonent.findOne({
      licshet: req.params.licshet,
      companyId: req.user.companyId,
    });
    if (!abonentData) {
      return res.status(404).json({
        ok: false,
        message: "Abonent mongodbda topilmadi",
      });
    }

    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const data = (
      await tozaMakonApi.get("/user-service/residents/" + abonentData.id)
    ).data;

    if (!data) throw new Error("Toza makondan ma'lumot olishda xatolik");

    res.json({
      ok: true,
      abonentData: data,
    });
  } catch (error) {
    res.json({
      ok: false,
      message: "Internal server error 500 " + error.message,
    });
    console.error(error);
  }
};

module.exports.getActPacks = async (req, res) => {
  try {
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const { data } = await tozaMakonApi.get("/billing-service/act-packs");
    res.json(data.content);
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
  }
};

module.exports.getTariffs = async (req, res) => {
  try {
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const company = await Company.findOne({ id: req.user.companyId });
    const { data } = await tozaMakonApi.get(
      "/billing-service/tariffs/population-tariffs",
      {
        params: {
          page: 0,
          size: 100,
          regionId: company.regionId,
          companyId: company.id,
        },
      }
    );
    res.json({ tariffs: data.content });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
  }
};

async function getAbonentsByMfyId(req, res) {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const { minSaldo, maxSaldo, identified, etkStatus } = req.query;
  let page = 0;
  let totalPages = 1;
  const rows = [];
  const filters = {};
  if (identified) {
    if (identified === "true") {
      filters["shaxsi_tasdiqlandi.confirm"] = true;
    } else if (identified === "false") {
      filters["shaxsi_tasdiqlandi.confirm"] = { $ne: true };
    } else {
      return res.status(400).json({
        ok: false,
        message: "Invalid value identified must be true/false",
      });
    }
  }
  if (etkStatus) {
    if (etkStatus === "true") {
      filters["ekt_kod_tasdiqlandi.confirm"] = true;
    } else if (etkStatus === "false") {
      filters["ekt_kod_tasdiqlandi.confirm"] = { $ne: true };
    } else {
      return res.status(400).json({
        ok: false,
        message: "Invalid value identified must be true/false",
      });
    }
  }
  const abonents = await Abonent.find({
    mahallas_id: req.params.mfy_id,
    companyId: req.user.companyId,
    ...filters,
  }).lean();
  const { data } = await tozaMakonApi.get(
    `/user-service/residents?districtId=47&sort=id,DESC&page=${page}&size=300&companyId=1144&mahallaId=${req.params.mfy_id}`
  );
  rows.push(...data.content);
  totalPages = data.totalPages;
  if (totalPages > 1) {
    for (let i = 1; i < totalPages; i++) {
      const { data } = await tozaMakonApi.get(
        `/user-service/residents?districtId=47&sort=id,DESC&page=${i}&size=300&companyId=1144&mahallaId=${req.params.mfy_id}`
      );
      rows.push(...data.content);
    }
  }
  let filteredData = rows.filter((abonent) => {
    const abonentSaldo = Number(abonent.ksaldo);

    const abonentMongo = abonents.find(
      (a) => a.licshet == abonent.accountNumber
    );

    if (!abonentMongo) return false;

    // Filtrlash uchun shartlarni qo'llash
    const isAboveMinSaldo = minSaldo ? abonentSaldo > Number(minSaldo) : true;
    const isBelowMaxSaldo = maxSaldo ? abonentSaldo < Number(maxSaldo) : true;

    if (abonentMongo.ekt_kod_tasdiqlandi) {
      abonent.isElektrKodConfirmForExcel = abonentMongo.ekt_kod_tasdiqlandi
        .confirm
        ? "✅"
        : "❌";
    }
    if (abonentMongo.shaxsi_tasdiqlandi) {
      abonent.isIdentified = abonentMongo.shaxsi_tasdiqlandi.confirm
        ? "✅"
        : "❌";
    }

    if (abonentMongo.ekt_kod_tasdiqlandi) {
      abonent.isElektrKodConfirm = abonentMongo.ekt_kod_tasdiqlandi.confirm;
    }
    abonent.fullName = kirillga(abonentMongo?.fio || abonent.fullName);
    return isAboveMinSaldo && isBelowMaxSaldo;
  });
  filteredData.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return filteredData;
}

module.exports.getAbonentsByMfyId = async (req, res) => {
  try {
    const data = await getAbonentsByMfyId(req, res);
    res.json({ ok: true, data });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

module.exports.getAbonentsByMfyIdExcel = async (req, res) => {
  try {
    const filteredData = await getAbonentsByMfyId(req, res);
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Abonents");
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Hisob raqam", key: "accountNumber", width: 20 },
      { header: "FIO", key: "fullName", width: 30 },
      { header: "Ko'cha", key: "streetName", width: 15 },
      { header: "Yashovchilar soni", key: "inhabitantCnt", width: 15 },
      { header: "Saldo", key: "ksaldo", width: 15 },
      { header: "Oxirgi to'lov", key: "lastPaymentAmount", width: 15 },
      { header: "", key: "lastPayDate", width: 15 },
      { header: "Shaxsi tasdiqlangan", key: "isIdentified", width: 15 },
      {
        header: "Elektr Kod tasdiqlangan",
        key: "isElektrKodConfirmForExcel",
        width: 15,
      },
    ];
    worksheet.mergeCells("G1:H1");
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0070C0" },
      };
    });
    worksheet.addRows(filteredData);
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=abonents.xlsx");
    res.send(buffer);
    res.json({ ok: true, data: filteredData });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
  }
};

module.exports.transferMoneyBetweenResidents = async (req, res) => {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const createdActs = [];

  try {
    // 1. Kiruvchi ma’lumotlarni ajratib olamiz
    let { debitorAct, creditorActs } = req.body;
    debitorAct = JSON.parse(debitorAct);
    creditorActs = JSON.parse(creditorActs);

    // 2. Faylni yuklab, fileId ni olamiz
    const fileId = await getCommonActFileId(
      tozaMakonApi,
      req.file.buffer,
      req.file.originalname
    );

    // 3. Akt pachkasini tayyorlaymiz
    const actPackId = await getOrCreateActPackId(
      "pul_kuchirish",
      tozaMakonApi,
      req.user.companyId
    );

    // 4. Barcha aktlarni yaratamiz
    const acts = await createMoneyTransferActs({
      tozaMakonApi,
      fileId,
      actPackId,
      debitor: debitorAct,
      creditors: creditorActs,
    });
    createdActs.push(...acts);

    res.json({ ok: true, data: acts });
  } catch (error) {
    for (let act of createdActs) {
      await deleteActById(tozaMakonApi, act.id);
    }
    console.error("Xatolik:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
};

module.exports.getHouses = async (req, res) => {
  try {
    const { cadNum } = req.query;
    if (!cadNum)
      return res.json({ ok: false, message: "cadNum not found on query" });
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const { data } = await tozaMakonApi.get("/billing-service/houses", {
      params: {
        cadNum,
      },
    });
    res.json(data);
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
  }
};

module.exports.getResidents = async (req, res) => {
  try {
    const { cadastralNumber, pnfl } = req.query;
    if (!cadastralNumber && !pnfl)
      return res.json({
        ok: false,
        message: "cadastralNumber or pnfl not found on query",
      });

    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const result = {};
    const resultByCadastralNum = (
      await tozaMakonApi.get("/billing-service/residents", {
        params: {
          cadastralNumber,
          page: 0,
          size: 10,
        },
      })
    ).data.content;

    const resultByPnfl = (
      await tozaMakonApi.get("/billing-service/residents", {
        params: {
          pnfl,
          page: 0,
          size: 10,
        },
      })
    ).data.content;
    result.cadastralNumber = resultByCadastralNum;
    result.pnfl = resultByPnfl;

    res.json(result);
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
  }
};
