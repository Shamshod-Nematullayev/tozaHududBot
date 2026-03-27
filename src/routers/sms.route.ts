import { Router } from 'express';
import { receiveCallbackFromEskiz } from './controllers/sms.controller.js';

const router = Router();

router.post('/callback-eskiz', receiveCallbackFromEskiz);

export default router;
