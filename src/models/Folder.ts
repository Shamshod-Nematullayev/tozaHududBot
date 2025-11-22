import { Model, model, Schema } from "mongoose";
import { arizaDocumentTypes } from "./Ariza.js";

interface IFolder {
  _id: string;
  id: number;
  elements: {
    accountNumber: string;
    arizaNumber: number;
    ariza_id: string;
    arizaType: (typeof arizaDocumentTypes)[number];
  }[];
  startingAt: Date;
  endingAt?: Date;
  type: "ariza";
  companyId: number;
}

const schema = new Schema<IFolder>({
  id: {
    type: Number,
    required: true,
    immutable: true,
  },
  elements: Array,
  startingAt: Date,
  endingAt: Date,
  type: {
    type: String,
    required: true,
    enum: ["ariza"],
  },
  companyId: Number,
});

async function generateOrderNumber(companyId: number) {
  const last = await Folder.findOne({ companyId }).sort({ id: -1 }).lean();
  return last ? last.id + 1 : 1; // birinchi bo'lsa 1 dan boshlaydi
}

schema.pre("validate", async function (next) {
  if (this.isNew) {
    this.id = await generateOrderNumber(this.companyId);
    this.startingAt = new Date();
  }

  next();
});

schema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as any;
  if (update.id !== undefined) {
    delete update.id;
  }
  if (update.$set && update.$set.id !== undefined) {
    delete update.$set.id;
  }
  next();
});

schema.statics.addArizaToFolder = async function (
  companyId: number,
  element: {
    accountNumber: string;
    arizaNumber: number;
    ariza_id: string;
    arizaType: (typeof arizaDocumentTypes)[number];
  }
) {
  // 1. Ending bo'lmagan oxirgi folderni topamiz
  let folder = await this.findOne({
    companyId,
    endingAt: { $exists: false },
  }).sort({ id: -1 });

  // 2. Agar folder bo'lmasa, yangisini yaratamiz
  if (!folder) {
    folder = await this.create({
      companyId,
      type: "ariza",
      elements: [element],
    });
    return folder;
  }

  // 3. Folder topilgan bo'lsa – elementni push qilamiz
  folder.elements.push(element);
  await folder.save();

  return folder;
};

schema.statics.closeFolder = async function (_id: string) {
  return await this.findOneAndUpdate({ _id }, { endingAt: new Date() });
};

interface IFolderModel extends Model<IFolder>, IFolderStatics {}
interface IFolderStatics {
  addArizaToFolder: (
    companyId: number,
    element: {
      accountNumber: string;
      arizaNumber: number;
      ariza_id: string;
      arizaType: (typeof arizaDocumentTypes)[number];
    }
  ) => Promise<IFolder>;
  closeFolder: (_id: string) => Promise<any>;
}

export const Folder = model<IFolder, IFolderModel>("folder", schema);
