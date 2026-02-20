import { Job } from 'agenda';
import { JobNames, JobPayloads } from './job.type.js';
import { Ariza } from '@models/Ariza.js';
import { Act, getActsByPack } from '@services/billing/getActsByPack.js';
import { createTozaMakonApi } from '@api/tozaMakon.js';
import { groupArray } from '@helpers/groupArray.js';
import { notificationService } from '@services/notification.js';

export async function updateArizaStatusJob(job: Job<JobPayloads[typeof JobNames.UpdateArizasStatus]>) {
  const startedAt = Date.now();
  const { arizaIds, userId, companyId } = job.attrs.data;

  console.log('[UpdateArizaStatusJob] START', {
    jobId: job.attrs._id,
    arizaCount: arizaIds?.length,
    userId,
    companyId,
  });

  try {
    const arizalar = await Ariza.find({
      _id: { $in: arizaIds },
      companyId,
    }).lean();

    console.log('[UpdateArizaStatusJob] Arizalar fetched', {
      found: arizalar.length,
    });

    const pachkaIds = new Map();
    arizalar.forEach((ariza) => {
      if (ariza.akt_pachka_id) {
        pachkaIds.set(ariza.akt_pachka_id, ariza.akt_pachka_id);
      }
    });

    console.log('[UpdateArizaStatusJob] Unique pachkaIds', {
      count: pachkaIds.size,
    });

    const acts: Act[] = [];
    const api = createTozaMakonApi(companyId);

    for (const pachkaId of pachkaIds.values()) {
      console.log('[UpdateArizaStatusJob] Fetching acts by pack', {
        pachkaId,
      });

      const response = await getActsByPack(api, {
        actPackId: pachkaId,
        page: 0,
        size: 1000,
        sort: 'id,DESC',
      });

      console.log('[UpdateArizaStatusJob] Acts fetched', {
        pachkaId,
        count: response.content.length,
      });

      acts.push(...response.content);
    }

    console.log('[UpdateArizaStatusJob] Total acts collected', {
      total: acts.length,
    });

    const grouped = groupArray(acts, 'actStatus');

    console.log('[UpdateArizaStatusJob] Grouped by status', {
      statuses: Object.keys(grouped),
      stats: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])),
    });

    for (const actStatus in grouped) {
      const actIds = grouped[actStatus].map((a) => a.id);

      const result = await Ariza.updateMany(
        { akt_id: { $in: actIds } },
        {
          $set: {
            actStatus,
            is_canceled: actStatus === 'CANCELLED',
            status: actStatus === 'CONFIRMED' ? 'tasdiqlangan' : undefined,
          },
        }
      );

      console.log('[UpdateArizaStatusJob] Updated by status', {
        actStatus,
        matched: result.matchedCount,
        modified: result.modifiedCount,
      });
    }

    const missingActs = arizalar.filter((ariza) => ariza.akt_id && !acts.find((a) => a.id === ariza.akt_id));

    if (missingActs.length) {
      const result = await Ariza.updateMany(
        { akt_id: { $in: missingActs.map((a) => a.akt_id) } },
        {
          $set: {
            actStatus: 'MISSING',
            is_canceled: true,
          },
        }
      );

      console.log('[UpdateArizaStatusJob] Missing acts handled', {
        missingCount: missingActs.length,
        modified: result.modifiedCount,
      });
    }

    const notHaveAct = arizalar.filter((a) => !a.akt_id);

    let message = ``;

    if (missingActs.length) {
      message += `❌ ${missingActs.length} ta act topilmadi\n`;
    }

    if (notHaveAct.length) {
      message += `❌ ${notHaveAct.length} ta arizaga akt kiritilmagan\n`;
    }

    if (grouped.CANCELLED?.length) {
      message += `❌ ${
        grouped.CANCELLED.filter((a) => arizalar.find((ariza) => ariza.akt_id === a.id)).length
      } ta act o‘chirildi\n`;
    }

    if (grouped.CONFIRMED?.length) {
      message += `✅ ${
        grouped.CONFIRMED.filter((a) => arizalar.find((ariza) => ariza.akt_id === a.id)).length
      } ta act tasdiqlandi\n`;
    }

    if (grouped.WARNED?.length) {
      message += `⚠️ ${
        grouped.WARNED.filter((a) => arizalar.find((ariza) => ariza.akt_id === a.id)).length
      } ta act ogohlantirildi\n`;
    }

    if (grouped.NEW?.length) {
      message += `📝 ${
        grouped.NEW.filter((a) => arizalar.find((ariza) => ariza.akt_id === a.id)).length
      } ta act yangi\n`;
    }

    console.log('[UpdateArizaStatusJob] Notification message prepared', {
      message,
    });

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

    console.log('[UpdateArizaStatusJob] Notification sent');

    console.log('[UpdateArizaStatusJob] FINISHED', {
      durationMs: Date.now() - startedAt,
    });
  } catch (error: any) {
    console.error('[UpdateArizaStatusJob] ERROR', {
      message: error?.message,
      stack: error?.stack,
      jobId: job.attrs._id,
    });

    throw error; // Agenda retry mexanizmi ishlashi uchun
  }
}
