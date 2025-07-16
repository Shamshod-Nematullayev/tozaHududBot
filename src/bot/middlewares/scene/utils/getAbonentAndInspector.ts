import { Abonent, IAbonentDoc } from "@models/Abonent.js";
import { INazoratchi, Nazoratchi } from "@models/Nazoratchi.js";
import { Types } from "mongoose";
import { Document } from "mongoose";

export async function getAbonentAndInspector(
  userId: number,
  licshet: string
): Promise<{
  inspector: INazoratchi;
  abonent: IAbonentDoc;
}> {
  const inspector = await Nazoratchi.findOne({ telegram_id: userId });
  if (!inspector) throw new Error("NO_ACCESS");

  const abonent = await Abonent.findOne({
    licshet,
    companyId: inspector.companyId,
  });
  if (!abonent) throw new Error("NOT_FOUND");

  return { inspector, abonent };
}
