import mongoose, { Schema } from 'mongoose';
import { IAct } from 'types/billing';

export const arizaDocumentTypes = ['dvaynik', 'odam_soni', 'viza', 'death', 'gps', 'pul_kuchirish'] as const;

export interface INeedMoneyTransfer {
  accountNumber: string;
  amount: number;
  residentId: number;
  fullName: string;
}

interface IAriza {
  fio: string;
  abonentId: number;
  asosiy_licshet: string;
  ikkilamchi_licshet: string;
  needMonayTransferActs: INeedMoneyTransfer[];
  sana: Date;
  document_type: (typeof arizaDocumentTypes)[number];
  document_number: number;
  licshet: string;
  comment: string;
  aktSummasi: number;
  aktSummCounts: {
    total: number;
  };
  current_prescribed_cnt: number;
  next_prescribed_cnt: number;
  status: 'yangi' | 'qabul qilindi' | 'tasdiqlangan' | 'bekor qilindi' | 'akt_kiritilgan' | 'qayta_akt_kiritilgan';
  photos: string[];
  recalculationPeriods: any[];
  muzlatiladi: boolean;
  is_canceled: boolean;
  acceptedDate: Date;
  akt_date: Date;
  canceling_description: string;
  akt_pachka_id: number;
  akt_id: number;
  actStatus: 'NEW' | 'CONFIRMED' | 'WARNED' | 'REJECTED' | 'MISSING' | 'CANCELED';
  aktInfo: IAct;
  tempPhotos: string[];
  actHistory: any[];
  companyId: number;
  version: number;
}

const schema = new Schema<IAriza>({
  fio: {
    type: String,
    required: true,
  },
  abonentId: {
    type: Number,
    required: true,
  },
  asosiy_licshet: String,
  ikkilamchi_licshet: String,
  needMonayTransferActs: Array,
  sana: {
    type: Date,
    required: true,
    default: Date.now,
  },
  document_type: {
    type: String,
    enum: arizaDocumentTypes,
    required: true,
  },
  document_number: {
    required: true,
    type: Number,
  },
  licshet: {
    type: String,
    required: true,
    unique: true,
  },
  comment: {
    type: String,
    default: '',
  },
  aktSummasi: {
    type: Number,
    default: 0,
  },
  aktSummCounts: {
    type: Object,
    default: {
      total: 0,
    },
  },
  current_prescribed_cnt: {
    type: Number,
  },
  next_prescribed_cnt: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['yangi', 'qabul qilindi', 'tasdiqlangan', 'bekor qilindi', 'akt_kiritilgan', 'qayta_akt_kiritilgan'],
    default: 'yangi',
  },
  is_canceled: {
    type: Boolean,
    default: false,
  },
  acceptedDate: Date,
  canceling_description: String,
  akt_date: Date,
  akt_pachka_id: Number,
  akt_id: Number,
  actStatus: {
    type: String,
    enum: [
      'NEW',
      'WARNED',
      'CONFIRMED',
      'CANCELLED',
      'CONFIRMED_CANCELLED',
      'WARNED_CANCELLED',
      'APPROVED',
      'CORRECTED',
    ],
  },
  aktInfo: Object,
  photos: {
    type: [String],
    default: [],
  },
  tempPhotos: {
    type: [String],
    default: [],
  },
  recalculationPeriods: Array,
  muzlatiladi: Boolean,
  actHistory: {
    type: [Object],
    default: [],
  },
  companyId: {
    type: Number,
    required: true,
  },
  version: {
    type: Number,
    required: true,
    default: 1,
  },
});
schema.index({ companyId: 1, document_number: 1, version: 1, document_type: 1 }, { unique: true });
export const Ariza = mongoose.model('ariza', schema, 'arizalar');
