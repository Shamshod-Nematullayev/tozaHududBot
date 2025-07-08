import { NewAbonent, StatusNewAbonent } from "@models/NewAbonents";

import { bot } from "../../bot/core/bot";

import { createTozaMakonApi } from "../../api/tozaMakon";

import { Nazoratchi } from "@models/Nazoratchi";
import { Abonent } from "@models/Abonent";

import { FreeAbonent } from "@models/FreeAbonent";

export const getPendingNewAbonents = async (req, res) => {
  try {
    const { companyId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    console.log(page, limit, skip, companyId, StatusNewAbonent.PENDING);
    const count = await NewAbonent.countDocuments({
      status: StatusNewAbonent.PENDING,
      companyId: companyId,
    });
    const pendingNewAbonents = await NewAbonent.find({
      status: StatusNewAbonent.PENDING,
      companyId: companyId,
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.json({ ok: true, count, pendingNewAbonents });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: "Server error " + error.message });
  }
};

export const getOnePendingNewAbonent = async (req, res) => {
  try {
    const pendingAbonent = await NewAbonent.findOne({
      companyId: req.user.companyId,
      _id: req.params._id,
    });
    if (!pendingAbonent) {
      return res.status(404).json({ ok: false, message: "Abonent not found" });
    }
    res.json({ ok: true, data: pendingAbonent });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: "Server error " + error.message });
  }
};

export const cancelPendingNewAbonent = async (req, res) => {
  try {
    const { _id } = req.params;
    const { companyId } = req.user;
    const { description } = req.body;
    if (!description) {
      return res
        .status(400)
        .json({ ok: false, message: "Description is required" });
    }
    const pendingAbonent = await NewAbonent.findOneAndUpdate(
      { _id, companyId },
      { status: StatusNewAbonent.REJECTED, description },
      { new: true }
    );
    if (!pendingAbonent) {
      return res.status(404).json({ ok: false, message: "Abonent not found" });
    }
    res.json({ ok: true, data: pendingAbonent });
    bot.telegram.sendMessage(
      pendingAbonent.senderId,
      `Fuqaro: ${pendingAbonent.citizen.lastName} ${pendingAbonent.citizen.firstName} ${pendingAbonent.citizen.patronymic}\nSizning ushbu fuqaroga yangi abonent ochish haqidagi arizangiz bekor qilindi. \n\nSababi: ${description}`
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: "Server error " + error.message });
  }
};

