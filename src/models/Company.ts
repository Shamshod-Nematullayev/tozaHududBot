import { model, Schema } from "mongoose";

interface IAktPack {
  id: number;
  type: string;
  month: number;
  year: number;
  name: string;
}

export interface ICompanyDocument extends ICompany, Document {
  _id: string;
  __v: number;
}

export interface ICompany {
  id: number;
  name: string;
  login: string;
  password: string;
  tozamakonGpsLogin: string;
  tozamakonGpsPassword: string;
  hybridLogin: string;
  hybridPassword: string;
  hybridToken: string;
  ekopayLogin: string;
  ekopayPassword: number;
  active: boolean;
  type: "dxsh" | "stm";
  ekopaySessionId?: string;
  ekopayToken?: string;
  akt_pachka_ids: {
    viza: IAktPack;
    odam_soni: IAktPack;
    dvaynik: IAktPack;
    pul_kuchirish: IAktPack;
    death: IAktPack;
    gps: IAktPack;
  };
  tozamakonAccessToken?: string;
  CHANNEL_ID_SHAXSI_TASDIQLANDI: string;
  GROUP_ID_NAZORATCHILAR: string;
  GROUP_ID_XATLOVCHILAR: string;
  ekopayParentId?: string;
  phone: string;
  activeExpiresDate: Date;
  canInspectorsCreateAbonent: boolean;
  manager: any;
  billingAdmin: any;
  gpsOperator: any;
  locationName: string;
  regionId: number;
  abonentsPrefix: string;
  districtId: 47;
  hybridArea: 41;
  hybridRegion: 3;
  tozamakonGpsAccessToken?: string;
  cabinetSudToken?: string;
  courtId: string;
  tin: string;
  address: string;
}

const aktPackSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  type: String,
  name: String,
});
const aktPackTypesSchema = new Schema({
  viza: aktPackSchema,
  odam_soni: aktPackSchema,
  dvaynik: aktPackSchema,
  pul_kuchirish: aktPackSchema,
  death: aktPackSchema,
  gps: aktPackSchema,
});
const employeerSchema = new Schema({
  user_id: String,
  fullName: {
    type: String,
    required: true,
  },
});
const schema = new Schema<ICompany>(
  {
    id: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    regionId: {
      type: Number,
      required: true,
    },
    tozamakonAccessToken: String,
    login: String,
    password: String,
    hybridToken: String,
    hybridLogin: String,
    hybridPassword: String,
    hybridRegion: Number,
    hybridArea: Number,
    ekopayLogin: String,
    ekopayPassword: String,
    ekopaySessionId: String,
    ekopayParentId: String,
    ekopayToken: String,
    tozamakonGpsLogin: String,
    tozamakonGpsPassword: String,
    tozamakonGpsAccessToken: String,
    cabinetSudToken: String,
    type: {
      type: String,
      enum: ["dxsh", "ekopay"],
      default: "dxsh",
    },
    akt_pachka_ids: aktPackTypesSchema,
    active: Boolean,
    canInspectorsCreateAbonent: {
      type: Boolean,
      default: false,
    },
    activeExpiresDate: Date,
    CHANNEL_ID_SHAXSI_TASDIQLANDI: String,
    GROUP_ID_NAZORATCHILAR: String,
    GROUP_ID_XATLOVCHILAR: String,
    manager: {
      type: employeerSchema,
      required: true,
    },
    gpsOperator: employeerSchema,
    billingAdmin: {
      type: employeerSchema,
      required: true,
    },
    abonentsPrefix: {
      type: String,
      required: true,
    },
    districtId: {
      type: Number,
      required: true,
    },
    phone: String,
    courtId: String,
    address: String,
    tin: String,
  },
  {
    timestamps: true,
  }
);

export const Company = model("Company", schema);
