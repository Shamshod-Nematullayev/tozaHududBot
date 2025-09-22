import { Axios } from "axios";
import { packTypes } from "types/billing.js";

interface ActPack {
  companyId: number;
  createdDate: string;
  description: string;
  isActive: boolean;
  isSpecialPack: boolean;
  name: string;
  packType: packTypes;
}

/**
 * Akt pachkasi yaratish uchun TozaMakonga yuklash
 *
 * @param {Axios} tozaMakonApi - TozaMakon API
 * @param {ActPack} body - Akt pachkasi body
 * @returns {Promise<number>} - Akt pachkasi id
 */
export async function createActPack(
  tozaMakonApi: Axios,
  body: ActPack
): Promise<number> {
  return (await tozaMakonApi.post("/billing-service/act-packs", body)).data;
}
