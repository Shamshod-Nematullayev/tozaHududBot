import { SpecialTaskItem } from '@models/SpecialTaskItem.js';
import data from './files/abonents.json';
import { Mahalla } from '@models/Mahalla.js';
export async function importSpec(
  data: {
    accountNumber: string | number;
    fullName: string;
    id: number;
    mahallaId: number;
  }[],
  companyId: number
) {
  console.log('Starting import spec');
  const mahallas = await Mahalla.find({ companyId });
  console.log(`Found ${mahallas.length} mahallas`);
  for (let item of data) {
    console.log(`Importing spec for ${item.fullName}`);
    await SpecialTaskItem.create({
      accountNumber: item.accountNumber.toString(),
      companyId,
      fullName: item.fullName,
      id: item.id,
      mahallaId: item.mahallaId,
      nazoratchi_id: mahallas.find((m) => m.id == item.mahallaId)?.biriktirilganNazoratchi?.inspactor_id || 38618,
      nazoratchiName:
        mahallas.find((m) => m.id == item.mahallaId)?.biriktirilganNazoratchi?.inspector_name ||
        'DAMINOV ASLIDDIN ERKINJON O‘G‘LI',
      type: 'phone',
      status: 'in-progress',
    });
    console.log(`Imported spec for ${item.fullName}`);
  }
  console.log('Finished importing spec');
}
