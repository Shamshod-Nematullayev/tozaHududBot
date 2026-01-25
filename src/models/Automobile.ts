import { model, Schema } from "mongoose";

export enum Weekday {
  Monday = 1,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

interface BiriktirilganMahalla {
  mahallaId: number;
  name: string;
  service: {
    day: number;
    time: 0.5 | 1;
  }[];
}
interface IAutomobile {
  name: string;
  model: string;
  year: number;
  km: number;
  currentDriver: string;
  companyId: number;
  status: "soz" | "nosoz";
  tozamakonId: number;
  phone?: string;
  mahallalar: BiriktirilganMahalla[];
}

const BiriktirilganMahallaSchema = new Schema<BiriktirilganMahalla>({
  mahallaId: Number,
  name: String,
  service: [
    {
      day: {
        type: Number,
        enum: [1, 2, 3, 4, 5, 6, 7],
      },
      time: {
        type: Number,
        enum: [0.5, 1],
      },
    },
  ],
});

const schema = new Schema<IAutomobile>({
  name: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  km: Number,
  currentDriver: String,
  companyId: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["soz", "nosoz"],
  },
  phone: String,
  mahallalar: [BiriktirilganMahallaSchema],
  tozamakonId: {
    type: Number,
    required: true,
  },
});

schema.index({ tozamakonId: 1 }, { unique: true });

export const Automobile = model("automobile", schema);
