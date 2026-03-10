import { Axios } from 'axios';
import { DHJRow } from 'types/billing';

export async function getResidentDHJByAbonentId(
  tozaMakonApi: Axios,
  residentId: number,
  params: {
    page: number;
    size: number;
  } = {
    size: 100,
    page: 0,
  }
): Promise<{
  content: DHJRow[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  number: number;
  size: number;
  empty: boolean;
}> {
  return (
    await tozaMakonApi.get(`/billing-service/resident-balances/dhsh`, {
      params: {
        ...params,
        residentId,
      },
    })
  ).data;
}
