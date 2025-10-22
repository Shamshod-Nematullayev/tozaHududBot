import axios from "axios";

interface IJuridicalEntity {
  address: string;
  name: string;
  tin: string;
}

interface IPayload {
  amount: number;
  courtId: string;
  courtType: "CITIZEN";
  description: string;
  entityType: "JURIDICAL";
  isInFavor: boolean;
  overdue: number;
  payCategoryId: number;
  juridicalEntity: IJuridicalEntity;
}

interface IResponse {
  requestStatus: {
    code: number;
    message: string;
  };
  invoice: string;
  invoiceStatus: string;
  issueDate: number;
}

/**
 * Creates an invoice in the billing service.
 *
 * @param {IPayload} payload - The data to be sent in the request body.
 * @returns {Promise<IResponse>} A promise that resolves to the response data.
 * @example
 * const payload = {
 *     amount: 100000,
 *     courtId: "1234567890",
 *     courtType: "CITIZEN",
 *     description: "Test invoice",
 *     entityType: "JURIDICAL",
 *     isInFavor: true,
 *     overdue: 0,
 *     payCategoryId: 1,
 *     juridicalEntity: {
 *         address: "Test address",
 *         name: "Test name",
 *         tin: "123456789012"
 *     }
 * };
 * const data = await createInvoice(payload);
 * console.log(data);
 */

const headers = {
  Accept: "application/json, text/plain, */*",
  "Content-type": "application/json",
  referrer: "https://billing.sud.uz/create-receipt",
};
export async function createInvoice(
  payload: IPayload = {
    amount: 4120000,
    courtId: "562",
    courtType: "CITIZEN",
    description: "created by GreenZone",
    entityType: "JURIDICAL",
    isInFavor: true,
    juridicalEntity: {
      address: "Самарқанд вилояти, Каттақўрғон тумани, Mullako'rpa MFY, CHIM",
      name: '"ANVARJON BIZNES INVEST" MCHJ',
      tin: "303421898",
    },
    overdue: 0,
    payCategoryId: 3,
  }
): Promise<IResponse> {
  console.log({
    ...payload,
    amount: payload.amount * 100,
  });
  const data = (
    await axios.post(
      "https://billing.sud.uz/api/invoice/create",
      {
        ...payload,
        amount: payload.amount * 100,
      },
      {
        headers,
        timeout: 10000,
      }
    )
  ).data;
  return data;
}
