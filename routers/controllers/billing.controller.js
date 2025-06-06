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
const { Act } = require("../../models/Act");
const { User } = require("../../models/User");
// small functions
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

module.exports.downloadFileFromBilling = async (req, res) => {
  try {
    const { file_id } = req.query;
    if (!file_id) {
      return res
        .status(400)
        .json({ ok: false, message: "Fayl ID talab qilinadi." });
    }

    const cleanFileId = file_id.split("*").pop(); // Oxirgi qismni olish

    const response = await tozaMakonApi.get("/file-service/buckets/download", {
      params: { file: cleanFileId },
      responseType: "arraybuffer",
    });
    // Faylni Base64 ga o'tkazish
    const base64Data = Buffer.from(response.data).toString("base64");
    const contentType = "application/pdf";

    res.json({
      ok: true,
      file: `data:${contentType};base64,${base64Data}`,
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

module.exports.createFullAct = async (req, res) => {
  try {
    // initial values
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

    // validate
    if (
      [next_inhabitant_count, akt_sum, amountWithoutQQS].some(isNaN) &&
      document_type !== "viza"
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "[next_inhabitant_count, akt_sum, amountWithoutQQS] fields are not valid",
      });
    } else if (
      document_type == "viza" &&
      [akt_sum, amountWithoutQQS].some(isNaN)
    ) {
      return res.status(400).json({
        ok: false,
        message: "[akt_sum, amountWithoutQQS] fields are not valid",
      });
    }
    const abonent = await Abonent.findOne({ licshet, companyId });
    if (!abonent)
      return res.status(404).json({
        ok: false,
        message: "Abonent mavjud emas",
      });

    if (photos?.length > 0) {
      // endi pdf va rasmlarni birlashtirish kodi kerak
      const photosBuffer = [];
      for (let file_id of photos) {
        const file = await bot.telegram.getFile(file_id);
        const photoBuffer = await bot.telegram.getFileLink(file.file_id);
        const response = await axios.get(photoBuffer, {
          responseType: "arraybuffer",
        });
        photosBuffer.push(response.data);
      }
      const pdfDoc = await PDFDocument.create();
      for (let photoBuffer of photosBuffer) {
        const image = await pdfDoc.embedPng(photoBuffer);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
      let pdfBuffer = await pdfDoc.save();
      const merger = new PDFMerger();
      await merger.add(req.file.buffer);
      pdfBuffer = Buffer.from(pdfBuffer);
      await merger.add(pdfBuffer);
      const bufferAktFile = await merger.saveAsBuffer();
      req.file.buffer = bufferAktFile;
    }
    // akt faylini telegram bazaga saqlash
    const documentOnTelegram = await bot.telegram.sendDocument(
      process.env.TEST_BASE_CHANNEL_ID,
      {
        source: req.file.buffer,
        filename: req.file.originalname,
      }
    );

    let counter = await Counter.findOne({
      name: "incoming_document_number",
      companyId,
    });
    await IncomingDocument.create({
      abonent: licshet,
      doc_type: document_type,
      file_id: documentOnTelegram.document.file_id,
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

    // akt faylini tozaMakon ga saqlash
    const tozaMakonApi = createTozaMakonApi(companyId);
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
    const packIds =
      (await Company.findOne({ id: companyId })).akt_pachka_ids || {};
    let actPackId = packIds[document_type]?.id;
    if (
      !actPackId ||
      packIds[document_type].month != date.getMonth() + 1 ||
      packIds[document_type].year != date.getFullYear()
    ) {
      // akt pachkasi yo'q bo'lsa
      const packId = (
        await tozaMakonApi.post("/billing-service/act-packs", {
          companyId,
          createdDate: formatDate(new Date()),
          description: `added by th-dashboard`,
          isActive: true,
          isSpecialPack: false,
          name: packIds[document_type]?.name || packNames[document_type],
          packType: packIds[document_type]?.type || packTypes[document_type],
        })
      ).data;
      await Company.findOneAndUpdate(
        { id: companyId },
        {
          $set: {
            [`akt_pachka_ids.${document_type}.id`]: packId,
            [`akt_pachka_ids.${document_type}.month`]:
              new Date().getMonth() + 1,
            [`akt_pachka_ids.${document_type}.year`]: new Date().getFullYear(),
            [`akt_pachka_ids.${document_type}.type`]:
              packIds[document_type]?.type || packTypes[document_type],
          },
        }
      );
      actPackId = packId;
    }
    if (!isNaN(akt_sum)) {
      const calculateKSaldo = (
        await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
          params: {
            amount: Math.abs(akt_sum),
            residentId: abonent.id,
            actPackId: actPackId,
            actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
          },
        })
      ).data;

      const inhabitantCounts =
        next_inhabitant_count && "undefined" != next_inhabitant_count
          ? { inhabitantCount: next_inhabitant_count }
          : {};
      const aktResponse = await tozaMakonApi.post("/billing-service/acts", {
        actPackId: actPackId,
        actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
        amount: Number(akt_sum),
        amountWithQQS: Number(akt_sum) - (Number(amountWithoutQQS) || 0),
        amountWithoutQQS: Number(amountWithoutQQS) || 0,
        description,
        endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        fileId:
          fileUploadResponse.data.fileName +
          "*" +
          fileUploadResponse.data.fileId,
        kSaldo: calculateKSaldo,
        residentId: abonent.id,
        ...inhabitantCounts,
      });

      if (aktResponse.status !== 201) {
        console.error(
          "Billing tizimiga akt kiritib bo'lmadi",
          aktResponse.data
        );
        return res.status(500).json({
          ok: false,
          message: "Billing tizimiga akt kiritib bo'lmadi",
        });
      }
      if (ariza_id) {
        const ariza = await Ariza.findByIdAndUpdate(ariza_id, {
          $set: {
            status: "akt_kiritilgan",
            akt_pachka_id: aktResponse.data.actPackId,
            akt_id: aktResponse.data.id,
            aktInfo: {
              ...aktResponse.data,
            },
            akt_date: aktResponse.data.createdAt,
          },
        });
      }
      return res.json({
        ok: true,
        message: "Akt muvaffaqqiyatli qo'shildi",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Internal server error 500" });
  }
};

module.exports.createDublicateActByAriza = async (req, res) => {
  try {
    const { ariza_id, akt_sum } = req.body;
    const ariza = await Ariza.findById(ariza_id);
    const abonent = await Abonent.findOne({ licshet: ariza.licshet });
    const fake_account = await Abonent.findOne({
      licshet: ariza.ikkilamchi_licshet,
    });
    const date = new Date();
    // upload file to billing service
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

    const document_type = ariza.document_type;
    let packIds =
      (await Company.findOne({ id: req.user.companyId })).akt_pachka_ids || {};
    let actPackId = packIds[document_type]?.id;
    if (
      !actPackId ||
      packIds[document_type].month != date.getMonth() + 1 ||
      packIds[document_type].year != date.getFullYear()
    ) {
      // akt pachkasi yo'q bo'lsa
      const packId = (
        await tozaMakonApi.post("/billing-service/act-packs", {
          companyId: req.user.companyId,
          createdDate: formatDate(new Date()),
          description: `added by th-dashboard`,
          isActive: true,
          isSpecialPack: false,
          name: packIds[document_type]?.name || packNames[document_type],
          packType: packIds[document_type]?.type || packTypes[document_type],
        })
      ).data;
      await Company.findOneAndUpdate(
        { id: req.user.companyId },
        {
          $set: {
            [`akt_pachka_ids.${document_type}.id`]: packId,
            [`akt_pachka_ids.${document_type}.month`]:
              new Date().getMonth() + 1,
            [`akt_pachka_ids.${document_type}.year`]: new Date().getFullYear(),
            [`akt_pachka_ids.${document_type}.type`]:
              packIds[document_type]?.type || packTypes[document_type],
          },
        }
      );
      packIds[document_type] = {
        id: packId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        type: packIds[document_type]?.type || packTypes[document_type],
        name: packIds[document_type]?.name || packNames[document_type],
      };
      actPackId = packId;
    }
    if (akt_sum > 0) {
      let actPackId = packIds.pul_kuchirish?.id;
      if (
        !actPackId ||
        packIds.pul_kuchirish.month != date.getMonth() + 1 ||
        packIds.pul_kuchirish.year != date.getFullYear()
      ) {
        // akt pachkasi yo'q bo'lsa
        const packId = (
          await tozaMakonApi.post("/billing-service/act-packs", {
            companyId: req.user.companyId,
            createdDate: formatDate(new Date()),
            description: `added by th-dashboard`,
            isActive: true,
            isSpecialPack: false,
            name: packIds.pul_kuchirish?.name || packNames.pul_kuchirish,
            packType: packIds.pul_kuchirish?.type || packTypes.pul_kuchirish,
          })
        ).data;
        await Company.findOneAndUpdate(
          { id: req.user.companyId },
          {
            $set: {
              [`akt_pachka_ids.pul_kuchirish.id`]: packId,
              [`akt_pachka_ids.pul_kuchirish.month`]: new Date().getMonth() + 1,
              [`akt_pachka_ids.pul_kuchirish.year`]: new Date().getFullYear(),
              [`akt_pachka_ids.pul_kuchirish.type`]:
                packIds.pul_kuchirish?.type || packTypes.pul_kuchirish,
            },
          }
        );
        packIds.pul_kuchirish = {
          id: packId,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          type: packIds.pul_kuchirish?.type || packTypes.pul_kuchirish,
          name: packIds.pul_kuchirish?.name || packNames.pul_kuchirish,
        };
        actPackId = packId;
      }
      // monay transfer to real account
      const calculateKSaldo = (
        await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
          params: {
            amount: Math.abs(akt_sum),
            residentId: abonent.id,
            actPackId: packIds.pul_kuchirish.id,
            actType: "CREDIT",
          },
        })
      ).data;
      (
        await tozaMakonApi.post("/billing-service/acts", {
          actPackId: packIds.pul_kuchirish.id,
          actType: "CREDIT",
          amount: Math.abs(akt_sum),
          amountWithQQS: 0,
          amountWithoutQQS: Math.abs(akt_sum),
          description: `${ariza.ikkilamchi_licshet} ikkilamchi hisob raqamidan pul ko'chirish`,
          endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          fileId:
            fileUploadResponse.data.fileName +
            "*" +
            fileUploadResponse.data.fileId,
          kSaldo: calculateKSaldo,
          residentId: abonent.id,
        })
      ).data;
      // monay transfer from fake account
      const calculateKSaldo2 = (
        await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
          params: {
            amount: Math.abs(akt_sum),
            residentId: abonent.id,
            actPackId: packIds.pul_kuchirish.id,
            actType: "DEBIT",
          },
        })
      ).data;
      (
        await tozaMakonApi.post("/billing-service/acts", {
          actPackId: packIds.pul_kuchirish.id,
          actType: "DEBIT",
          amount: akt_sum,
          amountWithQQS: 0,
          amountWithoutQQS: akt_sum,
          description: `${fake_account.licshet} haqiqiy hisob raqamiga pul ko'chirish`,
          endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          fileId:
            fileUploadResponse.data.fileName +
            "*" +
            fileUploadResponse.data.fileId,
          kSaldo: calculateKSaldo2,
          residentId: fake_account.id,
        })
      ).data;
    }

    // ikkilamchi hisob raqamini o'chirish kodlari
    const calculateAmount = (
      await tozaMakonApi.get("/billing-service/acts/calculate-amount", {
        params: {
          actPackId: packIds.dvaynik.id,
          residentId: fake_account.id,
          inhabitantCount: 0,
          kSaldo: 0,
          // endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          // startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        },
      })
    ).data;
    const dvaynikAkt = (
      await tozaMakonApi.post("/billing-service/acts", {
        actPackId: packIds.dvaynik.id,
        actType: "CREDIT",
        amount: Number(calculateAmount.amount) + Number(akt_sum),
        amountWithQQS: 0,
        amountWithoutQQS: Number(calculateAmount.amount) + Number(akt_sum),
        description: `ikkilamchi hisob raqamini o'chirish`,
        endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        fileId:
          fileUploadResponse.data.fileName +
          "*" +
          fileUploadResponse.data.fileId,
        kSaldo: 0,
        residentId: fake_account.id,
        inhabitantCount: 0,
      })
    ).data;
    if (dvaynikAkt.code) {
      return res.status(500).json({
        ok: false,
        message:
          "Ikkilamchi hisob raqamini o'chirishda xatolik yuz berdi " +
          dvaynikAkt.message,
      });
    }
    await ariza.updateOne({
      $set: {
        status: "akt_kiritilgan",
        akt_pachka_id: packIds.dvaynik.id,
        akt_id: dvaynikAkt.id,
        aktInfo: dvaynikAkt,
        akt_date: new Date(),
      },
    });
    return res.json({
      ok: true,
      message: "muvaffaqqiyatli akt qilindi",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports.getAbonentsByMfyId = async (req, res) => {
  try {
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
        abonent.isElektrKodConfirm = abonentMongo.ekt_kod_tasdiqlandi.confirm;
      }
      abonent.fullName = kirillga(abonentMongo?.fio || abonent.fullName);
      return isAboveMinSaldo && isBelowMaxSaldo;
    });
    filteredData.sort((a, b) => a.fullName.localeCompare(b.fullName));
    res.json({ ok: true, data: filteredData });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
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
