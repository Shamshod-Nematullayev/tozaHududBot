import axios from "axios";

interface Payload {
  invoice: string;
  lang: "name";
}

interface Response {
  amount: number;
  balance: number | null;
  claimCaseNumber: null;
  court: string;
  courtId: number;
  courtOwnId: number;
  courtType: "CITIZEN";
  decisionDate: null;
  description: string;
  forAccount: string;
  historyList: any[];
  instance: null;
  invoiceStatus: "CREATED";
  isInFavor: boolean;
  issued: number;
  mustPayAmount: number;
  number: string;
  overdue: number;
  paidAmount: number;
  payCategory: "Почта харажатлари";
  payCategoryId: number;
  payer: string;
  payerId: number;
  payerPassport: null;
  payerTin: string;
  purpose: null;
  purposeId: null;
}

export async function createInvoice(payload: Payload): Promise<Response> {
  return (await axios.post("/cabinet/invoice", payload)).data;
}
