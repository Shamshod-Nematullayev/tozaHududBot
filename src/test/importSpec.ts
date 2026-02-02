import { SpecialTaskItem } from "@models/SpecialTaskItem.js";
import data from "./abonents.json";
import { Mahalla } from "@models/Mahalla.js";
export async function importSpec(
  data: {
    accountNumber: string | number;
    fullName: string;
    id: number;
    mahallaId: number;
  }[]
) {
  console.log("Starting import spec");
  const mahallas = await Mahalla.find({ companyId: 1144 });
  console.log(`Found ${mahallas.length} mahallas`);
  for (let item of data) {
    console.log(`Importing spec for ${item.fullName}`);
    await SpecialTaskItem.create({
      accountNumber: item.accountNumber.toString(),
      companyId: 1144,
      fullName: item.fullName,
      id: item.id,
      mahallaId: item.mahallaId,
      nazoratchi_id: mahallas.find((m) => m.id == item.mahallaId)
        ?.biriktirilganNazoratchi?.inspactor_id,
      nazoratchiName: mahallas.find((m) => m.id == item.mahallaId)
        ?.biriktirilganNazoratchi?.inspector_name,
      type: "electricity",
    });
    console.log(`Imported spec for ${item.fullName}`);
  }
  console.log("Finished importing spec");
}
importSpec(data);
