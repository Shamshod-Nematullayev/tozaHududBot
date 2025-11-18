import { Job } from "agenda";
import { JobNames, JobPayloads } from "./job.type.js";
import { chunkArray } from "@helpers/chunkArray.js";
import { createAct } from "@services/billing/createAct.js";
import { createTozaMakonApi } from "@api/tozaMakon.js";
import { notificationService } from "@services/notification.js";
import { Admin } from "@models/Admin.js";
import { calculateKSaldo } from "@services/billing/calculateKSaldo.js";

export async function importActJob(
  job: Job<JobPayloads[typeof JobNames.ImportActs]>
) {
  try {
    const payload = job.attrs.data;

    console.log("=== ImportActs Job Started ===");
    console.log("Job ID:", job.attrs._id);
    console.log("Payload:", payload);

    const { acts, companyId, userId } = payload;

    console.log(`Total acts received: ${acts.length}`);

    // 1) Chunkga bo‘lish
    const chunks = chunkArray(acts, 10);
    console.log(`Chunk count: ${chunks.length}. Each chunk size: 10`);

    // 2) Har bir chunkni qayta ishlash
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(
        `Processing chunk #${i + 1}/${chunks.length} (size: ${chunk.length})`
      );

      await Promise.all(
        chunk.map(async (act, index) => {
          try {
            console.log(
              `→ Creating act [chunk ${i + 1}, item ${index + 1}]:`,
              act
            );

            const tozaMakonApi = createTozaMakonApi(companyId);

            const result = await createAct(tozaMakonApi, {
              ...act,
              kSaldo: await calculateKSaldo(tozaMakonApi, {
                actPackId: act.actPackId,
                actType: act.actType,
                amount: act.amount,
                residentId: act.residentId,
              }),
            });

            console.log(
              `✓ Act created successfully [chunk ${i + 1}, item ${index + 1}]`,
              {
                residentId: act.residentId,
                result,
              }
            );
          } catch (error: any) {
            console.error(
              `✗ Error creating act [chunk ${i + 1}, item ${index + 1}]`,
              {
                act,
                error: error?.response?.data || error,
              }
            );
          }
        })
      );
    }

    console.log("All chunks processed successfully.");

    // 3) Admin topish
    console.log("Fetching admin...");
    const admin = await Admin.findById(userId);

    if (!admin) {
      console.warn("⚠ Admin not found for userId:", userId);
    } else {
      console.log("Admin found:", admin.fullName);
    }

    // 4) Notifikatsiya jo‘natish
    console.log("Sending final notification to user...");

    notificationService.createNotification({
      message: `${acts.length} ta akt muvaffaqiyatli import qilindi.`,
      type: "info",
      sender: {
        id: "system",
        name: "GreenZone System",
      },
      receiver: {
        id: userId,
        name: admin?.fullName || "Admin",
      },
      data: { importedActsCount: acts.length },
    });

    console.log("Final notification sent.");
    console.log("=== ImportActs Job Finished ===");
  } catch (err) {
    console.error("🔥 Job crashed:", err);
  }
}
