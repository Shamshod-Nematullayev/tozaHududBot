import mongoose, { Document, Schema, model } from "mongoose";

export interface ICustomDataRequest {
  user: {
    id: string;
    username: string;
  };
  data: {
    pinfl: string;
    passport_serial: string;
    passport_number: string;
    birth_date: string;
    last_name: string;
    first_name: string;
    middle_name: string;
    details?: {
      surname_cyrillic: string;
      name_cyrillic: string;
      patronym_cyrillic: string;
      division_id: number;
      division: string;
      doc_end_date: string;
      live_status: number;
      nationality_id: number;
      nationality: string;
      birth_country_id: number;
      birth_country: string;
      birth_region: string;
      birth_district: string;
      birth_place_latin: string;
      father_surname: string;
      father_name: string;
      father_patronym: string;
      father_birth_date: string;
      mother_surname: string;
      mother_name: string;
      mother_patronym: string;
      mother_birth_date: string;
      marriage_date: string;
      marriage_rigistry_office_id: number;
      marital_status_id: number;
      spouse_birth_date: string;
      spouse_surname: string;
      spouse_name: string;
      spouse_patronym: string;
      living_country: string;
      living_region_id: number;
      living_region: string;
      living_district_id: number;
      living_district: string;
      living_place_id: number;
      living_place: string;
      living_street_id: number;
      living_street: string;
    };
  };
  inspector_id: string;
  licshet: string;
  reUpdating: boolean;
  companyId: number;
}

export interface ICustomDataRequestDoc extends ICustomDataRequest, Document {}

const schema = new Schema<ICustomDataRequestDoc>(
  {
    user: Object,
    data: Object,
    inspector_id: {
      type: String,
      required: true,
    },
    licshet: {
      type: String,
      required: true,
    },
    reUpdating: {
      type: Boolean,
      default: false,
    },
    companyId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
export const CustomDataRequest = model("custom_data_request", schema);
