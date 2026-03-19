import { Request, Response } from 'express';
import { getAbonentById as getResidentById } from '@services/billing/getAbonentById.js';
import { createTozaMakonApi } from '@api/tozaMakon.js';
import { getAbonentDetailsHistory } from '@services/billing/getAbonentDetailsHistory.js';
import { getResidentHousesByPnfl } from '@services/billing/getResidentHousesByPnfl.js';
import z from 'zod';
import { getDataFromHET } from '@services/billing/getDataFromHET.js';
import { getIncomeStatistics } from '@services/billing/getIncomeStatistics.js';
import { getBalanceRecalcPredict } from '@services/billing/getBalanceRecalcPredict.js';
import { searchAbonent } from '@services/billing/searchAbonent.js';
import { AbonentSearchQuery } from 'types/billing.js';
import { changePhone } from '@services/billing/changePhone.js';
import { Abonent } from '@models/Abonent.js';
import { updateAbonentDetails } from '@services/billing/updateAbonentDetails.js';
import { getCitizen } from '@services/billing/getCitizen.js';
import { getAbonentCardById } from '@services/billing/getAbonentCard.js';
import { getCertificateNoDebt } from '@services/billing/getCertificateNoDebt.js';
import { identificationAbonent } from '@services/billing/identificationAbonent.js';
import { AxiosError } from 'axios';
import { getIIBInhabitants } from '@services/billing/getIIBInhabitants.js';

const stringOrEmpty = z
  .string()
  .nullable()
  .transform((v) => v ?? '');

export const abonentSchema = z.object({
  id: z.number(),
  accountNumber: z.string(),
  residentType: z.enum(['INDIVIDUAL']),
  electricityAccountNumber: z.string(),
  electricityCoato: z.string(),
  companyId: z.number(),
  streetId: z.number(),
  mahallaId: z.number(),

  contractNumber: stringOrEmpty,
  contractDate: z.string(),

  homePhone: stringOrEmpty,
  phone: stringOrEmpty,

  active: z.boolean(),
  description: stringOrEmpty,

  citizen: z.object({
    firstName: z.string(),
    lastName: z.string(),
    patronymic: z.string(),
    foreignCitizen: z.boolean(),

    inn: stringOrEmpty,
    pnfl: z.string(),
    passport: z.string(),

    birthDate: z.string(),
    passportGivenDate: z.string(),
    passportIssuer: z.string(),
    passportExpireDate: z.string(),

    email: stringOrEmpty,
    photo: stringOrEmpty,
  }),

  house: z.object({
    cadastralNumber: z.string(),
    temporaryCadastralNumber: stringOrEmpty,

    type: z.enum(['HOUSE', 'APARTMENT']),
    flatNumber: stringOrEmpty,

    homeNumber: z.string(),
    homeIndex: stringOrEmpty,

    inhabitantCnt: z.number(),
  }),
});

export const getAbonentById = async (req: Request, res: Response): Promise<any> => {
  const abonent = await getResidentById(createTozaMakonApi(req.user.companyId), Number(req.params.id));

  if (!abonent) return res.status(404).json({ ok: false, message: 'Abonent topilmadi' });
  res.json(abonent);
};

export const getAbonentHistoryById = async (req: Request, res: Response): Promise<any> => {
  const history = await getAbonentDetailsHistory(createTozaMakonApi(req.user.companyId), Number(req.params.id));

  if (!history) return res.status(404).json({ ok: false, message: 'Abonent topilmadi' });
  res.json(history);
};

export const getCadastrs = async (req: Request, res: Response): Promise<any> => {
  const { pnfl } = z.object({ pnfl: z.string() }).parse(req.params);
  const cadastrs = await getResidentHousesByPnfl(createTozaMakonApi(req.user.companyId), pnfl);

  if (!cadastrs) return res.status(404).json({ ok: false, message: 'Abonent topilmadi' });
  res.json(cadastrs);
};

