import { Nazoratchi } from "@models/Nazoratchi";

export async function getInspector(telegramId: number) {
  const inspector = await Nazoratchi.findOne({
    telegram_id: telegramId,
    activ: true,
  });
  if (!inspector) {
    throw new Error("NO_ACCESS");
  }
  return inspector;
}
