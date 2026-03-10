import { createTozaMakonApi } from '@api/tozaMakon.js';
import { Abonent } from '@models/Abonent.js';
import { SudAkt } from '@models/SudAkt.js';
import { getResidentDHJByAbonentId } from '@services/billing/index.js';
import { chunkArray } from 'helpers/chunkArray.js';

// 03.2025: string => 2025-03-31: Date
function periodToDate(period: string) {
  const [month, year] = period.split('.').map(Number);

  return new Date(year, month, 0); //oyning oxirgi kuni
}

export async function checkPaymentSudAkts(companyId: number) {
  let counter = 0;
  console.log('checkPaymentSudAkts started');
  const sudAkts = await SudAkt.find({
    status: {
      $ne: 'yakunlandi',
    },
    companyId,
  });
  const chunks = chunkArray(sudAkts, 10);
  let decounter = chunks.length;
  for (const chunk of chunks) {
    console.log(decounter--);
    const promises = chunk.map(async (akt) => {
      const abonent = await Abonent.findOne({ licshet: akt.licshet });

      if (!abonent) {
        await SudAkt.updateOne(
          { licshet: akt.licshet },
          {
            $set: {
              status: 'yakunlandi',
            },
          }
        );
        counter++;
        return;
      }

      const tozaMakonApi = createTozaMakonApi(companyId);
      const dhj = (await getResidentDHJByAbonentId(tozaMakonApi, abonent.id)).content;
      const allPaymentsAfterWarning = dhj
        .filter((d) => periodToDate(d.period) >= akt.warningDate)
        .reduce((a, b) => a + b.allPaymentsSum, 0);

      if (allPaymentsAfterWarning >= akt.claimAmount) {
        await SudAkt.updateOne(
          { licshet: akt.licshet },
          {
            $set: {
              status: 'yakunlandi',
              yakunlandiDate: new Date(),
            },
          }
        );
        counter++;
      }
    });
    await Promise.all(promises);
  }
  console.log(`Jami aktlar soni: ${sudAkts.length}`);
  console.log(`Yakunlandi aktlar soni: ${counter}`);
}
