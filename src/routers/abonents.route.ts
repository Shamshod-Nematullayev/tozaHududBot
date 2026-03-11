import { Router } from 'express';
import { catchAsync } from './controllers/utils/catchAsync.js';
import {
  getAbonentById,
  getAbonentByIdFromDB,
  getAbonentHistoryById,
  getBalanceRecalcPredictController,
  getCadastrs,
  getHetAbonent,
  getIibInhabitants,
  getIncomeStatisticsController,
  updateAbonentById,
  updateAbonentElectricityById,
  updateAbonentPhoneById,
} from './controllers/abonents.controller.js';

const router = Router();

router.get('/details-tozamakon/:id', catchAsync(getAbonentById));

router.get('/history/:id', catchAsync(getAbonentHistoryById));

router.get('/cadastrs', catchAsync(getCadastrs));

router.get('/het-abonent', catchAsync(getHetAbonent));

router.get('/iib-inhabitants', catchAsync(getIibInhabitants));

router.get('/income-statistics/:id', catchAsync(getIncomeStatisticsController));

router.get('/balance-recalc-predict', catchAsync(getBalanceRecalcPredictController));

router.get('/details-db/:id', catchAsync(getAbonentByIdFromDB));

router.patch('/phone/:id', catchAsync(updateAbonentPhoneById));

router.patch('/electricity/:id', catchAsync(updateAbonentElectricityById));

router.put('/details/:id', catchAsync(updateAbonentById));

export default router;
