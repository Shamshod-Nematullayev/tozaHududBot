import mongoose from "mongoose";

interface IMahalla {
  id: number;
  name: string;
  companyId: number;
  reja: number;
  biriktirilganNazoratchi?: {
    inspector_name: string;
    inspactor_id: number;
  };
  groups: any[];
  ommaviy_shartnoma?: any;
  sektor?: string;
  mfy_rais_name: string;
  mfy_rais_phone?: string;
  hokim_yordamchi_name?: string;
  hokim_yordamchi_phone?: string;
  yoshlar_yetakchi_name?: string;
  yoshlar_yetakchi_phone?: string;
  xotinqizlar_name?: string;
  xotinqizlar_phone?: string;
  uchastkavoy_name?: string;
  uchastkavoy_phone?: string;
  shaxsi_tasdiqlandi_reja?: number;
  abarotka_berildi?: boolean;
  publicOfferFileId?: string;
  publicOfferFileName?: string;
  publicOfferFileUrl?: string;
  publicOfferFileUpdatedAt?: Date;
  geoZoneBiriktirilganKochalar?: any[];
  created_at: Date;
}

const schema = new mongoose.Schema<IMahalla>({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  companyId: {
    type: Number,
    required: true,
  },
  reja: {
    type: Number,
  },
  biriktirilganNazoratchi: {
    required: true,
    type: Object,
    default: {
      inspector_name: null,
      inspactor_id: null,
    },
  },
  groups: {
    type: [Object],
    default: [],
  },
  ommaviy_shartnoma: Object,
  sektor: String,
  mfy_rais_name: String,
  mfy_rais_phone: String,
  hokim_yordamchi_name: String,
  hokim_yordamchi_phone: String,
  yoshlar_yetakchi_name: String,
  yoshlar_yetakchi_phone: String,
  xotinqizlar_name: String,
  xotinqizlar_phone: String,
  uchastkavoy_name: String,
  uchastkavoy_phone: String,
  shaxsi_tasdiqlandi_reja: Number,
  abarotka_berildi: {
    type: Boolean,
    default: false,
  },
  publicOfferFileId: String,
  geoZoneBiriktirilganKochalar: {
    type: [Object],
    default: [],
  },
});

export const Mahalla = mongoose.model("mahalla", schema);
