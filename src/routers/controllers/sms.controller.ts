import { SmsWarning } from '@models/SmsWarning.js';
import { Request, Response } from 'express';
import z from 'zod';

if (!process.env.ESKIZ_LONG_TOKEN) {
  console.error('ESKIZ_LONG_TOKEN environment variable is not defined');
  process.exit(1);
}

export const EskizCallbackSchema = z.object({
  request_id: z.string().optional(),
  message_id: z.string(),
  user_sms_id: z.string().optional(),
  country: z.string().optional(),
  phone_number: z.string(),
  sms_count: z.string(),
  status: z.string(),
  status_date: z.string(), // YYYY-MM-DD HH:mm:ss
});

export const EskizQuerySchema = z.object({
  secret: z.string(),
});

export const receiveCallbackFromEskiz = async (req: Request, res: Response) => {
  console.log(req.body, req.query);
  const { secret } = EskizQuerySchema.parse(req.query);
  const { message_id, status, status_date } = EskizCallbackSchema.parse(req.body);

  if (secret !== process.env.ESKIZ_LONG_TOKEN) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  res.status(200).json({ message: 'Received' });

  // 3. Bazada SMS holatini yangilash (Asinxron davom etadi)
  // Masalan: await SmsLog.update({ status, updated_at: status_date }, { where: { message_id } });
  console.log(`SMS ${message_id} holati: ${status}`);
  await SmsWarning.findOneAndUpdate(
    { messageId: message_id },
    { providerStatus: status, sentAt: new Date(status_date), status: status === 'DELIVERED' ? 'sent' : 'failed' }
  );
};
