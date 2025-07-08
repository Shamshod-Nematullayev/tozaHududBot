import { model, Schema } from "mongoose";

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
const schema = new Schema(
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
    user_id: Number,
    login: String,
    password: String,
    authorization: String,
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
    type: {
      type: String,
      enum: ["dxsh", "ekopay"],
      default: "dxsh",
    },
    path: {
      type: Object,
      default: {
        getIncomes: "",
        createNewAbonent: "",
        searchAbonent: "",
      },
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
  },
  {
    timestamps: true,
  }
);

export const Company = model("Company", schema);
