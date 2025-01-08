const { uploadAsBlob } = require("../middlewares/multer");
const { Mahalla } = require("../models/Mahalla");
const { Ariza } = require("../models/Ariza");
const { Counter } = require("../models/Counter");
const { IncomingDocument } = require("../models/IncomingDocument");
const { bot } = require("../core/bot");
const { Abonent } = require("../requires");
const { tozaMakonApi } = require("../api/tozaMakon");
const FormData = require("form-data");
const { kirillga } = require("../middlewares/smallFunctions/lotinKiril");
const { PDFDocument } = require("pdf-lib");
const PDFMerger = require("pdf-merger-js");
const akt_pachka_id = {
  viza: "4445910",
  odam_soni: "4445915",
  dvaynik: "4445913",
  pul_kuchirish: "4445914",
  death: "4445909",
  gps: "4445917",
  // boshqa: "4444109",
};

const router = require("express").Router();
router.get("/next-incoming-document-number", async (req, res) => {
  const counter = await Counter.findOne({ name: "incoming_document_number" });

  if (!counter)
    return res.json({ ok: false, message: "Internal server error" });
  res.json({ ok: true, value: counter.value + 1 });
});

router.post(
  "/create-full-akt",
  uploadAsBlob.single("file"),
  async (req, res) => {
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
      if (isNaN(next_inhabitant_count) && isNaN(akt_sum)) {
        return res.status(400).json({
          ok: false,
          message: "yashovchi soni yoki akt summasi bo'lishi kerak",
        });
      }
      const abonent = await Abonent.findOne({ licshet });
      if (!abonent)
        return res.status(404).json({
          ok: false,
          message: "Abonent mavjud emas",
        });
      let counter = await Counter.findOne({ name: "incoming_document_number" });

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
        const pdfBuffer = await pdfDoc.save();
        const merger = new PDFMerger();
        merger.add(req.file.buffer);
        merger.add(pdfBuffer);
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
      if (!isNaN(akt_sum)) {
        const calculateKSaldo = (
          await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
            params: {
              amount: Math.abs(akt_sum),
              residentId: abonent.id,
              actPackId: document_type
                ? akt_pachka_id[document_type]
                : akt_pachka_id.boshqa,
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
          actPackId: document_type
            ? akt_pachka_id[document_type]
            : akt_pachka_id.boshqa,
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
  }
);

router.post(
  "/create-dvaynik-akt-by-ariza",
  uploadAsBlob.single("file"),
  async (req, res) => {
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

      if (akt_sum > 0) {
        // monay transfer to real account
        const calculateKSaldo = (
          await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
            params: {
              amount: Math.abs(akt_sum),
              residentId: abonent.id,
              actPackId: akt_pachka_id.pul_kuchirish,
              actType: "CREDIT",
            },
          })
        ).data;
        (
          await tozaMakonApi.post("/billing-service/acts", {
            actPackId: akt_pachka_id.pul_kuchirish,
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
              actPackId: akt_pachka_id.pul_kuchirish,
              actType: "DEBIT",
            },
          })
        ).data;
        (
          await tozaMakonApi.post("/billing-service/acts", {
            actPackId: akt_pachka_id.pul_kuchirish,
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
            actPackId: akt_pachka_id.dvaynik,
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
          actPackId: akt_pachka_id.dvaynik,
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

      await ariza.updateOne({
        $set: {
          status: "akt_kiritilgan",
          akt_pachka_id: akt_pachka_id.dvaynik,
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
  }
);

router.post(
  "/create-dvaynik-akt",
  uploadAsBlob.single("file"),
  async (req, res) => {
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
  }
);

router.get(`/get-abonent-dxj-by-id/:abonent_id`, async (req, res) => {
  try {
    const { data } = await tozaMakonApi.get(
      `/billing-service/resident-balances/dhsh?residentId=${req.params.abonent_id}&page=0&size=100`
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
});
router.get(`/get-abonent-dxj-by-licshet/:licshet`, async (req, res) => {
  try {
    const abonent = await Abonent.findOne({ licshet: req.params.licshet });
    const { data } = await tozaMakonApi.get(
      `/billing-service/resident-balances/dhsh?residentId=${abonent.id}&page=0&size=100`
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
});
router.get("/get-abonent-data-by-licshet/:licshet", async (req, res) => {
  try {
    // const abonentData = await getAbonentDataByLicshet({
    //   licshet: req.params.licshet,
    // });
    const abonentData = await Abonent.findOne({ licshet: req.params.licshet });
    if (!abonentData) {
      return res.status(404).json({
        ok: false,
        message: "Abonent mongodbda mavjud emas",
      });
    }

    const response = await tozaMakonApi.get(
      "/user-service/residents/" + abonentData.id
    );
    if (response.status !== 200) {
      return response.json({
        ok: false,
        message: "Abonent dastlabki ma'lumotlarini oliishda xatolik",
      });
    }
    res.json({
      ok: true,
      abonentData: response.data,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

const uchirilishiKerakBulganAbonentlar = [105120350731];
router.get("/get-abonents-by-mfy-id/:mfy_id", async (req, res) => {
  try {
    const abonents = await Abonent.find({ mahallas_id: req.params.mfy_id });
    const { minSaldo, maxSaldo } = req.query;
    let page = 0;
    let totalPages = 1;
    const rows = [];
    const { data } = await tozaMakonApi.get(
      `/user-service/residents?districtId=47&sort=id,DESC&page=${page}&size=400&companyId=1144&mahallaId=${req.params.mfy_id}`
    );
    rows.push(...data.content);
    totalPages = data.totalPages;
    if (totalPages > 1) {
      for (let i = 1; i < totalPages; i++) {
        const { data } = await tozaMakonApi.get(
          `/user-service/residents?districtId=47&sort=id,DESC&page=${i}&size=400&companyId=1144&mahallaId=${req.params.mfy_id}`
        );
        rows.push(...data.content);
      }
    }
    let filteredData = rows.filter((abonent) => {
      const abonentSaldo = Number(abonent.ksaldo);

      // Abonentlar ro'yxatidan chiqarilgan bo'lmaganini tekshirish
      const isNotExcluded = !uchirilishiKerakBulganAbonentlar.includes(
        Number(abonent.licshet)
      );

      // Filtrlash uchun shartlarni qo'llash
      const isAboveMinSaldo = minSaldo ? abonentSaldo > Number(minSaldo) : true;
      const isBelowMaxSaldo = maxSaldo ? abonentSaldo < Number(maxSaldo) : true;

      return isNotExcluded && isAboveMinSaldo && isBelowMaxSaldo;
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
        fullName: kirillga(abonent.fullName),
      };
    });
    filteredData.sort((a, b) => a.fullName.localeCompare(b.fullName));
    res.json({ ok: true, data: filteredData });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

router.get("/get-all-active-mfy", async (req, res) => {
  try {
    const data = await Mahalla.find({ reja: { $gt: 0 } });
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
});

router.put("/abarotka-berildi/:mfy_id", async (req, res) => {
  try {
    console.log(req.params.mfy_id);
    const result = await Mahalla.updateOne(
      { id: req.params.mfy_id },
      { $set: { abarotka_berildi: true } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({ ok: false, message: "Mahalla topilmadi" });
    }
    res.json({ ok: true, message: "Updated" });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.put("/abarotka-berilmadi/:mfy_id", async (req, res) => {
  try {
    const result = await Mahalla.updateOne(
      { id: req.params.mfy_id },
      { $set: { abarotka_berildi: false } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({ ok: false, message: "Mahalla topilmadi" });
    }
    res.json({ ok: true, message: "Updated" });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.put("/barchasiga-abarotka-berilmadi", async (req, res) => {
  try {
    await Mahalla.updateMany(
      { reja: { $gt: 0 } },
      { $set: { abarotka_berildi: false } }
    );
    res.json({ ok: true, message: "Updated" });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.post(
  "/send-abonents-list-to-telegram/",
  uploadAsBlob.any(),
  async (req, res) => {
    try {
      const { minSaldo, maxSaldo, mahalla_id, mahalla_name } = req.query;
      const files = req.files;

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
        process.env.NAZORATCHILAR_GURUPPASI,
        mediaGroup
      );
      await bot.telegram.sendMessage(
        process.env.NAZORATCHILAR_GURUPPASI,
        `${mahalla_name} ${minSaldo ? minSaldo + " dan yuqori" : ""} ${
          maxSaldo ? maxSaldo + " dan past" : ""
        } qarzdorligi mavjud abonentlar ro'yxati biriktirilgan aholi nazoratchisi uchun`
      );

      res.status(200).send("Rasmlar muvaffaqiyatli yuborildi!");
    } catch (error) {
      console.error("Xatolik yuz berdi:", error.message);
      res.status(500).json({
        ok: false,
        message: "Internal server error 500",
      });
    }
  }
);

router.post(
  "/send-abonents-list-to-telegram-as-pdf",
  uploadAsBlob.single("file"),
  (req, res) => {
    try {
      // TODO: PDF yaratish
      bot.telegram.sendDocument(process.env.ME, { source: req.file.buffer });
    } catch (error) {
      console.error("Xatolik yuz berdi:", error.message);
      res.status(500).json({
        ok: false,
        message: "Internal server error 500",
      });
    }
  }
);

router.get("/get-mfy-by-id/:mfy_id", async (req, res) => {
  try {
    const mahalla = await Mahalla.findOne({ id: req.params.mfy_id });
    if (!mahalla) return res.json({ ok: false, message: "MFY not found" });

    res.json({ ok: true, data: mahalla });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

module.exports = router;