export const acceptPendingNewAbonent = async (req, res) => {
  try {
    const { _id } = req.params;
    const { companyId } = req.user;
    const pendingAbonent = await NewAbonent.findOne({ _id, companyId });
    if (!pendingAbonent) {
      return res.status(404).json({ ok: false, message: "Abonent not found" });
    }
    const nazoratchi = await Nazoratchi.findOne({
      companyId,
      id: pendingAbonent.nazoratchi_id,
    });
    if (!nazoratchi) {
      return res
        .status(404)
        .json({ ok: false, message: "Nazoratchi not found" });
    }
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const generatedAccountNumber = (
      await tozaMakonApi.get(
        `/user-service/residents/account-numbers/generate?residentType=INDIVIDUAL&mahallaId=${pendingAbonent.mahallaId}`
      )
    ).data;
    const { data } = await tozaMakonApi.post("/user-service/residents", {
      accountNumber: generatedAccountNumber,
      active: true,
      citizen: pendingAbonent.citizen,
      companyId: pendingAbonent.companyId,
      contractDate: null,
      contractNumber: null,
      description: `${nazoratchi.name} tomonidan yangi abonent ochish uchun ariza qabul qilindi`,
      electricityAccountNumber: pendingAbonent.etkCustomerCode,
      electricityCoato: pendingAbonent.etkCaoto,
      homePhone: null,
      house: {
        cadastralNumber: pendingAbonent.cadastr,
        flatNumber: null,
        homeIndex: null,
        homeNumber: 0,
        inhabitantCnt: pendingAbonent.inhabitant_cnt,
        temporaryCadastralNumber: null,
        type: "HOUSE",
      },
      isCreditor: false,
      mahallaId: pendingAbonent.mahallaId,
      nSaldo: 0,
      residentType: "INDIVIDUAL",
      streetId: pendingAbonent.streetId,
    });
    await Abonent.create({
      createdAt: new Date(),
      fio: pendingAbonent.abonent_name,
      licshet: generatedAccountNumber,
      mahallas_id: pendingAbonent.mahallaId,
      prescribed_cnt: pendingAbonent.inhabitant_cnt,
      id: data,
      kadastr_number: pendingAbonent.cadastr,
      pinfl: pendingAbonent.citizen.pnfl,
      mahalla_name: pendingAbonent.mahallaName,
      passport_number: pendingAbonent.citizen.passport,
      streets_id: pendingAbonent.streetId,
      shaxsi_tasdiqlandi: {
        confirm: true,
        inspector: {
          _id: nazoratchi._id,
          name: nazoratchi.name,
        },
        inspector_id: nazoratchi.id,
        inspector_name: nazoratchi.name,
        updated_at: new Date(),
      },
      ekt_kod_tasdiqlandi: {
        confirm: true,
        inspector: {
          _id: nazoratchi._id,
          name: nazoratchi.name,
        },
        inspector_id: nazoratchi.id,
        inspector_name: nazoratchi.name,
        updated_at: new Date(),
      },
      companyId: pendingAbonent.companyId,
    });
    await pendingAbonent.updateOne({
      status: StatusNewAbonent.APPROVED,
      accountNumber: generatedAccountNumber,
    });

    res.json({ ok: true, data: pendingAbonent });
    bot.telegram.sendMessage(
      pendingAbonent.senderId,
      `Fuqaro: ${pendingAbonent.citizen.lastName} ${pendingAbonent.citizen.firstName} ${pendingAbonent.citizen.patronymic}\nSizning ushbu fuqaroga yangi abonent ochish haqidagi arizangiz qabul qilindi. \n\nSizning yangi abonent raqamingiz: <code>${generatedAccountNumber}</code>`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: error.response?.data?.message || "Server error " + error.message,
    });
  }
};

export const getFreeAbonentIdForNewAbonent = async (req, res) => {
  try {
    const { companyId } = req.user;

    const freeAbonent = await FreeAbonent.findOne({
      companyId,
      inHabitantCount: 0,
      inProcess: { $ne: true },
    });
    if (!freeAbonent) {
      return res
        .status(404)
        .json({ ok: false, message: "Free abonent not found" });
    }
    res.json({ ok: true, data: freeAbonent });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: "Server error " + error.message });
  }
};

