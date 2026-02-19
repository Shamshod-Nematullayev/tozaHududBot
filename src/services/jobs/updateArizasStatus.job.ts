import { Job } from 'agenda';
import { JobNames, JobPayloads } from './job.type.js';
import { Ariza } from '@models/Ariza.js';
import { getActsByPack } from '@services/billing/getActsByPack.js';
import { createTozaMakonApi } from '@api/tozaMakon.js';
import { groupArray } from '@helpers/groupArray.js';
import { notificationService } from '@services/notification.js';

export async function updateArizaStatusJob(job: Job<JobPayloads[typeof JobNames.UpdateArizasStatus]>) {
  const { arizaIds, userId, companyId } = job.attrs.data;

  const arizalar = await Ariza.find({ _id: { $in: arizaIds }, companyId }).lean();

  const pachkaIds = new Map();
  arizalar.forEach((ariza) => {
    pachkaIds.set(ariza.akt_pachka_id, ariza.akt_pachka_id);
  });

  const acts = [];
  for (const pachkaId of pachkaIds.values()) {
    acts.push(
      ...(
        await getActsByPack(createTozaMakonApi(companyId), {
          actPackId: pachkaId,
          page: 0,
          size: 1000,
          sort: 'id,DESC',
        })
      ).content
    );
  }

  const grouped = groupArray(acts, 'actStatus');

  for (const actStatus in grouped) {
    await Ariza.updateMany(
      { akt_id: { $in: acts.map((a) => a.id) } },
      {
        $set: { actStatus, is_canceled: actStatus === 'REJECTED', status: actStatus === 'CONFIRMED' && 'tasdiqlangan' },
      }
    );
  }

  const missingActs = acts.filter((act) => !arizalar.find((ariza) => ariza.akt_id === act.id));

  if (missingActs.length) {
    await Ariza.updateMany(
      { akt_id: { $in: missingActs.map((a) => a.id) } },
      {
        $set: { actStatus: 'REJECTED', is_canceled: true },
      }
    );
  }

  let message = ``;

  if (missingActs.length) {
    message += `❌ ${missingActs.length} ta act topilmadi\n`;
  }

  if (grouped.REJECTED?.length) {
    message += `❌ ${grouped.REJECTED.length} ta act o‘chirildi\n`;
  }

  if (grouped.CONFIRMED?.length) {
    message += `✅ ${grouped.CONFIRMED.length} ta act tasdiqlandi\n`;
  }

  if (grouped.WARNED?.length) {
    message += `⚠️ ${grouped.WARNED.length} ta act o‘chirildi\n`;
  }

  if (grouped.NEW?.length) {
    message += `📝 ${grouped.NEW.length} ta act o‘chirildi\n`;
  }

  await notificationService.createNotification({
    message,
    type: 'info',
    receiver: {
      id: userId,
      name: 'Admin',
    },
    sender: {
      id: userId,
      name: 'system',
    },
  });
}
