import { Router } from 'express';
import { catchAsync } from './controllers/utils/catchAsync.js';
import {
  addInhabitants,
  createPdfByIib,
  getAbonentById,
  getAbonentByIdFromDB,
  getAbonentCard,
  getAbonentHistoryById,
  getBalanceRecalcPredictController,
  getCadastrDetails,
  getCadastrs,
  getCitizenController,
  getHetAbonent,
  getHetWarningReport,
  getIibInhabitants,
  getIncomeStatisticsController,
  getNodebtCertificate,
  searchAbonentFromTozamakon,
  updateAbonentById,
  updateAbonentElectricityById,
  updateAbonentPhoneById,
  verifyIdentity,
} from './controllers/abonents.controller.js';
import { uploadAsBlob } from '@middlewares/multer.js';

const router = Router();

router.get('/tozamakon', catchAsync(searchAbonentFromTozamakon));

router.get('/details-tozamakon/:id', catchAsync(getAbonentById));

router.get('/history/:id', catchAsync(getAbonentHistoryById));

router.get('/cadastrs', catchAsync(getCadastrs));

router.get('/het-abonent', catchAsync(getHetAbonent));

router.get('/cadastr-details/:cadastrNumber', catchAsync(getCadastrDetails));

router.get('/iib-inhabitants', catchAsync(getIibInhabitants));

router.get('/income-statistics/:id', catchAsync(getIncomeStatisticsController));

router.get('/balance-recalc-predict', catchAsync(getBalanceRecalcPredictController));

router.get('/details-db/:id', catchAsync(getAbonentByIdFromDB));

router.get('/citizens', catchAsync(getCitizenController));

router.get('/card/:id', catchAsync(getAbonentCard));

router.get('/nodebt-certificate/:id', catchAsync(getNodebtCertificate));

router.get('/het-warning-report/:id', catchAsync(getHetWarningReport));

router.patch('/update-phone/:id', catchAsync(updateAbonentPhoneById));

router.patch('/electricity/:id', catchAsync(updateAbonentElectricityById));

router.patch('/verify-identity/:id', catchAsync(verifyIdentity));

router.post('/add-inhabitants/:id', uploadAsBlob.single('file'), catchAsync(addInhabitants));

router.put('/details/:id', catchAsync(updateAbonentById));

router.post('/create-pdf-by-iib', catchAsync(createPdfByIib));

export default router;