export const getHetAbonent = async (req: Request, res: Response) => {
  const params = z.object({ coato: z.string(), personalAccount: z.string() }).parse(req.params);
  const data = await getDataFromHET(createTozaMakonApi(req.user.companyId), params);
};

export const getIibInhabitants = async (req: Request, res: Response) => {
  const { cadastralNumber } = z.object({ cadastralNumber: z.string() }).parse(req.query);

  const data = await getIIBInhabitants(createTozaMakonApi(req.user.companyId), cadastralNumber);
  res.json(data);
};

export const getIncomeStatisticsController = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.coerce.number() }).parse(req.params); //residentId
  const data = await getIncomeStatistics(createTozaMakonApi(req.user.companyId), id);
  res.json(data);
};

export const getBalanceRecalcPredictController = async (req: Request, res: Response) => {
  const params = z.object({ residentId: z.coerce.number(), period: z.string() }).parse(req.query);
  const data = await getBalanceRecalcPredict(createTozaMakonApi(req.user.companyId), params);
  res.json(data);
};

export const getAbonentByIdFromDB = async (req: Request, res: Response) => {
  //TODO
};

export const updateAbonentPhoneById = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
  const { phone } = z.object({ phone: z.string() }).parse(req.body);

  await changePhone(createTozaMakonApi(req.user.companyId), { phoneNumber: phone, residentId: id });
  res.status(200).send();
};

export const updateAbonentElectricityById = async (req: Request, res: Response) => {
  //TODO
};

export const updateAbonentById = async (req: Request, res: Response) => {
  const data = abonentSchema.parse(req.body);

  await updateAbonentDetails(createTozaMakonApi(req.user.companyId), data.id, data);

  res.status(200).send();

  await Abonent.findOneAndUpdate(
    { id: data.id, companyId: req.user.companyId },
    {
      $set: {
        energy_licshet: data.electricityAccountNumber,
        caotoNumber: data.electricityCoato,
        streets_id: data.streetId,
        mahallas_id: data.mahallaId,

        fio: `${data.citizen.lastName} ${data.citizen.firstName} ${data.citizen.patronymic}`,
        last_name: data.citizen.lastName,
        first_name: data.citizen.firstName,
        middle_name: data.citizen.patronymic,
        licshet: data.accountNumber,
        phone: data.phone,
        pinfl: data.citizen.pnfl,
      },
    }
  );
};

export const searchAbonentFromTozamakon = async (req: Request, res: Response) => {
  let query: any = { companyId: req.user.companyId };
  for (let key in req.query) {
    if (req.query[key]) {
      query[key] = req.query[key];
    }
  }
  const data = await searchAbonent(createTozaMakonApi(req.user.companyId), query);
  res.json(data);
};

export const getCitizenController = async (req: Request, res: Response) => {
  const query = z.object({ pnfl: z.string(), passport: z.string(), birthDate: z.string().optional() }).parse(req.query);
  const data = await getCitizen(createTozaMakonApi(req.user.companyId), {
    photoStatus: 'WITHOUT_PHOTO',
    birthdate: query.birthDate,
    pinfl: query.pnfl,
    passport: query.passport,
  });
  res.json(data);
};

export const getAbonentCard = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
  const { periodFrom, periodTo, lang } = z
    .object({ periodFrom: z.string(), periodTo: z.string(), lang: z.string().optional() })
    .parse(req.query);

  const data = await getAbonentCardById(createTozaMakonApi(req.user.companyId), {
    residentId: id,
    periodFrom,
    periodTo,
    lang,
  });
  res.json(data);
};

export const getNodebtCertificate = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
  const data = await getCertificateNoDebt(createTozaMakonApi(req.user.companyId), id);
  res.json(data);
};

export const verifyIdentity = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
  const { identified } = z.object({ identified: z.coerce.boolean() }).parse(req.body);
  try {
    await identificationAbonent(createTozaMakonApi(req.user.companyId), id, identified);
    res.status(200).send();
  } catch (error) {
    if (error instanceof AxiosError) res.status(400).json(error.response?.data);

    throw error;
  }
};
