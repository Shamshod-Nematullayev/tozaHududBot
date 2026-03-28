import { model, Schema } from 'mongoose';
type EskizSmsStatus = 'NEW' | 'STORED' | 'ACCEPTED' | 'PARTDELIVERED' | 'DELIVERED' | 'REJECTED';

export interface ISmsWarning {
  residentId: number;
  accountNumber: string;
  debtAmount: number;
  messageId: string;
  phone: string;
  message: string;
  companyId: number;
  status: 'pending' | 'sent' | 'failed';
  providerStatus: string;
  errorMessage?: string;
  retryCount: number;
  smsProvider: 'eskiz';

  createdAt: Date;
  sentAt?: Date;
}

const schema = new Schema<ISmsWarning>({
  residentId: {
    type: Number,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  debtAmount: {
    type: Number,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  companyId: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
  errorMessage: String,
  retryCount: {
    type: Number,
    default: 0,
  },
  smsProvider: {
    type: String,
    default: 'eskiz',
  },

  createdAt: {
    type: Date,
    required: true,
  },
  sentAt: Date,
});

export const SmsWarning = model<ISmsWarning>('sms_warning', schema);
