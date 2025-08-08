import { Axios } from "axios";
import { IPdfMail } from "types/hybrid";

export async function createPdfMail(
  hybridPochtaApi: Axios,
  params: {
    Address: string;
    Receiver: string;
    Document64: string;
    Region: string;
    Area: string;
  }
): Promise<IPdfMail> {
  return (await hybridPochtaApi.post("/PdfMail", params)).data;
}
