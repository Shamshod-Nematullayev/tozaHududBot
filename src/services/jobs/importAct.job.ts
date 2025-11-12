import { Job } from "agenda";
import { JobNames, JobPayloads } from "./job.type.js";
import { chunkArray } from "@helpers/chunkArray.js";
import { createAct } from "@services/billing/createAct.js";
import { createTozaMakonApi } from "@api/tozaMakon.js";
import { notificationService } from "@services/notification.js";
import { Admin } from "@models/Admin.js";

export async function importActJob(
  job: Job<JobPayloads[typeof JobNames.ImportActs]>
) {
  const { acts } = job.attrs.data;
  const chunks = chunkArray(acts, 10);

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map((act) => {
        const tozaMakonApi = createTozaMakonApi(job.attrs.data.companyId);
        return createAct(tozaMakonApi, act);
      })
    );
  }

  const admin = await Admin.findById(job.attrs.data.userId);

  notificationService.createNotification({
    message: `${acts.length} ta akt muvaffaqiyatli import qilindi.`,
    type: "info",
    sender: {
      id: "system",
      name: "GreenZone System",
    },
    receiver: {
      id: job.attrs.data.userId,
      name: admin?.fullName || "Admin",
    },
    data: { importedActsCount: acts.length },
  });
}
