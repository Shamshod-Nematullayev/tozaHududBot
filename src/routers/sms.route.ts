import { Router } from 'express';
import { receiveCallbackFromEskiz } from './controllers/sms.controller.js';
import { catchAsync } from './controllers/utils/catchAsync.js';

const router = Router();

router.post('/callback-eskiz', catchAsync(receiveCallbackFromEskiz));

export default router;
