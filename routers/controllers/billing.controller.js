const PDFMerger = require("pdf-merger-js");
const { tozaMakonApi } = require("../../api/tozaMakon");
const { Abonent } = require("../../models/Abonent");
const { Counter } = require("../../models/Counter");
const { IncomingDocument } = require("../../models/IncomingDocument");
const { Ariza } = require("../../models/Ariza");
const { bot, Company } = require("../../requires");
const FormData = require("form-data");
const { default: axios } = require("axios");
const { PDFDocument } = require("pdf-lib");
const { kirillga } = require("../../middlewares/smallFunctions/lotinKiril");

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
    const abonent = await Abonent.findOne({ licshet });
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

    let counter = await Counter.findOne({ name: "incoming_document_number" });
    await IncomingDocument.create({
      abonent: licshet,
      doc_type: document_type,
      file_id: documentOnTelegram.document.file_id,
      file_name: req.file.originalname,
      comment: description,
      date: Date.now(),
      doc_num: counter.value + 1,
    });
    await counter.updateOne({
      $set: {
        value: counter.value + 1,
        last_update: Date.now(),
      },
    });

    // akt faylini tozaMakon ga saqlash
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
    console.log(req.user);
    const packIds = (await Company.findOne({ id: req.user.companyId }))
      .akt_pachka_ids;
    if (!isNaN(akt_sum)) {
      const calculateKSaldo = (
        await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
          params: {
            amount: Math.abs(akt_sum),
            residentId: abonent.id,
            actPackId: packIds[document_type].id,
            actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
          },
        })
      ).data;

      const inhabitantCounts =
        next_inhabitant_count && "undefined" != next_inhabitant_count
          ? { inhabitantCount: next_inhabitant_count }
          : {};
      const date = new Date();
      const aktResponse = await tozaMakonApi.post("/billing-service/acts", {
        actPackId: packIds[document_type].id,
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

    const packIds = (await Company.findOne({ id: req.user.companyId }))
      .akt_pachka_ids;
    if (akt_sum > 0) {
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
    const abonents = await Abonent.find({
      mahallas_id: req.params.mfy_id,
    });
    const { minSaldo, maxSaldo, onlyNotIdentited, etkStatus } = req.query;
    let page = 0;
    let totalPages = 1;
    const rows = [];
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
      let shaxsi_tasdiqlanmadi = true;
      if (onlyNotIdentited === "true") {
        shaxsi_tasdiqlanmadi = !Boolean(
          abonentMongo?.shaxsi_tasdiqlandi?.confirm
        );
      }
      let etk = true;
      if (abonentMongo) {
        if (
          etkStatus === "tasdiqlangan" &&
          (!abonentMongo.ekt_kod_tasdiqlandi ||
            !abonentMongo.ekt_kod_tasdiqlandi.confirm)
        ) {
          etk = false;
        } else if (
          etkStatus === "tasdiqlanmagan" &&
          abonentMongo?.ekt_kod_tasdiqlandi?.confirm
        ) {
          etk = false;
        }
      }

      // Filtrlash uchun shartlarni qo'llash
      const isAboveMinSaldo = minSaldo ? abonentSaldo > Number(minSaldo) : true;
      const isBelowMaxSaldo = maxSaldo ? abonentSaldo < Number(maxSaldo) : true;

      return (
        isAboveMinSaldo &&
        isBelowMaxSaldo &&
        shaxsi_tasdiqlanmadi &&
        abonent.accountNumber !== "77777" &&
        etk
      );
    });
    filteredData = filteredData.map((abonent) => {
      let isElektrKodConfirm = false;

      const abonentMongo = abonents.find(
        (a) => a.licshet == abonent.accountNumber
      );
      if (abonentMongo)
        isElektrKodConfirm = abonentMongo.ekt_kod_tasdiqlandi?.confirm;
      return {
        ...abonent,
        isElektrKodConfirm,
        fullName: kirillga(
          abonentMongo?.fio ? abonentMongo.fio : abonent.fullName
        ),
      };
    });
    filteredData.sort((a, b) => a.fullName.localeCompare(b.fullName));
    res.json({ ok: true, data: filteredData });
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
