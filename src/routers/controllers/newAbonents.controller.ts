import { NewAbonent, StatusNewAbonent } from "@models/NewAbonents.js";

import { bot } from "../../bot/core/bot.js";

import { createTozaMakonApi } from "../../api/tozaMakon.js";

import { Nazoratchi } from "@models/Nazoratchi.js";
import { Abonent } from "@models/Abonent.js";

import { FreeAbonent } from "@models/FreeAbonent.js";
import { Request, Response } from "express";
import z from "zod";
import { AxiosError } from "axios";
import NotFoundError from "errors/NotFoundError.js";
import {
  createAbonent,
  CreateAbonentPayload,
} from "@services/billing/createAbonent.js";
import { matchAccountNumberFromErrorMessage } from "@helpers/matchAccountNumberFromErrorMessage.js";
import { getResidentHousesByPnfl } from "@services/billing/getResidentHousesByPnfl.js";
import { searchAbonent } from "@services/billing/searchAbonent.js";
import { updateAbonentDetails } from "@services/billing/updateAbonentDetails.js";

export const getPendingNewAbonents = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { companyId } = req.user;
  const { page, limit } = z
    .object({
      page: z.coerce.number().optional().default(1),
      limit: z.coerce.number().optional().default(10),
    })
    .parse(req.query);

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
};

export const getOnePendingNewAbonent = async (
  req: Request,
  res: Response
): Promise<any> => {
  const pendingAbonent = await NewAbonent.findOne({
    companyId: req.user.companyId,
    _id: req.params._id,
  });
  if (!pendingAbonent) {
    return res.status(404).json({ ok: false, message: "Abonent not found" });
  }
  res.json({ ok: true, data: pendingAbonent });
};

export const cancelPendingNewAbonent = async (
  req: Request,
  res: Response
): Promise<any> => {
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
};

export const acceptPendingNewAbonent = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { _id } = req.params;
  const { companyId } = req.user;
  const pendingAbonent = await NewAbonent.findOneAndUpdate(
    { _id, companyId, status: StatusNewAbonent.PENDING },
    { $set: { status: StatusNewAbonent.APPROVED } },
    { new: false, upsert: false }
  );

  if (!pendingAbonent)
    return res.status(409).json({
      ok: false,
      message: "Abonent already processed or not found",
    });

  const nazoratchi = await Nazoratchi.findOne({
    companyId,
    id: pendingAbonent.nazoratchi_id,
  });
  if (!nazoratchi) throw new NotFoundError("Nazoratchi");

  const tozaMakonApi = createTozaMakonApi(req.user.companyId);

  const abonentPayload: CreateAbonentPayload = {
    citizen: pendingAbonent.citizen,
    mahallaId: pendingAbonent.mahallaId,
    mahallaName: pendingAbonent.mahallaName,
    streetId: pendingAbonent.streetId,
    nazoratchiName: nazoratchi.name,
    nazoratchiId: nazoratchi.id,
    nazoratchiMongoId: nazoratchi._id,
    companyId: pendingAbonent.companyId,
    etkCustomerCode: pendingAbonent.etkCustomerCode,
    etkCaoto: pendingAbonent.etkCaoto,
    cadastr: pendingAbonent.cadastr,
    inhabitant_cnt: pendingAbonent.inhabitant_cnt,
  };
  let accountNumber = "";
  try {
    ({ accountNumber } = await createAbonent(tozaMakonApi, abonentPayload));
  } catch (error: AxiosError | any) {
    if (error instanceof AxiosError) {
      const data = error.response?.data;
      if (data.code === "RESIDENT.CADASTRAL-NUMBER-ALREADY-EXISTS") {
        // agar kadastr raqami allaqachon mavjud bo'lsa
        const existingResidentAccountNumber =
          matchAccountNumberFromErrorMessage(data.message);
        if (existingResidentAccountNumber) {
          // o'sha abonentni aniqlash
          const existingAbonent = await searchAbonent(tozaMakonApi, {
            accountNumber: existingResidentAccountNumber,
            companyId: req.user.companyId,
          });
          if (existingAbonent.content[0]) {
            // kadastr raqamini o'zinikimi yoki yo'q tekshirish
            const houses = await getResidentHousesByPnfl(
              tozaMakonApi,
              existingAbonent.content[0].pinfl
            );
            const houseWithSameCadastr = houses.find(
              (house) => house === pendingAbonent.cadastr
            );
            if (!houseWithSameCadastr) {
              // o'ziniki bo'lmasa yangilash aks holda xatolik berish
              await updateAbonentDetails(
                tozaMakonApi,
                existingAbonent.content[0].id,
                {
                  house: {
                    cadastralNumber:
                      houses[0] || existingAbonent.content[0].accountNumber,
                  },
                }
              );
              // abonent ochishga qaytadan urinish
              ({ accountNumber } = await createAbonent(
                tozaMakonApi,
                abonentPayload
              ));
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  if (accountNumber === "") throw new Error("Account number is not defined");

  res.json({ ok: true, message: "Abonent muvaffaqqiyatli yaratildi" });

  await pendingAbonent
    .updateOne({
      $set: {
        status: StatusNewAbonent.COMPLETED,
        accountNumber: accountNumber,
      },
    })
    .catch(console.error);
  await bot.telegram.sendMessage(
    pendingAbonent.senderId,
    `Fuqaro: ${pendingAbonent.citizen.lastName} ${pendingAbonent.citizen.firstName} ${pendingAbonent.citizen.patronymic}\nSizning ushbu fuqaroga yangi abonent ochish haqidagi arizangiz qabul qilindi. \n\nSizning yangi abonent raqamingiz: <code>${accountNumber}</code>`,
    { parse_mode: "HTML" }
  );
};

export const getFreeAbonentIdForNewAbonent = async (
  req: Request,
  res: Response
): Promise<any> => {
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
};

export const castlingWithNewAbonent = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { companyId } = req.user;
  const { accountNumber, newAbonentId } = z
    .object({
      newAbonentId: z.string(),
      accountNumber: z.string(),
    })
    .parse(req.body);

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
  if (!freeAbonent) throw new NotFoundError("Free Abonent");
  const newAbonent = await NewAbonent.findOne({
    companyId,
    _id: newAbonentId,
    status: StatusNewAbonent.PENDING,
  });
  if (!newAbonent) throw new NotFoundError("New Abonent");
  const nazoratchi = await Nazoratchi.findOne({
    companyId,
    id: newAbonent.nazoratchi_id,
  });
  if (!nazoratchi) throw new NotFoundError("Nazoratchi");
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
};

export const generateAccountNumber = async (
  req: Request,
  res: Response
): Promise<any> => {
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
};
