import mongoose from "mongoose";

const schema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },

  nowUser: String,
  activ: {
    type: Boolean,
    default: true,
  },
  biriktirilgan: Array,
  telegram_id: {
    type: Array,
    default: [],
  },
  dontShowOnReport: {
    type: Boolean,
    default: false,
  },
  shaxs_tasdiqlash_ball: { type: Number, default: 0 },
  companyId: {
    type: Number,
    required: true,
  },
  isXatlovchi: Boolean,
});

// id: ekopay tizimida nazoratchi nomiga yaratilgan id
// name: nazoratchining Familiya ism sharifi
// nowUser: hozirgi kunda apparatdan foydalanayotgan xodimning fish
// activ: hozirgi kunda ishlayaptimi yoki yo'q
// biriktirilgan: Shu nazoratchiga biriktirilgan mahallalar
// telegram_id: telegram akkauntini rasmiy nazoratchi sifatida bog'lash
// companyId: kompaniya id raqami

export const Nazoratchi = mongoose.model("inpektor", schema);
