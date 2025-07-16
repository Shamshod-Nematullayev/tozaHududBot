import { arizaDocumentTypes } from "@models/Ariza.js";
import { Company } from "@models/Company.js";
import { Axios } from "axios";
import { packNames, packTypes } from "types/billing";
import { formatDate } from "services/utils/formatDate";

/**
 * Akt pachkasi mavjud bo‘lmasa yaratadi va qaytaradi
 */

export async function getOrCreateActPackId(
  documentType: (typeof arizaDocumentTypes)[number],
  tozaMakonApi: Axios,
  companyId: number
): Promise<number> {
  const date = new Date();
  const company = await Company.findOne({ id: companyId });
  if (!company) throw new Error("Company not found");
  const packIds = company.akt_pachka_ids || {};
  let actPack = packIds[documentType];

  const isSameMonthYear =
    actPack &&
    actPack.month === date.getMonth() + 1 &&
    actPack.year === date.getFullYear();

  if (!isSameMonthYear) {
    const response = await tozaMakonApi.post("/billing-service/act-packs", {
      companyId,
      createdDate: formatDate(date),
      description: "created by service",
      isActive: true,
      isSpecialPack: false,
      name: actPack?.name || packNames[documentType],
      packType: actPack?.type || packTypes[documentType],
    });

    const packId = response.data;

    await Company.findOneAndUpdate(
      { id: companyId },
      {
        $set: {
          [`akt_pachka_ids.${documentType}`]: {
            id: packId,
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            type: actPack?.type || packTypes[documentType],
            name: actPack?.name || packNames[documentType],
          },
        },
      }
    );

    return packId;
  }

  return actPack.id;
}