export const castlingWithNewAbonent = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { newAbonentId, accountNumber } = req.body;
    if (!accountNumber || !newAbonentId) {
      return res.status(400).json({
        ok: false,
        message: "accountNumber, newAbonentId required",
      });
    }

    const freeAbonent = await FreeAbonent.findOneAndUpdate(
      {
        companyId,
        inHabitantCount: 0,
        inProcess: { $ne: true },
      },
      {
        $set: {
          inProcess: true,
        },
      },
      {
        new: true,
      }
    );
    if (!freeAbonent) {
      return res
        .status(404)
        .json({ ok: false, message: "Free abonent not found" });
    }
    const newAbonent = await NewAbonent.findOne({
      companyId,
      _id: newAbonentId,
      status: StatusNewAbonent.PENDING,
    });
    if (!newAbonent) {
      return res
        .status(404)
        .json({ ok: false, message: "New abonent not found" });
    }
    const nazoratchi = await Nazoratchi.findOne({
      companyId,
      id: newAbonent.nazoratchi_id,
    });
    if (!nazoratchi) {
      return res
        .status(404)
        .json({ ok: false, message: "Nazoratchi not found" });
    }
    const tozaMakonApi = createTozaMakonApi(companyId);

    await tozaMakonApi.put("/user-service/residents/" + freeAbonent.id, {
      id: freeAbonent.id,
      accountNumber: accountNumber,
      active: true,
      citizen: newAbonent.citizen,
      companyId: newAbonent.companyId,
      contractDate: null,
      contractNumber: null,
      description: `${nazoratchi.name} tomonidan yangi abonent ochish uchun ariza qabul qilindi`,
      electricityAccountNumber: newAbonent.etkCustomerCode,
      electricityCoato: newAbonent.etkCaoto,
      homePhone: null,
      house: {
        cadastralNumber: newAbonent.cadastr || "0",
        flatNumber: null,
        homeIndex: null,
        homeNumber: 0,
        inhabitantCnt: newAbonent.inhabitant_cnt,
        temporaryCadastralNumber: null,
        type: "HOUSE",
      },
      isCreditor: false,
      mahallaId: newAbonent.mahallaId,
      nSaldo: 0,
      residentType: "INDIVIDUAL",
      streetId: newAbonent.streetId,
    });

    if (newAbonent.inhabitant_cnt > 0) {
      await tozaMakonApi.patch(
        "/billing-service/residents/" + freeAbonent.id + "/inhabitant",
        {
          inhabitantCount: String(newAbonent.inhabitant_cnt),
        }
      );
    }

    await freeAbonent.deleteOne();
    await newAbonent.updateOne({
      $set: {
        status: StatusNewAbonent.APPROVED,
        accountNumber: accountNumber,
        residentId: freeAbonent.id,
      },
    });
    bot.telegram.sendMessage(
      newAbonent.senderId,
      `Fuqaro: ${newAbonent.abonent_name}\nSizning ushbu fuqaroga yangi abonent ochish haqidagi arizangiz qabul qilindi. \n\nSizning yangi abonent raqamingiz: <code>${accountNumber}</code>`,
      { parse_mode: "HTML" }
    );
    try {
      await Abonent.findOneAndDelete({
        id: freeAbonent.id,
        companyId: newAbonent.companyId,
      });
    } catch (error) {}
    await Abonent.create({
      id: freeAbonent.id,
      fio: newAbonent.abonent_name,
      licshet: accountNumber,
      prescribed_cnt: newAbonent.inhabitant_cnt,
      kadastr_number: newAbonent.cadastr,
      pinfl: newAbonent.citizen.pnfl,
      mahalla_name: newAbonent.mahallaName,
      passport_number: newAbonent.citizen.passport,
      mahallas_id: newAbonent.mahallaId,
      streets_id: newAbonent.streetId,
      shaxsi_tasdiqlandi: {
        confirm: true,
        inspector: {
          _id: nazoratchi._id,
          name: nazoratchi.name,
        },
        inspector_id: nazoratchi.id,
        inspector_name: nazoratchi.name,
        updated_at: new Date(),
      },
      ekt_kod_tasdiqlandi: {
        confirm: true,
        inspector: {
          _id: nazoratchi._id,
          name: nazoratchi.name,
        },
        inspector_id: nazoratchi.id,
        inspector_name: nazoratchi.name,
        updated_at: new Date(),
      },
      companyId: newAbonent.companyId,
    });
    res.json({
      ok: true,
      message: "Bo'sh abonent muvaffaqqiyatli almashtirildi",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: "Server error " + error.message });
  }
};

export const generateAccountNumber = async (req, res) => {
  try {
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const { mahallaId } = req.query;
    if (!mahallaId)
      return res.status(400).json({
        ok: false,
        message: "mahallaId param required",
      });
    const accountNumber = (
      await tozaMakonApi.get(
        `/user-service/residents/account-numbers/generate?residentType=INDIVIDUAL&mahallaId=${mahallaId}`
      )
    ).data;
    res.json({
      ok: true,
      accountNumber,
    });
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, message: "Server error " + error.message });
  }
};
