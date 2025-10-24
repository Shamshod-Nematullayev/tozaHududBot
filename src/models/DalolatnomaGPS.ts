import { model, Schema } from "mongoose";

export interface IDalolatnoma {
  date: Date;
  participants: {
    position: string;
    fullName: string;
  }[];
  content: string;
}

interface IDalolatnomaGPS extends IDalolatnoma {
  _id: string;
  documentNumber: number;
  responsibleCarId: number;
  currentCarId: number;
  companyId: number;
}

const schema = new Schema<IDalolatnomaGPS>(
  {
    date: {
      type: Date,
      required: true,
    },
    documentNumber: {
      type: Number,
      required: true,
    },
    participants: [
      {
        position: {
          type: String,
          required: true,
        },
        fullName: {
          type: String,
          required: true,
        },
      },
    ],
    content: {
      type: String,
      required: true,
    },
    responsibleCarId: {
      type: Number,
      required: true,
    },
    currentCarId: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DalolatnomaGPS = model<IDalolatnomaGPS>("dalolatnoma_gps", schema);
