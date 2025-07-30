import { model, Schema } from "mongoose";

interface IConfirmSchema {
  confirm: boolean;
  inspector_id: number;
  inspector_name: string;
  inspector: {
    name: string;
    _id: number;
  };
  updated_at: Date;
}

export interface IAbonent {
  id: number;
  fio: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  licshet: string;
  caotoNumber: string;
  companyId: number;
  isConfirm: any;
  createdAt: Date;
  updatedAt: Date;
  energy_licshet?: number;
  kadastr_number?: string;
  mahalla_name?: string;
  mahallas_id?: number;
  streets_id?: number;
  streets_name?: string;
  phone?: string;
  pinfl?: number;
  passport_number?: string;
  shaxsi_tasdiqlandi?: IConfirmSchema;
  shaxsi_tasdiqlandi_history?: any[];
  ekt_kod_tasdiqlandi?: IConfirmSchema;
  street_tasdiqlandi?: IConfirmSchema;
  phone_tasdiqlandi?: IConfirmSchema;
  sudAkt?: any;
  warningLetter?: any;
  ksaldo?: number;
}

const inspectorSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  _id: {
    type: String,
    required: true,
  },
});
const isConfirmSchema = new Schema({
  confirm: {
    type: Boolean,
    default: false,
  },
  inspector_id: Number,
  inspector_name: String,
  inspector: inspectorSchema,
  updated_at: Date,
});
const courtProcessSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    createdDate: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

export interface IAbonentDoc extends IAbonent, Document {
  _id: string;
}

const schema = new Schema<IAbonentDoc>(
  {
    id: {
      type: Number,
      required: true,
    },
    fio: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
    },
    first_name: {
      type: String,
    },
    middle_name: {
      type: String,
    },
    licshet: {
      type: String,
      max: 12,
      min: 12,
    },
    energy_licshet: String,
    kadastr_number: String,
    mahalla_name: String,
    mahallas_id: {
      type: Number,
      required: true,
    },
    streets_id: {
      type: Number,
    },
    streets_name: {
      type: String,
    },
    phone: String,
    pinfl: Number,
    passport_number: String,
    shaxsi_tasdiqlandi: isConfirmSchema,
    shaxsi_tasdiqlandi_history: {
      type: Array,
      default: [],
    },
    ekt_kod_tasdiqlandi: isConfirmSchema,
    street_tasdiqlandi: isConfirmSchema,
    phone_tasdiqlandi: isConfirmSchema,
    sudAkt: {
      type: courtProcessSchema,
    },
    warningLetter: {
      type: courtProcessSchema,
    },
    companyId: {
      type: Number,
      required: true,
    },
    ksaldo: Number,
  },
  {
    timestamps: true,
  }
);

export interface AbonentDoc {
  id: number;
  fio: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  licshet: string;
  accountNumber: string;
  caotoNumber: string;
  companyId: number;
  isConfirm: any;
  createdAt: Date;
  updatedAt: Date;
  shaxsi_tasdiqlandi?: any;
  shaxsi_tasdiqlandi_history?: any[];
  ekt_kod_tasdiqlandi?: any;
  street_tasdiqlandi?: any;
  phone_tasdiqlandi?: any;
  sudAkt?: any;
  warningLetter?: any;
  _id: string;
}

export const Abonent = model("billing_abonent", schema);
