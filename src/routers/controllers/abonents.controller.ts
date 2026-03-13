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
  //TODO
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
  //TODO
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
