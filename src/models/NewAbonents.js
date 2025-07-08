import { Schema, model } from "mongoose";

const citizenSchema = new Schema({
  pnfl: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  patronymic: String,
  passport: String,
  photo: String,
  birthDate: String,
  passportGivenDate: String,
  passportIssuer: String,
  passportExpireDate: String,
});

const schema = new Schema(
  {
    citizen: citizenSchema,
    nazoratchi_id: String,
    mahallaId: {
      type: String,
      required: true,
    },
    mahallaName: {
      type: String,
      required: true,
    },
    streetName: {
      type: String,
      required: true,
    },
    streetId: {
      type: String,
      required: true,
    },
    abonent_name: String,
    accountNumber: String,
    residentId: Number,
    cadastr: String,
    inhabitant_cnt: {
      type: Number,
      required: true,
    },
    etkCustomerCode: String,
    etkCaoto: String,
    senderId: Number,
    companyId: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    kadastr_baza_not_worked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const StatusNewAbonent = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const NewAbonent = model("new_abonent", schema);
