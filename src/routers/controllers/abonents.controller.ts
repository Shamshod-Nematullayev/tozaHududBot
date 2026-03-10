import { Request, Response } from 'express';
import { getAbonentById as getResidentById } from '@services/billing/getAbonentById.js';
import { createTozaMakonApi } from '@api/tozaMakon.js';
import { getAbonentDetailsHistory } from '@services/billing/getAbonentDetailsHistory.js';
import { getResidentHousesByPnfl } from '@services/billing/getResidentHousesByPnfl.js';
import z from 'zod';
import { getDataFromHET } from '@services/billing/getDataFromHET.js';

export const getAbonentById = async (req: Request, res: Response): Promise<any> => {
  const abonent = await getResidentById(createTozaMakonApi(req.user.companyId), Number(req.params.id));

  if (!abonent) return res.status(404).json({ ok: false, message: 'Abonent topilmadi' });
  res.json(abonent);
};

export const getAbonentHistoryById = async (req: Request, res: Response) => {
  const history = await getAbonentDetailsHistory(createTozaMakonApi(req.user.companyId), Number(req.params.id));

  if (!history) return res.status(404).json({ ok: false, message: 'Abonent topilmadi' });
  res.json(history);
};

export const getCadastrs = async (req: Request, res: Response) => {
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

export const getAbonentByIdFromDB = async (req: Request, res: Response) => {
  //TODO
};

export const updateAbonentPhoneById = async (req: Request, res: Response) => {
  //TODO
};

export const updateAbonentElectricityById = async (req: Request, res: Response) => {
  //TODO
};

export const updateAbonentById = async (req: Request, res: Response) => {
  //TODO
};
